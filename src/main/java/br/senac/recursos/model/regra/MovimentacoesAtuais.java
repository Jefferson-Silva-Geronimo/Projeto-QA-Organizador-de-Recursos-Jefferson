package br.senac.recursos.model.regra;

import br.senac.recursos.model.Movimentacao;
import java.util.List;
import java.util.Map;

/** Esqueleto: a movimentação atual de cada material; o comportamento nasce no commit verde. */
public final class MovimentacoesAtuais {

    private MovimentacoesAtuais() {
    }

    public static Map<Long, Movimentacao> ultimaPorMaterial(List<Movimentacao> movimentacoes) {
        return Map.of();
    }
}
