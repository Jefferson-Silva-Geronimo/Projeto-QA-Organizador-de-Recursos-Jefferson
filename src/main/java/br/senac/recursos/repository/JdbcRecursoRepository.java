package br.senac.recursos.repository;

import br.senac.recursos.model.FiltroDeRecursos;
import br.senac.recursos.model.IntervaloOcupado;
import br.senac.recursos.model.NovaSala;
import br.senac.recursos.model.NovoMaterial;
import br.senac.recursos.model.NovoProfessor;
import br.senac.recursos.model.Recurso;
import br.senac.recursos.model.TipoRecurso;
import br.senac.recursos.repository.RecursoRepository;
import java.sql.Array;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcRecursoRepository implements RecursoRepository {

    /** Recurso de um recurso com os atributos de todos os tipos. Dias e competências vêm em arrays. */
    private static final String SELECT_DETALHE = """
            select r.id, r.tipo::text as tipo, r.nome, r.restrito, r.ativo,
                   s.capacidade, s.localizacao, s.tipo_sala, s.hora_abertura, s.hora_fechamento,
                   array(select d.dia_semana::int from sala_dias_funcionamento d
                          where d.sala_id = r.id order by d.dia_semana) as dias,
                   m.codigo_patrimonio, m.descricao,
                   p.usuario_id,
                   array(select c.nome from professor_competencias pc
                           join competencias c on c.id = pc.competencia_id
                          where pc.professor_id = r.id order by c.nome) as competencias
              from recursos r
              left join salas s on s.recurso_id = r.id
              left join materiais m on m.recurso_id = r.id
              left join professores p on p.recurso_id = r.id
            """;

    private static final RowMapper<Recurso> MAPEADOR = (rs, n) -> {
        TipoRecurso tipo = TipoRecurso.valueOf(rs.getString("tipo"));
        int capacidade = rs.getInt("capacidade");
        Integer capacidadeNula = rs.wasNull() ? null : capacidade;
        long usuario = rs.getLong("usuario_id");
        Long usuarioNulo = rs.wasNull() ? null : usuario;
        java.sql.Time abertura = rs.getTime("hora_abertura");
        java.sql.Time fechamento = rs.getTime("hora_fechamento");
        return new Recurso(
                rs.getLong("id"), tipo, rs.getString("nome"), rs.getBoolean("restrito"), rs.getBoolean("ativo"),
                capacidadeNula, rs.getString("localizacao"), rs.getString("tipo_sala"),
                abertura == null ? null : abertura.toLocalTime(),
                fechamento == null ? null : fechamento.toLocalTime(),
                tipo == TipoRecurso.SALA ? inteiros(rs.getArray("dias")) : null,
                rs.getString("codigo_patrimonio"), rs.getString("descricao"),
                usuarioNulo,
                tipo == TipoRecurso.PROFESSOR ? textos(rs.getArray("competencias")) : null);
    };

    private final JdbcClient jdbc;

    JdbcRecursoRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public long criarSala(NovaSala sala, Instant criadoEm) {
        long id = inserirRecurso(TipoRecurso.SALA, sala.nome(), sala.restrito(), criadoEm);
        jdbc.sql("""
                        insert into salas (recurso_id, capacidade, localizacao, tipo_sala, hora_abertura, hora_fechamento)
                        values (:id, :capacidade, :localizacao, :tipoSala, :abertura, :fechamento)
                        """)
                .param("id", id)
                .param("capacidade", sala.capacidade())
                .param("localizacao", sala.localizacao())
                .param("tipoSala", sala.tipoSala())
                .param("abertura", java.sql.Time.valueOf(sala.horaAbertura()))
                .param("fechamento", java.sql.Time.valueOf(sala.horaFechamento()))
                .update();
        for (Integer dia : sala.diasFuncionamento().stream().distinct().toList()) {
            jdbc.sql("insert into sala_dias_funcionamento (sala_id, dia_semana) values (:id, :dia)")
                    .param("id", id).param("dia", dia.shortValue()).update();
        }
        return id;
    }

    @Override
    public long criarProfessor(NovoProfessor professor, Instant criadoEm) {
        long id = inserirRecurso(TipoRecurso.PROFESSOR, professor.nome(), professor.restrito(), criadoEm);
        jdbc.sql("insert into professores (recurso_id, usuario_id) values (:id, :usuario)")
                .param("id", id).param("usuario", professor.usuarioId()).update();
        for (String nome : professor.competencias().stream().map(String::trim).filter(c -> !c.isEmpty())
                .distinct().toList()) {
            long competencia = jdbc.sql("""
                            insert into competencias (nome) values (:nome)
                            on conflict (nome) do update set nome = excluded.nome
                            returning id
                            """)
                    .param("nome", nome).query(Long.class).single();
            jdbc.sql("insert into professor_competencias (professor_id, competencia_id) values (:p, :c)")
                    .param("p", id).param("c", competencia).update();
        }
        return id;
    }

    @Override
    public long criarMaterial(NovoMaterial material, Instant criadoEm) {
        long id = inserirRecurso(TipoRecurso.MATERIAL, material.nome(), material.restrito(), criadoEm);
        jdbc.sql("insert into materiais (recurso_id, codigo_patrimonio, descricao) values (:id, :codigo, :descricao)")
                .param("id", id)
                .param("codigo", material.codigoPatrimonio())
                .param("descricao", material.descricao())
                .update();
        return id;
    }

    @Override
    public Optional<Recurso> buscarPorId(long id) {
        return jdbc.sql(SELECT_DETALHE + " where r.id = :id").param("id", id).query(MAPEADOR).optional();
    }

    @Override
    public List<Recurso> pesquisar(FiltroDeRecursos f) {
        return jdbc.sql(SELECT_DETALHE + """
                         where r.ativo
                           and (cast(:tipo as text) is null or r.tipo::text = :tipo)
                           and (cast(:capacidade as integer) is null or s.capacidade >= :capacidade)
                           and (cast(:localizacao as text) is null or lower(s.localizacao) = lower(:localizacao))
                           and (cast(:competencia as text) is null or exists (
                                 select 1 from professor_competencias pc
                                   join competencias c on c.id = pc.competencia_id
                                  where pc.professor_id = r.id and c.nome = :competencia))
                           and (cast(:inicio as timestamptz) is null or not exists (
                                 select 1 from ocupacoes o
                                  where o.recurso_id = r.id and o.ativa
                                    and o.periodo && tstzrange(cast(:inicio as timestamptz),
                                                               cast(:fim as timestamptz), '[)')))
                         order by r.nome, r.id
                        """)
                .param("tipo", f.tipo() == null ? null : f.tipo().name())
                .param("capacidade", f.capacidadeMinima())
                .param("localizacao", f.localizacao())
                .param("competencia", f.competencia())
                .param("inicio", f.inicio() == null ? null : JdbcSessaoRepository.utc(f.inicio()))
                .param("fim", f.fim() == null ? null : JdbcSessaoRepository.utc(f.fim()))
                .query(MAPEADOR)
                .list();
    }

    @Override
    public List<IntervaloOcupado> ocupacoes(long recursoId, Instant inicio, Instant fim) {
        return jdbc.sql("""
                        select lower(periodo) as inicio, upper(periodo) as fim
                          from ocupacoes
                         where recurso_id = :recurso and ativa
                           and periodo && tstzrange(:inicio, :fim, '[)')
                         order by lower(periodo)
                        """)
                .param("recurso", recursoId)
                .param("inicio", JdbcSessaoRepository.utc(inicio))
                .param("fim", JdbcSessaoRepository.utc(fim))
                .query((rs, n) -> new IntervaloOcupado(
                        rs.getObject("inicio", java.time.OffsetDateTime.class).toInstant(),
                        rs.getObject("fim", java.time.OffsetDateTime.class).toInstant()))
                .list();
    }

    @Override
    public void alterarRestrito(long id, boolean restrito) {
        jdbc.sql("update recursos set restrito = :restrito where id = :id")
                .param("restrito", restrito).param("id", id).update();
    }

    @Override
    public void desativar(long id) {
        jdbc.sql("update recursos set ativo = false where id = :id").param("id", id).update();
    }

    @Override
    public boolean travar(long id) {
        return !jdbc.sql("select id from recursos where id = :id for update")
                .param("id", id).query(Long.class).list().isEmpty();
    }

    @Override
    public List<Long> travarCompartilhado(List<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        return jdbc.sql("select id from recursos where id in (:ids) order by id for share")
                .param("ids", ids).query(Long.class).list();
    }

    @Override
    public List<Long> reservasFuturas(long recursoId, Instant agora) {
        return jdbc.sql("""
                        select distinct r.id
                          from reservas r
                          join ocupacoes o on o.reserva_id = r.id
                         where o.recurso_id = :recurso
                           and r.estado in ('SOLICITADA', 'APROVADA', 'EM_USO')
                           and r.fim > :agora
                         order by r.id
                        """)
                .param("recurso", recursoId)
                .param("agora", JdbcSessaoRepository.utc(agora))
                .query(Long.class).list();
    }

    private long inserirRecurso(TipoRecurso tipo, String nome, boolean restrito, Instant criadoEm) {
        return jdbc.sql("""
                        insert into recursos (tipo, nome, restrito, criado_em)
                        values (cast(:tipo as tipo_recurso), :nome, :restrito, :criado)
                        returning id
                        """)
                .param("tipo", tipo.name())
                .param("nome", nome)
                .param("restrito", restrito)
                .param("criado", JdbcSessaoRepository.utc(criadoEm))
                .query(Long.class).single();
    }

    private static List<Integer> inteiros(Array array) throws SQLException {
        List<Integer> lista = new ArrayList<>();
        if (array != null) {
            for (Object o : (Object[]) array.getArray()) {
                lista.add(((Number) o).intValue());
            }
        }
        return lista;
    }

    private static List<String> textos(Array array) throws SQLException {
        List<String> lista = new ArrayList<>();
        if (array != null) {
            for (Object o : (Object[]) array.getArray()) {
                lista.add((String) o);
            }
        }
        return lista;
    }
}
