package br.senac.recursos.infra;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Única fonte de tempo das regras, do agendador e do despachante (ADR-005, RN-15).
 * O instante é sempre UTC; a conversão para o fuso configurado ocorre só na borda.
 */
@Configuration
class RelogioConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
