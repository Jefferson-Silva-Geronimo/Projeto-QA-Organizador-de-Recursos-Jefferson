package br.senac.recursos.model;

import java.util.List;

/** Página do relatório. O tamanho da página é escolhido pelo cliente (lacuna D4, sem valor padrão). */
public record PaginaDeRelatorio(List<ItemDeRelatorio> itens, int pagina, int tamanho, long total) {
}
