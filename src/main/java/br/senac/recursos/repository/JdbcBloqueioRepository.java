package br.senac.recursos.repository;

import br.senac.recursos.model.Bloqueio;
import br.senac.recursos.model.Periodo;
import br.senac.recursos.repository.BloqueioRepository;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcBloqueioRepository implements BloqueioRepository {

    private final JdbcClient jdbc;

    JdbcBloqueioRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public long inserir(long recursoId, Periodo periodo, String motivo, long criadoPor, Instant agora) {
        long id = jdbc.sql("""
                        insert into bloqueios_manutencao (recurso_id, inicio, fim, motivo, criado_por_id, criado_em)
                        values (:recurso, :inicio, :fim, :motivo, :criador, :agora)
                        returning id
                        """)
                .param("recurso", recursoId)
                .param("inicio", JdbcSessaoRepository.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepository.utc(periodo.fim()))
                .param("motivo", motivo)
                .param("criador", criadoPor)
                .param("agora", JdbcSessaoRepository.utc(agora))
                .query(Long.class).single();
        jdbc.sql("""
                        insert into ocupacoes (recurso_id, periodo, bloqueio_id, ativa)
                        values (:recurso, tstzrange(:inicio, :fim, '[)'), :bloqueio, true)
                        """)
                .param("recurso", recursoId)
                .param("inicio", JdbcSessaoRepository.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepository.utc(periodo.fim()))
                .param("bloqueio", id)
                .update();
        return id;
    }

    @Override
    public Optional<Bloqueio> buscarTravando(long id) {
        return jdbc.sql("""
                        select id, recurso_id, inicio, fim, motivo, ativo
                          from bloqueios_manutencao where id = :id for update
                        """)
                .param("id", id)
                .query((rs, n) -> new Bloqueio(rs.getLong("id"), rs.getLong("recurso_id"),
                        rs.getObject("inicio", OffsetDateTime.class).toInstant(),
                        rs.getObject("fim", OffsetDateTime.class).toInstant(),
                        rs.getString("motivo"), rs.getBoolean("ativo")))
                .optional();
    }

    @Override
    public void levantar(long id) {
        jdbc.sql("update bloqueios_manutencao set ativo = false where id = :id").param("id", id).update();
        jdbc.sql("update ocupacoes set ativa = false where bloqueio_id = :id").param("id", id).update();
    }
}
