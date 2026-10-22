package br.senac.recursos.service;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.EventoAuditoria;
import br.senac.recursos.model.Movimentacao;
import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Recurso;
import br.senac.recursos.model.Reserva;
import br.senac.recursos.model.TipoMovimentacao;
import br.senac.recursos.model.TipoRecurso;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.model.regra.PermissoesDeUso;
import br.senac.recursos.model.regra.PoliticaDeUso;
import br.senac.recursos.repository.AuditoriaRepository;
import br.senac.recursos.repository.ConfiguracaoRepository;
import br.senac.recursos.repository.MovimentacaoRepository;
import br.senac.recursos.repository.RecursoRepository;
import br.senac.recursos.repository.ReservaRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Uso da reserva: início, retirada, devolução, conclusão e não comparecimento (RF-09, RF-16).
 * Só o Responsável registra (RN-20); o Responsável dono opera a própria reserva, com o ator auditado
 * (D13). Toda mudança grava auditoria na mesma transação (RN-08).
 */
@Service
public class UsoService {

    private final ReservaRepository reservas;
    private final RecursoRepository recursos;
    private final MovimentacaoRepository movimentacoes;
    private final ConfiguracaoRepository configuracao;
    private final AuditoriaRepository auditoria;
    private final Clock relogio;

    public UsoService(ReservaRepository reservas, RecursoRepository recursos, MovimentacaoRepository movimentacoes,
                      ConfiguracaoRepository configuracao, AuditoriaRepository auditoria, Clock relogio) {
        this.reservas = reservas;
        this.recursos = recursos;
        this.movimentacoes = movimentacoes;
        this.configuracao = configuracao;
        this.auditoria = auditoria;
        this.relogio = relogio;
    }

    @Transactional
    public Reserva iniciar(UsuarioAutenticado ator, long id) {
        Reserva r = carregar(id);
        recusarSeHouver(PoliticaDeUso.avaliarInicio(r.estado()));
        return mudarEstado(ator, r, EstadoReserva.EM_USO, "RESERVA_INICIADA", relogio.instant());
    }

    @Transactional
    public Reserva retirar(UsuarioAutenticado ator, long id, long materialId) {
        Reserva r = carregar(id);
        if (r.estado() != EstadoReserva.APROVADA && r.estado() != EstadoReserva.EM_USO) {
            throw new ErroDeNegocio(CodigoErro.TRANSICAO_PROIBIDA);
        }
        exigirMaterialDaReserva(r, materialId);
        recusarSeHouver(PoliticaDeUso.avaliarRetirada(movimentacoes.ultimaPorMaterial(id).get(materialId)));
        Instant agora = relogio.instant();
        movimentacoes.registrar(id, materialId, TipoMovimentacao.RETIRADA, ator.id(), agora);
        auditoria.registrar(EventoAuditoria.transicaoDeUsuario(agora, ator.id(), id, "MATERIAL_RETIRADO",
                null, null, null, Map.of("materialId", materialId), null));
        if (r.estado() == EstadoReserva.APROVADA) {
            return mudarEstado(ator, r, EstadoReserva.EM_USO, "RESERVA_INICIADA", agora);
        }
        return r;
    }

    @Transactional
    public Reserva devolver(UsuarioAutenticado ator, long id, long materialId) {
        Reserva r = carregar(id);
        if (r.estado() != EstadoReserva.EM_USO) {
            throw new ErroDeNegocio(CodigoErro.TRANSICAO_PROIBIDA);
        }
        exigirMaterialDaReserva(r, materialId);
        recusarSeHouver(PoliticaDeUso.avaliarDevolucao(movimentacoes.ultimaPorMaterial(id).get(materialId)));
        Instant agora = relogio.instant();
        movimentacoes.registrar(id, materialId, TipoMovimentacao.DEVOLUCAO, ator.id(), agora);
        auditoria.registrar(EventoAuditoria.transicaoDeUsuario(agora, ator.id(), id, "MATERIAL_DEVOLVIDO",
                null, null, null, Map.of("materialId", materialId), null));
        return r;
    }

