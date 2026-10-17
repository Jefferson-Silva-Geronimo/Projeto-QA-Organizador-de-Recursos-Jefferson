package br.senac.recursos.dto;

import br.senac.recursos.model.PaginaDeRelatorio;
import java.util.List;

/** Página do relatório de utilização (RF-12). */
public record RelatorioResposta(List<ItemRelatorioResposta> itens, int pagina, int tamanho, long total) {

    public static RelatorioResposta de(PaginaDeRelatorio p) {
        return new RelatorioResposta(p.itens().stream().map(ItemRelatorioResposta::de).toList(), p.pagina(),
                p.tamanho(), p.total());
    }
}
