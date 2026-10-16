package br.senac.recursos.dto;

import br.senac.recursos.model.ItemDeRelatorio;
import br.senac.recursos.model.TipoRecurso;

/** Linha do relatório de um recurso. {@code utilizacao} é nula para professor e material (B4). */
public record ItemRelatorioResposta(long recursoId, String nome, TipoRecurso tipo, double horasAlocadas,
                                    Double utilizacao, long conflitosEvitados, long solicitantesDistintos) {

    public static ItemRelatorioResposta de(ItemDeRelatorio i) {
        return new ItemRelatorioResposta(i.recursoId(), i.nome(), i.tipo(), i.horasAlocadas(), i.utilizacao(),
                i.conflitosEvitados(), i.solicitantesDistintos());
    }
}
