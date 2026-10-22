package br.senac.recursos.model.regra;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.model.EstadoReserva;
import java.time.Instant;
import java.util.Optional;

/**
 * Quem decide a reserva, em que estado e até quando (RF-07, RN-16, RN-33, D2, D10). O perfil é verificado na camada
 * de API; aqui ficam a posse, o estado e o instante. O motivo obrigatório da rejeição (RN-24) é checado pelo serviço.
 */
public final class PoliticaDeDecisao {

    private PoliticaDeDecisao() {
    }

    /** Devolve o código da recusa, ou vazio se a aprovação é permitida. Aprova-se só antes do instante de início. */
    public static Optional<CodigoErro> avaliarAprovacao(EstadoReserva estado, boolean dono, Instant agora, Instant inicio) {
        if (dono) {
            return Optional.of(CodigoErro.ACESSO_NEGADO);
        }
        if (estado != EstadoReserva.SOLICITADA) {
            return Optional.of(CodigoErro.TRANSICAO_PROIBIDA);
        }
        if (!agora.isBefore(inicio)) {
            return Optional.of(CodigoErro.APROVACAO_APOS_INICIO);
        }
        return Optional.empty();
    }

    /**
     * Devolve o código da recusa, ou vazio se a rejeição é permitida. O motivo é obrigatório (RN-24); a ordem das
     * recusas é a do serviço: posse, motivo, estado. O serviço não limita a rejeição por horário.
     */
    public static Optional<CodigoErro> avaliarRejeicao(EstadoReserva estado, boolean dono, boolean motivoInformado) {
        if (dono) {
            return Optional.of(CodigoErro.ACESSO_NEGADO);
        }
        if (!motivoInformado) {
            return Optional.of(CodigoErro.MOTIVO_OBRIGATORIO);
        }
        if (!MaquinaDeEstados.permitida(estado, EstadoReserva.REJEITADA)) {
            return Optional.of(CodigoErro.TRANSICAO_PROIBIDA);
        }
        return Optional.empty();
    }
}
