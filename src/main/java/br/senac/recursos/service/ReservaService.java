package br.senac.recursos.service;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.AlteracaoDeReserva;
import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.EventoAuditoria;
import br.senac.recursos.model.MotivoConflito;
import br.senac.recursos.model.NovaReserva;
import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Periodo;
import br.senac.recursos.model.Recurso;
import br.senac.recursos.model.Reserva;
import br.senac.recursos.model.TipoRecurso;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.model.regra.JanelaDeFuncionamento;
import br.senac.recursos.model.regra.PoliticaDeAlteracao;
import br.senac.recursos.model.regra.PoliticaDeCancelamento;
import br.senac.recursos.model.regra.RegrasDeReserva;
import br.senac.recursos.repository.AuditoriaRepository;
import br.senac.recursos.repository.ConfiguracaoRepository;
import br.senac.recursos.repository.RecursoRepository;
import br.senac.recursos.repository.ReservaRepository;
import br.senac.recursos.repository.TentativaConflitoRepository;
import java.sql.SQLException;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Casos de uso de reserva: criar, alterar, cancelar e consultar (RF-04, RF-05, RF-06).
 *
 * <p>Cada operação de escrita roda em uma transação, que grava reserva, ocupações e auditoria juntas
 * (ADR-006). A garantia contra dupla reserva é a constraint de exclusão do banco (ADR-003). Quando a
 * alocação é recusada, a transação é desfeita e só depois a tentativa de conflito é gravada, em
 * transação própria (RN-30).
 */
@Service
public class ReservaService {

    private static final String SQLSTATE_VIOLACAO_DE_EXCLUSAO = "23P01";
    private static final String SQLSTATE_IMPASSE = "40P01";

    /** Recusa de alocação detectada dentro da transação. Dispara o desfazer e o registro da tentativa. */
    private static final class ConflitoDeAlocacao extends RuntimeException {
        private static final long serialVersionUID = 1L;
        private final long recursoId;
        private final transient MotivoConflito motivo;
        private final transient Periodo periodo;
        private final long solicitanteId;

        ConflitoDeAlocacao(long recursoId, MotivoConflito motivo, Periodo periodo, long solicitanteId) {
            super(null, null, false, false);
            this.recursoId = recursoId;
            this.motivo = motivo;
            this.periodo = periodo;
            this.solicitanteId = solicitanteId;
        }
    }

    private final ReservaRepository reservas;
    private final RecursoRepository recursos;
    private final AuditoriaRepository auditoria;
    private final TentativaConflitoRepository tentativas;
    private final ConfiguracaoRepository configuracao;
    private final TransactionTemplate transacao;
    private final Clock relogio;

    public ReservaService(ReservaRepository reservas, RecursoRepository recursos, AuditoriaRepository auditoria,
                          TentativaConflitoRepository tentativas, ConfiguracaoRepository configuracao,
                          TransactionTemplate transacao, Clock relogio) {
        this.reservas = reservas;
        this.recursos = recursos;
        this.auditoria = auditoria;
        this.tentativas = tentativas;
        this.configuracao = configuracao;
        this.transacao = transacao;
        this.relogio = relogio;
    }

    public Reserva criar(UsuarioAutenticado ator, NovaReserva dados) {
        try {
            return transacao.execute(status -> criarNaTransacao(ator, dados));
        } catch (ConflitoDeAlocacao conflito) {
            throw registrarEConverter(conflito);
        }
    }

    public Reserva alterar(UsuarioAutenticado ator, long id, AlteracaoDeReserva alteracao) {
        try {
            return transacao.execute(status -> alterarNaTransacao(ator, id, alteracao));
        } catch (ConflitoDeAlocacao conflito) {
            throw registrarEConverter(conflito);
        }
    }

    public Reserva cancelar(UsuarioAutenticado ator, long id, String motivo) {
        return transacao.execute(status -> cancelarNaTransacao(ator, id, motivo));
    }

