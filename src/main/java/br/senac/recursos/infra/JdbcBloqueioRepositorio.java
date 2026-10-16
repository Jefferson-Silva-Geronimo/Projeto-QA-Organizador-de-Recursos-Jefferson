package br.senac.recursos.infra;

import br.senac.recursos.aplicacao.porta.BloqueioRepositorio;
import br.senac.recursos.dominio.Periodo;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcBloqueioRepositorio implements BloqueioRepositorio {

    private final JdbcClient jdbc;

    JdbcBloqueioRepositorio(JdbcClient jdbc) {
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
                .param("inicio", JdbcSessaoRepositorio.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepositorio.utc(periodo.fim()))
                .param("motivo", motivo)
                .param("criador", criadoPor)
                .param("agora", JdbcSessaoRepositorio.utc(agora))
                .query(Long.class).single();
        jdbc.sql("""
                        insert into ocupacoes (recurso_id, periodo, bloqueio_id, ativa)
                        values (:recurso, tstzrange(:inicio, :fim, '[)'), :bloqueio, true)
                        """)
                .param("recurso", recursoId)
                .param("inicio", JdbcSessaoRepositorio.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepositorio.utc(periodo.fim()))
                .param("bloqueio", id)
                .update();
        return id;
    }

    @Override
    public Optional<Registro> buscarTravando(long id) {
        return jdbc.sql("""
                        select id, recurso_id, inicio, fim, motivo, ativo
                          from bloqueios_manutencao where id = :id for update
                        """)
                .param("id", id)
                .query((rs, n) -> new Registro(rs.getLong("id"), rs.getLong("recurso_id"),
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
