package br.senac.recursos.aplicacao;

import br.senac.recursos.aplicacao.porta.AuditoriaRepositorio;
import br.senac.recursos.aplicacao.porta.AuditoriaRepositorio.Evento;
import br.senac.recursos.aplicacao.porta.ReservaRepositorio;
import br.senac.recursos.aplicacao.porta.ReservaRepositorio.Registro;
import br.senac.recursos.dominio.CodigoErro;
import br.senac.recursos.dominio.ErroDeNegocio;
import br.senac.recursos.dominio.EstadoReserva;
import br.senac.recursos.dominio.MaquinaDeEstados;
import br.senac.recursos.dominio.UsuarioAutenticado;
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
public class AprovacaoServico {

    private final ReservaRepositorio reservas;
    private final AuditoriaRepositorio auditoria;
    private final Clock relogio;

    public AprovacaoServico(ReservaRepositorio reservas, AuditoriaRepositorio auditoria, Clock relogio) {
        this.reservas = reservas;
        this.auditoria = auditoria;
        this.relogio = relogio;
    }

    @Transactional
    public Registro aprovar(UsuarioAutenticado ator, long id, String motivo) {
        Instant agora = relogio.instant();
        Registro reserva = reservas.buscarTravando(id)
                .orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
        exigirNaoDono(ator, reserva);
        MaquinaDeEstados.exigir(reserva.estado(), EstadoReserva.APROVADA);
        if (reserva.estado() != EstadoReserva.SOLICITADA) {
            throw new ErroDeNegocio(CodigoErro.TRANSICAO_PROIBIDA);
        }
        if (!agora.isBefore(reserva.inicio())) {
            // D2 e D10: no instante de início a reserva já começou e só resta o cancelamento por SEM_DECISAO.
            throw new ErroDeNegocio(CodigoErro.APROVACAO_APOS_INICIO);
        }
        String motivoGravado = vazioParaNulo(motivo);
        // O motivo da aprovação, opcional, fica em aprovacoes. Em reservas só guarda o motivo de cancelar e rejeitar.
        reservas.atualizar(id, reserva.titulo(), reserva.descricao(), reserva.periodo(), EstadoReserva.APROVADA,
                reserva.exigeAprovacao(), null, agora);
        reservas.registrarDecisao(id, ator.id(), true, motivoGravado, agora);
        auditoria.registrar(Evento.transicaoDeUsuario(agora, ator.id(), id, "RESERVA_APROVADA",
                EstadoReserva.SOLICITADA.name(), EstadoReserva.APROVADA.name(), null, null, motivoGravado));
        return reservas.buscar(id).orElseThrow();
    }

    @Transactional
    public Registro rejeitar(UsuarioAutenticado ator, long id, String motivo) {
        Instant agora = relogio.instant();
        Registro reserva = reservas.buscarTravando(id)
                .orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
        exigirNaoDono(ator, reserva);
        String motivoGravado = vazioParaNulo(motivo);
        if (motivoGravado == null) {
            throw new ErroDeNegocio(CodigoErro.MOTIVO_OBRIGATORIO);                 // RN-24
        }
        MaquinaDeEstados.exigir(reserva.estado(), EstadoReserva.REJEITADA);
        reservas.atualizar(id, reserva.titulo(), reserva.descricao(), reserva.periodo(), EstadoReserva.REJEITADA,
                reserva.exigeAprovacao(), motivoGravado, agora);
        reservas.inativarOcupacoes(id);
        reservas.registrarDecisao(id, ator.id(), false, motivoGravado, agora);
        auditoria.registrar(Evento.transicaoDeUsuario(agora, ator.id(), id, "RESERVA_REJEITADA",
                EstadoReserva.SOLICITADA.name(), EstadoReserva.REJEITADA.name(), null, null, motivoGravado));
        return reservas.buscar(id).orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<Registro> fila() {
        return reservas.listarFila();
    }

    private static void exigirNaoDono(UsuarioAutenticado ator, Registro reserva) {
        if (reserva.solicitanteId() == ator.id()) {
            throw new ErroDeNegocio(CodigoErro.ACESSO_NEGADO);                      // RN-16, RN-33
        }
    }

    private static String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
