package br.senac.recursos.infra;

import br.senac.recursos.aplicacao.porta.ReservaRepositorio;
import br.senac.recursos.dominio.EstadoReserva;
import br.senac.recursos.dominio.Periodo;
import java.sql.Array;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcReservaRepositorio implements ReservaRepositorio {

    private static final String SELECT = """
            select r.id, r.solicitante_id, r.titulo, r.descricao, r.inicio, r.fim, r.estado::text as estado,
                   r.exige_aprovacao, coalesce(r.motivo_texto, r.motivo_sistema::text) as motivo,
                   array(select o.recurso_id from ocupacoes o where o.reserva_id = r.id
                          order by o.recurso_id) as recursos
              from reservas r
            """;

    private static final RowMapper<Registro> MAPEADOR = (rs, n) -> new Registro(
            rs.getLong("id"), rs.getLong("solicitante_id"), rs.getString("titulo"), rs.getString("descricao"),
            rs.getObject("inicio", OffsetDateTime.class).toInstant(),
            rs.getObject("fim", OffsetDateTime.class).toInstant(),
            EstadoReserva.valueOf(rs.getString("estado")), rs.getBoolean("exige_aprovacao"),
            rs.getString("motivo"), longs(rs.getArray("recursos")));

    private final JdbcClient jdbc;

    JdbcReservaRepositorio(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public long inserir(long solicitanteId, String titulo, String descricao, Periodo periodo,
                        EstadoReserva estado, boolean exigeAprovacao, Instant agora) {
        return jdbc.sql("""
                        insert into reservas (solicitante_id, titulo, descricao, inicio, fim, estado,
                                              exige_aprovacao, criada_em, atualizada_em)
                        values (:solicitante, :titulo, :descricao, :inicio, :fim, cast(:estado as estado_reserva),
                                :exige, :agora, :agora)
                        returning id
                        """)
                .param("solicitante", solicitanteId)
                .param("titulo", titulo)
                .param("descricao", descricao)
                .param("inicio", JdbcSessaoRepositorio.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepositorio.utc(periodo.fim()))
                .param("estado", estado.name())
                .param("exige", exigeAprovacao)
                .param("agora", JdbcSessaoRepositorio.utc(agora))
                .query(Long.class).single();
    }

    @Override
    public void inserirOcupacao(long reservaId, long recursoId, Periodo periodo) {
        jdbc.sql("""
                        insert into ocupacoes (recurso_id, periodo, reserva_id, ativa)
                        values (:recurso, tstzrange(:inicio, :fim, '[)'), :reserva, true)
                        """)
                .param("recurso", recursoId)
                .param("inicio", JdbcSessaoRepositorio.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepositorio.utc(periodo.fim()))
                .param("reserva", reservaId)
                .update();
    }

    @Override
    public Optional<Registro> buscar(long id) {
        return jdbc.sql(SELECT + " where r.id = :id").param("id", id).query(MAPEADOR).optional();
    }

    @Override
    public Optional<Registro> buscarTravando(long id) {
        // Trava só a linha da reserva. O "for update of r" evita travar linhas de outras tabelas.
        return jdbc.sql(SELECT + " where r.id = :id for update of r").param("id", id).query(MAPEADOR).optional();
    }

    @Override
    public List<Registro> listar(Long solicitanteId) {
        return jdbc.sql(SELECT + " where (cast(:solicitante as bigint) is null or r.solicitante_id = :solicitante) "
                        + "order by r.inicio, r.id")
                .param("solicitante", solicitanteId)
                .query(MAPEADOR).list();
    }

    @Override
    public Optional<Conflito> buscarConflito(long recursoId, Periodo periodo, Long ignorarReservaId) {
        return jdbc.sql("""
                        select (o.bloqueio_id is not null) as manutencao
                          from ocupacoes o
                         where o.recurso_id = :recurso and o.ativa
                           and o.periodo && tstzrange(:inicio, :fim, '[)')
                           and (cast(:ignorar as bigint) is null or o.reserva_id is distinct from :ignorar)
                         order by (o.bloqueio_id is not null) desc
                         limit 1
                        """)
                .param("recurso", recursoId)
                .param("inicio", JdbcSessaoRepositorio.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepositorio.utc(periodo.fim()))
                .param("ignorar", ignorarReservaId)
                .query((rs, n) -> new Conflito(rs.getBoolean("manutencao")))
                .optional();
    }

    @Override
    public void atualizar(long id, String titulo, String descricao, Periodo periodo, EstadoReserva estado,
                          boolean exigeAprovacao, String motivo, Instant agora) {
        jdbc.sql("""
                        update reservas
                           set titulo = :titulo, descricao = :descricao, inicio = :inicio, fim = :fim,
                               estado = cast(:estado as estado_reserva), exige_aprovacao = :exige,
                               motivo_texto = :motivo, atualizada_em = :agora
                         where id = :id
                        """)
                .param("titulo", titulo)
                .param("descricao", descricao)
                .param("inicio", JdbcSessaoRepositorio.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepositorio.utc(periodo.fim()))
                .param("estado", estado.name())
                .param("exige", exigeAprovacao)
                .param("motivo", motivo)
                .param("agora", JdbcSessaoRepositorio.utc(agora))
                .param("id", id)
                .update();
    }

    @Override
    public void removerOcupacoes(long reservaId) {
        jdbc.sql("delete from ocupacoes where reserva_id = :reserva").param("reserva", reservaId).update();
    }

    @Override
    public void inativarOcupacoes(long reservaId) {
        jdbc.sql("update ocupacoes set ativa = false where reserva_id = :reserva")
                .param("reserva", reservaId).update();
    }

    private static List<Long> longs(Array array) throws SQLException {
        List<Long> lista = new ArrayList<>();
        if (array != null) {
            for (Object o : (Object[]) array.getArray()) {
                lista.add(((Number) o).longValue());
            }
        }
        return lista;
    }
}
