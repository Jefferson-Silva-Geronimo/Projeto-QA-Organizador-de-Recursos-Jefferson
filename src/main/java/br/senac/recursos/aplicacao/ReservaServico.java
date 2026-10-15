package br.senac.recursos.aplicacao;

import br.senac.recursos.aplicacao.porta.AuditoriaRepositorio;
import br.senac.recursos.aplicacao.porta.AuditoriaRepositorio.Entidade;
import br.senac.recursos.aplicacao.porta.AuditoriaRepositorio.Evento;
import br.senac.recursos.aplicacao.porta.ConfiguracaoRepositorio;
import br.senac.recursos.aplicacao.porta.RecursoRepositorio;
import br.senac.recursos.aplicacao.porta.RecursoRepositorio.Detalhe;
import br.senac.recursos.aplicacao.porta.ReservaRepositorio;
import br.senac.recursos.aplicacao.porta.ReservaRepositorio.Registro;
import br.senac.recursos.aplicacao.porta.TentativaConflitoRepositorio;
import br.senac.recursos.aplicacao.porta.TentativaConflitoRepositorio.Motivo;
import br.senac.recursos.dominio.CodigoErro;
import br.senac.recursos.dominio.ErroDeNegocio;
import br.senac.recursos.dominio.EstadoReserva;
import br.senac.recursos.dominio.JanelaDeFuncionamento;
import br.senac.recursos.dominio.Perfil;
import br.senac.recursos.dominio.Periodo;
import br.senac.recursos.dominio.PoliticaDeAlteracao;
import br.senac.recursos.dominio.PoliticaDeCancelamento;
import br.senac.recursos.dominio.RegrasDeReserva;
import br.senac.recursos.dominio.TipoRecurso;
import br.senac.recursos.dominio.UsuarioAutenticado;
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
import org.springframework.dao.DataIntegrityViolationException;
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
public class ReservaServico {

    private static final String SQLSTATE_VIOLACAO_DE_EXCLUSAO = "23P01";

    /** Dados para criar uma reserva. */
    public record NovaReserva(String titulo, String descricao, Periodo periodo, List<Long> recursoIds) {
    }

    /** Alteração parcial. Campos nulos não mudam. */
    public record Alteracao(String titulo, String descricao, Instant inicio, Instant fim, List<Long> recursoIds) {
    }

    /** Recusa de alocação detectada dentro da transação. Dispara o desfazer e o registro da tentativa. */
    private static final class ConflitoDeAlocacao extends RuntimeException {
        private static final long serialVersionUID = 1L;
        private final long recursoId;
        private final transient Motivo motivo;
        private final transient Periodo periodo;
        private final long solicitanteId;

        ConflitoDeAlocacao(long recursoId, Motivo motivo, Periodo periodo, long solicitanteId) {
            super(null, null, false, false);
            this.recursoId = recursoId;
            this.motivo = motivo;
            this.periodo = periodo;
            this.solicitanteId = solicitanteId;
        }
    }

    private final ReservaRepositorio reservas;
    private final RecursoRepositorio recursos;
    private final AuditoriaRepositorio auditoria;
    private final TentativaConflitoRepositorio tentativas;
    private final ConfiguracaoRepositorio configuracao;
    private final TransactionTemplate transacao;
    private final Clock relogio;

    public ReservaServico(ReservaRepositorio reservas, RecursoRepositorio recursos, AuditoriaRepositorio auditoria,
                          TentativaConflitoRepositorio tentativas, ConfiguracaoRepositorio configuracao,
                          TransactionTemplate transacao, Clock relogio) {
        this.reservas = reservas;
        this.recursos = recursos;
        this.auditoria = auditoria;
        this.tentativas = tentativas;
        this.configuracao = configuracao;
        this.transacao = transacao;
        this.relogio = relogio;
    }

    public Registro criar(UsuarioAutenticado ator, NovaReserva dados) {
        try {
            return transacao.execute(status -> criarNaTransacao(ator, dados));
        } catch (ConflitoDeAlocacao conflito) {
            throw registrarEConverter(conflito);
        }
    }

    public Registro alterar(UsuarioAutenticado ator, long id, Alteracao alteracao) {
        try {
            return transacao.execute(status -> alterarNaTransacao(ator, id, alteracao));
        } catch (ConflitoDeAlocacao conflito) {
            throw registrarEConverter(conflito);
        }
    }

    public Registro cancelar(UsuarioAutenticado ator, long id, String motivo) {
        return transacao.execute(status -> cancelarNaTransacao(ator, id, motivo));
    }

    public Registro obter(UsuarioAutenticado ator, long id) {
        Registro reserva = reservas.buscar(id).orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
        exigirVisibilidade(ator, reserva);
        return reserva;
    }

    public List<Registro> listar(UsuarioAutenticado ator) {
        return reservas.listar(ator.perfil() == Perfil.SOLICITANTE ? ator.id() : null);
    }

    // ---- criação

    private Registro criarNaTransacao(UsuarioAutenticado ator, NovaReserva dados) {
        Instant agora = relogio.instant();
        RegrasDeReserva.exigirInicioFuturo(dados.periodo(), agora);
        List<Detalhe> alocados = carregarEValidar(dados.recursoIds(), dados.periodo());
        boolean exigeAprovacao = alocados.stream().anyMatch(Detalhe::restrito);

        verificarConflitos(alocados, dados.periodo(), null, ator.id());

        long id = reservas.inserir(ator.id(), dados.titulo(), dados.descricao(), dados.periodo(),
                EstadoReserva.SOLICITADA, exigeAprovacao, agora);
        inserirOcupacoes(id, alocados, dados.periodo(), ator.id());

        auditoria.registrar(Evento.transicaoDeUsuario(agora, ator.id(), id, "RESERVA_CRIADA", null,
                EstadoReserva.SOLICITADA.name(), null, visao(dados.titulo(), dados.periodo(), alocados), null));

        if (!exigeAprovacao) {
            reservas.atualizar(id, dados.titulo(), dados.descricao(), dados.periodo(), EstadoReserva.APROVADA,
                    false, null, agora);
            auditoria.registrar(Evento.transicaoDoSistema(agora, id, "RESERVA_APROVADA",
                    EstadoReserva.SOLICITADA.name(), EstadoReserva.APROVADA.name(), null));
        }
        return reservas.buscar(id).orElseThrow();
    }