    public Reserva obter(UsuarioAutenticado ator, long id) {
        Reserva reserva = reservas.buscar(id).orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
        exigirVisibilidade(ator, reserva);
        return reserva;
    }

    public List<Reserva> listar(UsuarioAutenticado ator) {
        return reservas.listar(ator.perfil() == Perfil.SOLICITANTE ? ator.id() : null);
    }

    // ---- criação

    private Reserva criarNaTransacao(UsuarioAutenticado ator, NovaReserva dados) {
        Instant agora = relogio.instant();
        RegrasDeReserva.exigirInicioFuturo(dados.periodo(), agora);
        List<Recurso> alocados = carregarEValidar(dados.recursoIds(), dados.periodo());
        boolean exigeAprovacao = alocados.stream().anyMatch(Recurso::restrito);

        verificarConflitos(alocados, dados.periodo(), null, ator.id());

        long id = reservas.inserir(ator.id(), dados.titulo(), dados.descricao(), dados.periodo(),
                EstadoReserva.SOLICITADA, exigeAprovacao, agora);
        inserirOcupacoes(id, alocados, dados.periodo(), ator.id());

        auditoria.registrar(EventoAuditoria.transicaoDeUsuario(agora, ator.id(), id, "RESERVA_CRIADA", null,
                EstadoReserva.SOLICITADA.name(), null, visao(dados.titulo(), dados.periodo(), alocados), null));

        if (!exigeAprovacao) {
            reservas.atualizar(id, dados.titulo(), dados.descricao(), dados.periodo(), EstadoReserva.APROVADA,
                    false, null, agora);
            auditoria.registrar(EventoAuditoria.transicaoDoSistema(agora, id, "RESERVA_APROVADA",
                    EstadoReserva.SOLICITADA.name(), EstadoReserva.APROVADA.name(), null));
        }
        return reservas.buscar(id).orElseThrow();
    }

    // ---- alteração

    private Reserva alterarNaTransacao(UsuarioAutenticado ator, long id, AlteracaoDeReserva alteracao) {
        Instant agora = relogio.instant();
        Reserva atual = reservas.buscarTravando(id)
                .orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
        boolean dono = atual.solicitanteId() == ator.id();
        PoliticaDeAlteracao.avaliar(atual.estado(), dono, agora, atual.inicio()).ifPresent(codigo -> {
            throw new ErroDeNegocio(codigo);
        });

        String titulo = alteracao.titulo() != null ? alteracao.titulo() : atual.titulo();
        String descricao = alteracao.descricao() != null ? alteracao.descricao() : atual.descricao();
        Instant inicio = alteracao.inicio() != null ? alteracao.inicio() : atual.inicio();
        Instant fim = alteracao.fim() != null ? alteracao.fim() : atual.fim();
        Periodo periodo = new Periodo(inicio, fim);
        List<Long> idsNovos = alteracao.recursoIds() != null ? ordenados(alteracao.recursoIds()) : atual.recursoIds();

        boolean mudouPeriodo = !periodo.equals(atual.periodo());
        boolean mudouRecursos = !idsNovos.equals(atual.recursoIds());
        boolean exigeAprovacao = atual.exigeAprovacao();
        EstadoReserva estadoNovo = atual.estado();
        List<Recurso> alocados = null;

        if (mudouPeriodo || mudouRecursos) {
            if (mudouPeriodo) {
                RegrasDeReserva.exigirInicioFuturo(periodo, agora);
            }
            alocados = carregarEValidar(idsNovos, periodo);
            verificarConflitos(alocados, periodo, id, ator.id());
            reservas.removerOcupacoes(id);
            inserirOcupacoes(id, alocados, periodo, ator.id());
            if (mudouRecursos) {
                exigeAprovacao = alocados.stream().anyMatch(Recurso::restrito);   // D12
            }
            if (atual.estado() == EstadoReserva.APROVADA && exigeAprovacao) {
                estadoNovo = EstadoReserva.SOLICITADA;                              // RN-19, D12
            } else if (atual.estado() == EstadoReserva.SOLICITADA && !exigeAprovacao && mudouRecursos) {
                estadoNovo = EstadoReserva.APROVADA;                                // D12, caso inverso
            }
        }

        boolean mudouTitulo = !titulo.equals(atual.titulo())
                || (descricao != null && !descricao.equals(atual.descricao()));
        if (!mudouPeriodo && !mudouRecursos && !mudouTitulo) {
            return atual;
        }

        reservas.atualizar(id, titulo, descricao, periodo, estadoNovo, exigeAprovacao, null, agora);

        Map<String, Object> antes = new LinkedHashMap<>();
        Map<String, Object> depois = new LinkedHashMap<>();
        if (!titulo.equals(atual.titulo())) {
            antes.put("titulo", atual.titulo());
            depois.put("titulo", titulo);
        }
        if (mudouPeriodo) {
            antes.put("inicio", atual.inicio().toString());
            antes.put("fim", atual.fim().toString());
            depois.put("inicio", periodo.inicio().toString());
            depois.put("fim", periodo.fim().toString());
        }
        if (mudouRecursos) {
            antes.put("recursoIds", atual.recursoIds());
            depois.put("recursoIds", idsNovos);
        }
        boolean mudouEstado = estadoNovo != atual.estado();
        EventoAuditoria alterada = EventoAuditoria.transicaoDeUsuario(agora, ator.id(), id, "RESERVA_ALTERADA",
                mudouEstado ? atual.estado().name() : null, mudouEstado ? estadoNovo.name() : null,
                antes, depois, null);
        auditoria.registrar(alterada);
        if (mudouEstado && estadoNovo == EstadoReserva.APROVADA) {
            auditoria.registrar(EventoAuditoria.transicaoDoSistema(agora, id, "RESERVA_APROVADA",
                    EstadoReserva.SOLICITADA.name(), EstadoReserva.APROVADA.name(), null));
        }
        return reservas.buscar(id).orElseThrow();
    }

