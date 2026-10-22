package br.senac.recursos.model.regra;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.model.TipoMovimentacao;
import java.util.Optional;

/** Esqueleto das recusas de retirada e devolução; o comportamento nasce no commit verde. */
public final class PoliticaDeUso {

    private PoliticaDeUso() {
    }

    /** {@code ultima} é a movimentação atual do material, ou nulo se nunca foi movimentado. */
    public static Optional<CodigoErro> avaliarRetirada(TipoMovimentacao ultima) {
        return Optional.empty();
    }

    public static Optional<CodigoErro> avaliarDevolucao(TipoMovimentacao ultima) {
        return Optional.empty();
    }
}
