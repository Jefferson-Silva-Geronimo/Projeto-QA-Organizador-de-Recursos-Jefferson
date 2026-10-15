package br.senac.recursos;

import static org.assertj.core.api.Assertions.assertThat;

import br.senac.recursos.suporte.BancoRealIT;
import java.time.Clock;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Teste de contexto com PostgreSQL real em container, sem H2 (ADR-009, especificação seção 5).
 * Prova que a aplicação sobe, que o Flyway aplica a migração baseline e que o relógio é UTC.
 */
class ContextoIT extends BancoRealIT {

    @Autowired
    private Clock clock;

    @Test
    void contextoSobeComBancoRealEMigracaoBaselineAplicada() {
        assertThat(clock.getZone()).isEqualTo(ZoneOffset.UTC);

        Integer aplicadas = jdbc.queryForObject(
                "select count(*) from flyway_schema_history where version = '1' and success",
                Integer.class);
        assertThat(aplicadas).isEqualTo(1);
    }
}
