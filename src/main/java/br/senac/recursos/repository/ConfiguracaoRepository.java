package br.senac.recursos.repository;

import java.time.ZoneId;

/** Porta da configuração de linha única (A6, D1, D3). */
public interface ConfiguracaoRepository {

    /** Fuso de exibição e de comparação com a janela da sala. O padrão da base é America/Sao_Paulo. */
    ZoneId fuso();
}
