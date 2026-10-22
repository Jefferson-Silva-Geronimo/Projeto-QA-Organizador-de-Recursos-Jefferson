package br.senac.recursos.service;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.EventoAuditoria;
import br.senac.recursos.model.EventoNotificacao;
import br.senac.recursos.model.Reserva;
import br.senac.recursos.model.ReservaDaFila;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.model.regra.PoliticaDeDecisao;
import br.senac.recursos.repository.AuditoriaRepository;
import br.senac.recursos.repository.ReservaRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Decisão do Responsável sobre reservas que exigem aprovação (RF-07). Só o Responsável que não é o dono
 * aprova ou rejeita (RN-06, RN-16, RN-33). O perfil é verificado na camada de API; a posse e o estado,
 * aqui.
 */
@Service
public class AprovacaoService {

    private final ReservaRepository reservas;
    private final AuditoriaRepository auditoria;
    private final NotificacaoService notificacoes;
    private final Clock relogio;

    public AprovacaoService(ReservaRepository reservas, AuditoriaRepository auditoria, NotificacaoService notificacoes, Clock relogio) {
        this.reservas = reservas;
        this.auditoria = auditoria;
        this.notificacoes = notificacoes;
        this.relogio = relogio;
    }

    @Transactional
    public Reserva aprovar(UsuarioAutenticado ator, long id, String motivo) {
        Instant agora = relogio.instant();
        Reserva reserva = reservas.buscarTravando(id)
                .orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
        // Mesma política que alimenta podeAprovar na fila. D2 e D10: no instante de início a reserva já começou
        // e só resta o cancelamento por SEM_DECISAO.
        PoliticaDeDecisao.avaliarAprovacao(reserva.estado(), reserva.solicitanteId() == ator.id(), agora, reserva.inicio())
                .ifPresent(codigo -> {
                    throw new ErroDeNegocio(codigo);
                });
        String motivoGravado = vazioParaNulo(motivo);
        // O motivo da aprovação, opcional, fica em aprovacoes. Em reservas só guarda o motivo de cancelar e rejeitar.
        reservas.atualizar(id, reserva.titulo(), reserva.descricao(), reserva.periodo(), EstadoReserva.APROVADA,
                reserva.exigeAprovacao(), null, agora);
        reservas.registrarDecisao(id, ator.id(), true, motivoGravado, agora);
        auditoria.registrar(EventoAuditoria.transicaoDeUsuario(agora, ator.id(), id, "RESERVA_APROVADA",
                EstadoReserva.SOLICITADA.name(), EstadoReserva.APROVADA.name(), null, null, motivoGravado));
        notificacoes.aoSolicitante(id, reserva.solicitanteId(), EventoNotificacao.RESERVA_APROVADA);
        return reservas.buscar(id).orElseThrow();
    }

    @Transactional
    public Reserva rejeitar(UsuarioAutenticado ator, long id, String motivo) {
        Instant agora = relogio.instant();
        Reserva reserva = reservas.buscarTravando(id)
                .orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
        String motivoGravado = vazioParaNulo(motivo);
        // Mesma política que alimenta podeRejeitar na fila; o motivo é obrigatório (RN-24).
        PoliticaDeDecisao.avaliarRejeicao(reserva.estado(), reserva.solicitanteId() == ator.id(), motivoGravado != null)
                .ifPresent(codigo -> {
                    throw new ErroDeNegocio(codigo);
                });
        reservas.atualizar(id, reserva.titulo(), reserva.descricao(), reserva.periodo(), EstadoReserva.REJEITADA,
                reserva.exigeAprovacao(), motivoGravado, agora);
        reservas.inativarOcupacoes(id);
        reservas.registrarDecisao(id, ator.id(), false, motivoGravado, agora);
        auditoria.registrar(EventoAuditoria.transicaoDeUsuario(agora, ator.id(), id, "RESERVA_REJEITADA",
                EstadoReserva.SOLICITADA.name(), EstadoReserva.REJEITADA.name(), null, null, motivoGravado));
        notificacoes.aoSolicitante(id, reserva.solicitanteId(), EventoNotificacao.RESERVA_REJEITADA);
        return reservas.buscar(id).orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<ReservaDaFila> fila() {
        return reservas.listarFila();
    }

    private static String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
