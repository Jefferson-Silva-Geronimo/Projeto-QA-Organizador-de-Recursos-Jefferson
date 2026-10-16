package br.senac.recursos.repository;

import br.senac.recursos.repository.ConfiguracaoRepository;
import java.time.Duration;
import java.time.ZoneId;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcConfiguracaoRepository implements ConfiguracaoRepository {

    private final JdbcClient jdbc;

    JdbcConfiguracaoRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public ZoneId fuso() {
        return ZoneId.of(jdbc.sql("select fuso from configuracao where id = 1").query(String.class).single());
    }

    @Override
    public Optional<Duration> toleranciaNaoComparecimento() {
        return jdbc.sql("select extract(epoch from tolerancia_nao_comparecimento) from configuracao where id = 1")
                .query((rs, n) -> {
                    double segundos = rs.getDouble(1);
                    return rs.wasNull() ? null : Duration.ofMillis(Math.round(segundos * 1000));
                })
                .optional();
    }
}
