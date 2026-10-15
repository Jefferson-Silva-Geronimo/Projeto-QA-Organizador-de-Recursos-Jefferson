package br.senac.recursos.infra;

import br.senac.recursos.aplicacao.porta.ConfiguracaoRepositorio;
import java.time.ZoneId;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcConfiguracaoRepositorio implements ConfiguracaoRepositorio {

    private final JdbcClient jdbc;

    JdbcConfiguracaoRepositorio(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public ZoneId fuso() {
        return ZoneId.of(jdbc.sql("select fuso from configuracao where id = 1").query(String.class).single());
    }
}