    // ---- alteração

    private Registro alterarNaTransacao(UsuarioAutenticado ator, long id, Alteracao alteracao) {
        Instant agora = relogio.instant();
        Registro atual = reservas.buscarTravando(id)
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
        List<Detalhe> alocados = null;

        if (mudouPeriodo || mudouRecursos) {
            if (mudouPeriodo) {
                RegrasDeReserva.exigirInicioFuturo(periodo, agora);
            }
            alocados = carregarEValidar(idsNovos, periodo);
            verificarConflitos(alocados, periodo, id, ator.id());
            reservas.removerOcupacoes(id);
            inserirOcupacoes(id, alocados, periodo, ator.id());
            if (mudouRecursos) {
                exigeAprovacao = alocados.stream().anyMatch(Detalhe::restrito);   // D12
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
        Evento alterada = Evento.transicaoDeUsuario(agora, ator.id(), id, "RESERVA_ALTERADA",
                mudouEstado ? atual.estado().name() : null, mudouEstado ? estadoNovo.name() : null,
                antes, depois, null);
        auditoria.registrar(alterada);
        if (mudouEstado && estadoNovo == EstadoReserva.APROVADA) {
            auditoria.registrar(Evento.transicaoDoSistema(agora, id, "RESERVA_APROVADA",
                    EstadoReserva.SOLICITADA.name(), EstadoReserva.APROVADA.name(), null));
        }
        return reservas.buscar(id).orElseThrow();
    }

    // ---- cancelamento

    private Registro cancelarNaTransacao(UsuarioAutenticado ator, long id, String motivo) {
        Instant agora = relogio.instant();
        Registro atual = reservas.buscarTravando(id)
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
        auditoria.registrar(Evento.transicaoDeUsuario(agora, ator.id(), id, "RESERVA_CANCELADA",
                atual.estado().name(), EstadoReserva.CANCELADA.name(), null, null, motivoGravado));
        return reservas.buscar(id).orElseThrow();
    }

    // ---- apoio

    private List<Detalhe> carregarEValidar(List<Long> ids, Periodo periodo) {
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
        List<Detalhe> alocados = new ArrayList<>();
        for (Long id : distintos) {
            Detalhe d = recursos.buscarPorId(id).orElseThrow();
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
    private void verificarConflitos(List<Detalhe> alocados, Periodo periodo, Long ignorar, long solicitanteId) {
        for (Detalhe d : alocados) {
            reservas.buscarConflito(d.id(), periodo, ignorar).ifPresent(c -> {
                throw new ConflitoDeAlocacao(d.id(), c.manutencao() ? Motivo.MANUTENCAO : Motivo.SOBREPOSICAO,
                        periodo, solicitanteId);
            });
        }
    }

    /** Insere as ocupações em ordem de recurso, para que duas transações travem na mesma ordem. */
    private void inserirOcupacoes(long reservaId, List<Detalhe> alocados, Periodo periodo, long solicitanteId) {
        for (Detalhe d : alocados) {
            try {
                reservas.inserirOcupacao(reservaId, d.id(), periodo);
            } catch (DataIntegrityViolationException e) {
                if (ehViolacaoDeExclusao(e)) {
                    throw new ConflitoDeAlocacao(d.id(), Motivo.CONCORRENCIA, periodo, solicitanteId);
                }
                throw e;
            }
        }
    }

    private static boolean ehViolacaoDeExclusao(Throwable e) {
        Throwable causa = NestedExceptionUtils.getMostSpecificCause(e);
        return causa instanceof SQLException sql && SQLSTATE_VIOLACAO_DE_EXCLUSAO.equals(sql.getSQLState());
    }

    private ErroDeNegocio registrarEConverter(ConflitoDeAlocacao c) {
        // A transação da reserva já foi desfeita. A tentativa é gravada em transação própria (RN-30).
        tentativas.registrar(c.recursoId, c.periodo, c.solicitanteId, c.motivo, relogio.instant());
        CodigoErro codigo = c.motivo == Motivo.MANUTENCAO
                ? CodigoErro.RECURSO_EM_MANUTENCAO : CodigoErro.CONFLITO_DE_ALOCACAO;
        return new ErroDeNegocio(codigo, codigo.mensagemPadrao(), List.of(String.valueOf(c.recursoId)));
    }

    private void exigirVisibilidade(UsuarioAutenticado ator, Registro reserva) {
        boolean dono = reserva.solicitanteId() == ator.id();
        if (!dono && ator.perfil() == Perfil.SOLICITANTE) {
            throw new ErroDeNegocio(CodigoErro.ACESSO_NEGADO);
        }
    }

    private static List<Long> ordenados(List<Long> ids) {
        return new ArrayList<>(new TreeSet<>(ids));
    }

    private static Map<String, Object> visao(String titulo, Periodo periodo, List<Detalhe> alocados) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("titulo", titulo);
        m.put("inicio", periodo.inicio().toString());
        m.put("fim", periodo.fim().toString());
        m.put("recursoIds", alocados.stream().map(Detalhe::id).toList());
        return m;
    }
}
