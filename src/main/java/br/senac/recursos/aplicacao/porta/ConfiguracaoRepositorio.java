package br.senac.recursos.aplicacao.porta;

import java.time.ZoneId;

/** Porta da configuração de linha única (A6, D1, D3). */
public interface ConfiguracaoRepositorio {

    /** Fuso de exibição e de comparação com a janela da sala. O padrão da base é America/Sao_Paulo. */
    ZoneId fuso();
}
