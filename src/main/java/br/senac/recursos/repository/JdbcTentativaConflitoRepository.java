package br.senac.recursos.repository;

import br.senac.recursos.repository.TentativaConflitoRepository;
import br.senac.recursos.model.Periodo;
import java.time.Instant;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcTentativaConflitoRepository implements TentativaConflitoRepository {

    private final JdbcClient jdbc;

    JdbcTentativaConflitoRepository(JdbcClient jdbc) {
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
                .param("inicio", JdbcSessaoRepository.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepository.utc(periodo.fim()))
                .param("solicitante", solicitanteId)
                .param("motivo", motivo.name())
                .param("quando", JdbcSessaoRepository.utc(ocorridaEm))
                .update();
    }
}
