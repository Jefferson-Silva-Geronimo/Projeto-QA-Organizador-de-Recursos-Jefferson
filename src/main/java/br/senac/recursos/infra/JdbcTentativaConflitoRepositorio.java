package br.senac.recursos.infra;

import br.senac.recursos.aplicacao.porta.TentativaConflitoRepositorio;
import br.senac.recursos.dominio.Periodo;
import java.time.Instant;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcTentativaConflitoRepositorio implements TentativaConflitoRepositorio {

    private final JdbcClient jdbc;

    JdbcTentativaConflitoRepositorio(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void registrar(long recursoId, Periodo periodo, long solicitanteId, Motivo motivo, Instant ocorridaEm) {
        jdbc.sql("""
                        insert into tentativas_conflito (recurso_id, periodo, solicitante_id, motivo, ocorrida_em)
                        values (:recurso, tstzrange(:inicio, :fim, '[)'), :solicitante,
                                cast(:motivo as motivo_conflito), :quando)
                        """)
                .param("recurso", recursoId)
                .param("inicio", JdbcSessaoRepositorio.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepositorio.utc(periodo.fim()))
                .param("solicitante", solicitanteId)
                .param("motivo", motivo.name())
                .param("quando", JdbcSessaoRepositorio.utc(ocorridaEm))
                .update();
    }
}
