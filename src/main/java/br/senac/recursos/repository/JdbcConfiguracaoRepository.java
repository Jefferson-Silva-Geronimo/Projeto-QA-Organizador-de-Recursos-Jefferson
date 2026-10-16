package br.senac.recursos.repository;

import br.senac.recursos.repository.ConfiguracaoRepository;
import java.time.ZoneId;
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
}