    @Transactional
    public Reserva concluir(UsuarioAutenticado ator, long id) {
        Reserva r = carregar(id);
        List<String> pendentes = movimentacoes.ultimaPorMaterial(id).entrySet().stream()
                .filter(e -> e.getValue() == TipoMovimentacao.RETIRADA)
                .map(e -> String.valueOf(e.getKey())).toList();
        PoliticaDeUso.avaliarConclusao(r.estado(), !pendentes.isEmpty()).ifPresent(codigo -> {   // RN-23
            throw codigo == CodigoErro.MATERIAL_PENDENTE
                    ? new ErroDeNegocio(codigo, codigo.mensagemPadrao(), pendentes) : new ErroDeNegocio(codigo);
        });
        Instant agora = relogio.instant();
        Reserva concluida = mudarEstado(ator, r, EstadoReserva.CONCLUIDA, "RESERVA_CONCLUIDA", agora);
        reservas.inativarOcupacoes(id);
        return concluida;
    }

    @Transactional
    public Reserva marcarNaoCompareceu(UsuarioAutenticado ator, long id) {
        Reserva r = carregar(id);
        Instant agora = relogio.instant();
        recusarSeHouver(PoliticaDeUso.avaliarNaoComparecimento(r.estado(), configuracao.toleranciaNaoComparecimento(),
                agora, r.inicio()));
        Reserva marcada = mudarEstado(ator, r, EstadoReserva.NAO_COMPARECEU, "RESERVA_NAO_COMPARECEU", agora);
        reservas.inativarOcupacoes(id);
        return marcada;
    }

    /**
     * O que o usuário pode fazer no uso de cada reserva (F6-16), pelas mesmas regras que recusam a operação e pelo
     * relógio injetado. A tolerância é lida uma vez por chamada, e o material pendente só é consultado para reserva
     * em uso. Só o Responsável recebe ação (RN-20); para os outros perfis nada é consultado.
     */
    @Transactional(readOnly = true)
    public Map<Long, PermissoesDeUso> permissoes(UsuarioAutenticado ator, List<Reserva> lista) {
        Map<Long, PermissoesDeUso> resultado = new HashMap<>();
        if (ator.perfil() != Perfil.RESPONSAVEL) {
            lista.forEach(r -> resultado.put(r.id(), PermissoesDeUso.nenhuma()));
            return resultado;
        }
        Instant agora = relogio.instant();
        Optional<Duration> tolerancia = lista.stream().anyMatch(r -> r.estado() == EstadoReserva.APROVADA)
                ? configuracao.toleranciaNaoComparecimento() : Optional.empty();
        for (Reserva r : lista) {
            boolean pendente = r.estado() == EstadoReserva.EM_USO
                    && movimentacoes.ultimaPorMaterial(r.id()).containsValue(TipoMovimentacao.RETIRADA);
            resultado.put(r.id(), PermissoesDeUso.de(r, ator.perfil(), pendente, tolerancia, agora));
        }
        return resultado;
    }

    @Transactional(readOnly = true)
    public List<Movimentacao> historico(UsuarioAutenticado ator, long id) {
        Reserva r = reservas.buscar(id).orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
        if (r.solicitanteId() != ator.id() && ator.perfil() == Perfil.SOLICITANTE) {
            throw new ErroDeNegocio(CodigoErro.ACESSO_NEGADO);
        }
        return movimentacoes.listar(id);
    }

    // ---- apoio

    /** As recusas do uso vêm de {@link PoliticaDeUso}, a mesma regra que alimenta os campos "pode..." das respostas. */
    private static void recusarSeHouver(Optional<CodigoErro> recusa) {
        recusa.ifPresent(codigo -> {
            throw new ErroDeNegocio(codigo);
        });
    }

    private Reserva carregar(long id) {
        return reservas.buscarTravando(id).orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
    }

    private void exigirMaterialDaReserva(Reserva r, long materialId) {
        boolean daReserva = r.recursoIds().contains(materialId);
        boolean ehMaterial = daReserva && recursos.buscarPorId(materialId)
                .map(Recurso::tipo).filter(t -> t == TipoRecurso.MATERIAL).isPresent();
        if (!ehMaterial) {
            throw new ErroDeNegocio(CodigoErro.MATERIAL_FORA_DA_RESERVA);
        }
    }

    private Reserva mudarEstado(UsuarioAutenticado ator, Reserva r, EstadoReserva novo, String acao, Instant agora) {
        reservas.atualizar(r.id(), r.titulo(), r.descricao(), r.periodo(), novo, r.exigeAprovacao(), null, agora);
        auditoria.registrar(EventoAuditoria.transicaoDeUsuario(agora, ator.id(), r.id(), acao,
                r.estado().name(), novo.name(), null, null, null));
        return reservas.buscar(r.id()).orElseThrow();
    }
}
