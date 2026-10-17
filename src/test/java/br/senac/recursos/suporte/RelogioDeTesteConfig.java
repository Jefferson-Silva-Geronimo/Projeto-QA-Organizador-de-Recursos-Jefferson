package br.senac.recursos.suporte;

import java.time.Instant;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/** Substitui o relógio da aplicação por um relógio controlado nos testes de API. */
@TestConfiguration
public class RelogioDeTesteConfig {

    /** Terça-feira, 20/10/2026, 14:00 em America/Sao_Paulo (UTC-03:00). */
    public static final Instant INICIAL = Instant.parse("2026-10-20T17:00:00Z");

    @Bean
    @Primary
    RelogioDeTeste relogioDeTeste() {
        return new RelogioDeTeste(INICIAL);
    }
}
