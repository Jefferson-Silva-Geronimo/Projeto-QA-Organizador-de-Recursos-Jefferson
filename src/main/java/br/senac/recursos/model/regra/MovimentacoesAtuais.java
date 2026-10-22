package br.senac.recursos.model.regra;

import br.senac.recursos.model.Movimentacao;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * A movimentação atual de cada material da reserva: a mais recente prevalece (RF-09). É a regra com que o servidor
 * recusa a retirada de unidade já retirada (MATERIAL_JA_RETIRADO) e a devolução de unidade não retirada
 * (DEVOLUCAO_SEM_RETIRADA), e a que marca cada movimentação do histórico como atual, para a tela não interpretar
 * sequências (F6-16).
 */
public final class MovimentacoesAtuais {

    private MovimentacoesAtuais() {
    }

    /** Última movimentação de cada material, pelo maior {@code id}. Material nunca movimentado não aparece. */
    public static Map<Long, Movimentacao> ultimaPorMaterial(List<Movimentacao> movimentacoes) {
        Map<Long, Movimentacao> ultimas = new HashMap<>();
        for (Movimentacao m : movimentacoes) {
            ultimas.merge(m.materialId(), m, (anterior, nova) -> nova.id() > anterior.id() ? nova : anterior);
        }
        return ultimas;
    }
}
