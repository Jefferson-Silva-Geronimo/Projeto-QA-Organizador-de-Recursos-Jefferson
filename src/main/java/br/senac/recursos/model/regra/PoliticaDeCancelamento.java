package br.senac.recursos.model.regra;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.Perfil;
import java.time.Instant;
import java.util.Optional;

/**
 * Matriz de cancelamento por estado e perfil (RN-18):
 * SOLICITADA é cancelada pelo dono, sem motivo, ou pelo Administrador, com motivo.
 * APROVADA é cancelada pelo dono até o início (D10), ou por Responsável ou Administrador, com motivo.
 * EM_USO e os estados terminais não são cancelados por ninguém. Sem antecedência mínima.
 */
public final class PoliticaDeCancelamento {

    private PoliticaDeCancelamento() {
    }

    /** Devolve o código da recusa, ou vazio se o cancelamento é permitido. */
    public static Optional<CodigoErro> avaliar(EstadoReserva estado, Perfil ator, boolean dono,
                                               Instant agora, Instant inicio, boolean comMotivo) {
        if (estado == EstadoReserva.EM_USO || estado.terminal()) {
            return Optional.of(CodigoErro.TRANSICAO_PROIBIDA);
        }
        boolean donoReal = dono && ator != Perfil.ADMINISTRADOR;
        if (estado == EstadoReserva.SOLICITADA) {
            if (donoReal) {
                return Optional.empty();
            }
            if (ator == Perfil.ADMINISTRADOR) {
                return exigirMotivo(comMotivo);
            }
            return Optional.of(CodigoErro.ACESSO_NEGADO);
        }
        // APROVADA
        if (donoReal && agora.isBefore(inicio)) {
            return Optional.empty();
        }
        if (ator == Perfil.RESPONSAVEL || ator == Perfil.ADMINISTRADOR) {
            return exigirMotivo(comMotivo);
        }
        if (donoReal) {
            return Optional.of(CodigoErro.RESERVA_JA_INICIADA);
        }
        return Optional.of(CodigoErro.ACESSO_NEGADO);
    }

    private static Optional<CodigoErro> exigirMotivo(boolean comMotivo) {
        return comMotivo ? Optional.empty() : Optional.of(CodigoErro.MOTIVO_OBRIGATORIO);
    }
}
