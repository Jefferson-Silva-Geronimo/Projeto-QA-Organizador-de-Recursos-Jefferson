package br.senac.recursos.model.regra;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.TipoMovimentacao;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Quando o uso da reserva pode avançar: início, retirada, devolução, conclusão e não comparecimento (RN-05, RN-20,
 * RN-21, RN-23, D1). O perfil é verificado na camada de API; aqui ficam o estado, o material e o instante.
 */
public final class PoliticaDeUso {

    private PoliticaDeUso() {
    }

    /** Devolve o código da recusa, ou vazio se o início do uso é permitido. O servidor não limita por horário. */
    public static Optional<CodigoErro> avaliarInicio(EstadoReserva estado) {
        return MaquinaDeEstados.permitida(estado, EstadoReserva.EM_USO)
                ? Optional.empty() : Optional.of(CodigoErro.TRANSICAO_PROIBIDA);
    }

    /** {@code ultima} é o tipo da movimentação atual do material, ou nulo se nunca foi movimentado. */
    public static Optional<CodigoErro> avaliarRetirada(TipoMovimentacao ultima) {
        return ultima == TipoMovimentacao.RETIRADA ? Optional.of(CodigoErro.MATERIAL_JA_RETIRADO) : Optional.empty();
    }

    public static Optional<CodigoErro> avaliarDevolucao(TipoMovimentacao ultima) {
        return ultima == TipoMovimentacao.RETIRADA ? Optional.empty() : Optional.of(CodigoErro.DEVOLUCAO_SEM_RETIRADA);
    }

    /** Concluir exige a reserva em uso e nenhuma unidade retirada e não devolvida (RN-23). */
    public static Optional<CodigoErro> avaliarConclusao(EstadoReserva estado, boolean haMaterialPendente) {
        if (!MaquinaDeEstados.permitida(estado, EstadoReserva.CONCLUIDA)) {
            return Optional.of(CodigoErro.TRANSICAO_PROIBIDA);
        }
        return haMaterialPendente ? Optional.of(CodigoErro.MATERIAL_PENDENTE) : Optional.empty();
    }

    /** O não comparecimento vale a partir de início mais tolerância, no instante exato inclusive (D1). */
    public static Optional<CodigoErro> avaliarNaoComparecimento(EstadoReserva estado, Optional<Duration> tolerancia,
                                                                Instant agora, Instant inicio) {
        if (!MaquinaDeEstados.permitida(estado, EstadoReserva.NAO_COMPARECEU)) {
            return Optional.of(CodigoErro.TRANSICAO_PROIBIDA);
        }
        if (tolerancia.isEmpty()) {
            return Optional.of(CodigoErro.TOLERANCIA_NAO_CONFIGURADA);
        }
        if (agora.isBefore(inicio.plus(tolerancia.get()))) {
            return Optional.of(CodigoErro.TOLERANCIA_NAO_ENCERRADA);
        }
        return Optional.empty();
    }
}
