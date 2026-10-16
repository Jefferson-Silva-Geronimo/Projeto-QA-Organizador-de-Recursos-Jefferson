package br.senac.recursos.repository;

import java.time.Duration;
import java.time.ZoneId;
import java.util.Optional;

/** Porta da configuração de linha única (A6, D1, D3). */
public interface ConfiguracaoRepository {

    /** Fuso de exibição e de comparação com a janela da sala. O padrão da base é America/Sao_Paulo. */
    ZoneId fuso();

    /** Tolerância de não comparecimento. Vazia enquanto a lacuna D1 não tiver valor (A8, RN-21). */
    Optional<Duration> toleranciaNaoComparecimento();

    /** Número máximo de tentativas de envio. Vazio enquanto a lacuna D3 não tiver valor. */
    Optional<Integer> tentativasReenvio();

    /** Intervalo inicial do reenvio, que cresce a cada tentativa (C6). Vazio enquanto D3 não tiver valor. */
    Optional<Duration> intervaloReenvioInicial();
}