    // ---- cancelamento

    private Reserva cancelarNaTransacao(UsuarioAutenticado ator, long id, String motivo) {
        Instant agora = relogio.instant();
        Reserva atual = reservas.buscarTravando(id)
                .orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
        boolean dono = atual.solicitanteId() == ator.id();
        boolean comMotivo = motivo != null && !motivo.isBlank();
        PoliticaDeCancelamento.avaliar(atual.estado(), ator.perfil(), dono, agora, atual.inicio(), comMotivo)
                .ifPresent(codigo -> {
                    throw new ErroDeNegocio(codigo);
                });

        String motivoGravado = comMotivo ? motivo.trim() : null;
        reservas.atualizar(id, atual.titulo(), atual.descricao(), atual.periodo(), EstadoReserva.CANCELADA,
                atual.exigeAprovacao(), motivoGravado, agora);
        reservas.inativarOcupacoes(id);
        auditoria.registrar(EventoAuditoria.transicaoDeUsuario(agora, ator.id(), id, "RESERVA_CANCELADA",
                atual.estado().name(), EstadoReserva.CANCELADA.name(), null, null, motivoGravado));
        return reservas.buscar(id).orElseThrow();
    }

    // ---- apoio

    private List<Recurso> carregarEValidar(List<Long> ids, Periodo periodo) {
        List<Long> distintos = ordenados(ids);
        if (distintos.isEmpty()) {
            throw new ErroDeNegocio(CodigoErro.VALIDACAO_FALHOU, "Informe ao menos um recurso.");
        }
        // Trava compartilhada, em ordem de identificador: impede desativação concorrente (ADR-003).
        List<Long> existentes = recursos.travarCompartilhado(distintos);
        if (existentes.size() != distintos.size()) {
            throw new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO, "Um dos recursos informados não existe.");
        }
        ZoneId fuso = configuracao.fuso();
        List<Recurso> alocados = new ArrayList<>();
        for (Long id : distintos) {
            Recurso d = recursos.buscarPorId(id).orElseThrow();
            if (!d.ativo()) {
                throw new ErroDeNegocio(CodigoErro.RECURSO_INATIVO);
            }
            if (d.tipo() == TipoRecurso.SALA) {
                new JanelaDeFuncionamento(d.horaAbertura(), d.horaFechamento(),
                        d.diasFuncionamento().stream().map(DayOfWeek::of).collect(java.util.stream.Collectors.toSet()))
                        .verificar(periodo, fuso);
            }
            alocados.add(d);
        }
        return alocados;
    }

    /** Verificação prévia, só para devolver uma mensagem clara. A garantia é a constraint do banco. */
    private void verificarConflitos(List<Recurso> alocados, Periodo periodo, Long ignorar, long solicitanteId) {
        for (Recurso d : alocados) {
            reservas.buscarConflito(d.id(), periodo, ignorar).ifPresent(c -> {
                throw new ConflitoDeAlocacao(d.id(), c.manutencao() ? MotivoConflito.MANUTENCAO : MotivoConflito.SOBREPOSICAO,
                        periodo, solicitanteId);
            });
        }
    }

    /** Insere as ocupações em ordem de recurso, para que duas transações travem na mesma ordem. */
    private void inserirOcupacoes(long reservaId, List<Recurso> alocados, Periodo periodo, long solicitanteId) {
        for (Recurso d : alocados) {
            try {
                reservas.inserirOcupacao(reservaId, d.id(), periodo);
            } catch (DataAccessException e) {
                if (ehConflitoDeConcorrencia(e)) {
                    throw new ConflitoDeAlocacao(d.id(), MotivoConflito.CONCORRENCIA, periodo, solicitanteId);
                }
                throw e;
            }
        }
    }

    /**
     * Duas transações que inserem ocupações sobrepostas ao mesmo tempo terminam em violação da constraint
     * de exclusão (23P01) ou, quando cada uma espera a outra, em impasse detectado pelo banco (40P01).
     * Nos dois casos as alocações se sobrepõem e uma delas perde: o pedido é tratado como conflito, sem
     * repetição automática (ADR-003).
     */
    private static boolean ehConflitoDeConcorrencia(Throwable e) {
        Throwable causa = NestedExceptionUtils.getMostSpecificCause(e);
        if (!(causa instanceof SQLException sql)) {
            return false;
        }
        return SQLSTATE_VIOLACAO_DE_EXCLUSAO.equals(sql.getSQLState())
                || SQLSTATE_IMPASSE.equals(sql.getSQLState());
    }

    private ErroDeNegocio registrarEConverter(ConflitoDeAlocacao c) {
        // A transação da reserva já foi desfeita. A tentativa é gravada em transação própria (RN-30).
        tentativas.registrar(c.recursoId, c.periodo, c.solicitanteId, c.motivo, relogio.instant());
        CodigoErro codigo = c.motivo == MotivoConflito.MANUTENCAO
                ? CodigoErro.RECURSO_EM_MANUTENCAO : CodigoErro.CONFLITO_DE_ALOCACAO;
        return new ErroDeNegocio(codigo, codigo.mensagemPadrao(), List.of(String.valueOf(c.recursoId)));
    }

    private void exigirVisibilidade(UsuarioAutenticado ator, Reserva reserva) {
        boolean dono = reserva.solicitanteId() == ator.id();
        if (!dono && ator.perfil() == Perfil.SOLICITANTE) {
            throw new ErroDeNegocio(CodigoErro.ACESSO_NEGADO);
        }
    }

    private static List<Long> ordenados(List<Long> ids) {
        return new ArrayList<>(new TreeSet<>(ids));
    }

    private static Map<String, Object> visao(String titulo, Periodo periodo, List<Recurso> alocados) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("titulo", titulo);
        m.put("inicio", periodo.inicio().toString());
        m.put("fim", periodo.fim().toString());
        m.put("recursoIds", alocados.stream().map(Recurso::id).toList());
        return m;
    }
}
