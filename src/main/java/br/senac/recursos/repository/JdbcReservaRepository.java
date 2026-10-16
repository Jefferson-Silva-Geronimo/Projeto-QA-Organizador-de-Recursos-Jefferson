package br.senac.recursos.repository;

import br.senac.recursos.repository.ReservaRepository;
import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.Periodo;
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
class JdbcReservaRepository implements ReservaRepository {

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

    JdbcReservaRepository(JdbcClient jdbc) {
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
                .param("inicio", JdbcSessaoRepository.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepository.utc(periodo.fim()))
                .param("estado", estado.name())
                .param("exige", exigeAprovacao)
                .param("agora", JdbcSessaoRepository.utc(agora))
                .query(Long.class).single();
    }

    @Override
    public void inserirOcupacao(long reservaId, long recursoId, Periodo periodo) {
        jdbc.sql("""
                        insert into ocupacoes (recurso_id, periodo, reserva_id, ativa)
                        values (:recurso, tstzrange(:inicio, :fim, '[)'), :reserva, true)
                        """)
                .param("recurso", recursoId)
                .param("inicio", JdbcSessaoRepository.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepository.utc(periodo.fim()))
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
                .param("inicio", JdbcSessaoRepository.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepository.utc(periodo.fim()))
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
                .param("inicio", JdbcSessaoRepository.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepository.utc(periodo.fim()))
                .param("estado", estado.name())
                .param("exige", exigeAprovacao)
                .param("motivo", motivo)
                .param("agora", JdbcSessaoRepository.utc(agora))
                .param("id", id)
                .update();
    }

    @Override
    public List<Registro> listarFila() {
        return jdbc.sql(SELECT + " where r.estado = 'SOLICITADA' and r.exige_aprovacao order by r.inicio, r.id")
                .query(MAPEADOR).list();
    }

    @Override
    public void registrarDecisao(long reservaId, long responsavelId, boolean aprovada, String motivo, Instant agora) {
        jdbc.sql("""
                        insert into aprovacoes (reserva_id, responsavel_id, decisao, motivo, decidida_em)
                        values (:reserva, :responsavel, cast(:decisao as decisao_aprovacao), :motivo, :agora)
                        """)
                .param("reserva", reservaId)
                .param("responsavel", responsavelId)
                .param("decisao", aprovada ? "APROVADA" : "REJEITADA")
                .param("motivo", motivo)
                .param("agora", JdbcSessaoRepository.utc(agora))
                .update();
    }

    @Override
    public List<Registro> reservasAtivasQueTocam(long recursoId, Periodo periodo) {
        List<Long> ids = jdbc.sql("""
                        select distinct r.id
                          from reservas r
                          join ocupacoes o on o.reserva_id = r.id
                         where o.recurso_id = :recurso and o.ativa
                           and o.periodo && tstzrange(:inicio, :fim, '[)')
                         order by r.id
                        """)
                .param("recurso", recursoId)
                .param("inicio", JdbcSessaoRepository.utc(periodo.inicio()))
                .param("fim", JdbcSessaoRepository.utc(periodo.fim()))
                .query(Long.class).list();
        List<Registro> travadas = new ArrayList<>();
        for (Long id : ids) {
            buscarTravando(id).ifPresent(travadas::add);
        }
        return travadas;
    }

    @Override
    public boolean cancelarPeloSistema(long id, EstadoReserva esperado, String motivoSistema, Instant agora) {
        return jdbc.sql("""
                        update reservas
                           set estado = 'CANCELADA', motivo_sistema = cast(:motivo as motivo_sistema),
                               atualizada_em = :agora
                         where id = :id and estado = cast(:esperado as estado_reserva)
                        """)
                .param("motivo", motivoSistema)
                .param("agora", JdbcSessaoRepository.utc(agora))
                .param("id", id)
                .param("esperado", esperado.name())
                .update() == 1;
    }

    @Override
    public List<Long> idsSemDecisao(Instant agora) {
        return jdbc.sql("""
                        select id from reservas
                         where estado = 'SOLICITADA' and exige_aprovacao and inicio <= :agora
                         order by id
                        """)
                .param("agora", JdbcSessaoRepository.utc(agora))
                .query(Long.class).list();
    }

    @Override
    public boolean tentarTravarJob(long chave) {
        return Boolean.TRUE.equals(jdbc.sql("select pg_try_advisory_xact_lock(:chave)")
                .param("chave", chave).query(Boolean.class).single());
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
