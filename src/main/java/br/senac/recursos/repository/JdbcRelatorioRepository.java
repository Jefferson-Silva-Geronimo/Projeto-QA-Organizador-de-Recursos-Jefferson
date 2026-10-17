package br.senac.recursos.repository;

import br.senac.recursos.model.LinhaDeRelatorio;
import br.senac.recursos.model.TipoRecurso;
import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcRelatorioRepository implements RelatorioRepository {

    private final JdbcClient jdbc;

    JdbcRelatorioRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<LinhaDeRelatorio> linhas(Instant inicio, Instant fim, TipoRecurso tipo, Long recursoId,
                                         int limite, int deslocamento) {
        return jdbc.sql("""
                        select r.id, r.nome, r.tipo::text as tipo,
                               coalesce((select sum(extract(epoch from
                                           (least(upper(o.periodo), :fim) - greatest(lower(o.periodo), :inicio))))
                                           from ocupacoes o
                                           join reservas rv on rv.id = o.reserva_id
                                          where o.recurso_id = r.id
                                            and rv.estado in ('APROVADA', 'EM_USO', 'CONCLUIDA')
                                            and o.periodo && tstzrange(:inicio, :fim, '[)')), 0) as segundos,
                               (select count(*) from tentativas_conflito t
                                 where t.recurso_id = r.id
                                   and t.periodo && tstzrange(:inicio, :fim, '[)')) as conflitos,
                               (select count(distinct t.solicitante_id) from tentativas_conflito t
                                 where t.recurso_id = r.id
                                   and t.periodo && tstzrange(:inicio, :fim, '[)')) as solicitantes
                          from recursos r
                         where (cast(:tipo as text) is null or r.tipo::text = :tipo)
                           and (cast(:recurso as bigint) is null or r.id = :recurso)
                         order by r.nome, r.id
                         limit :limite offset :deslocamento
                        """)
                .param("inicio", JdbcSessaoRepository.utc(inicio))
                .param("fim", JdbcSessaoRepository.utc(fim))
                .param("tipo", tipo == null ? null : tipo.name())
                .param("recurso", recursoId)
                .param("limite", limite)
                .param("deslocamento", deslocamento)
                .query((rs, n) -> new LinhaDeRelatorio(rs.getLong("id"), rs.getString("nome"),
                        TipoRecurso.valueOf(rs.getString("tipo")), Math.round(rs.getDouble("segundos")),
                        rs.getLong("conflitos"), rs.getLong("solicitantes")))
                .list();
    }

    @Override
    public long contar(TipoRecurso tipo, Long recursoId) {
        return jdbc.sql("""
                        select count(*) from recursos r
                         where (cast(:tipo as text) is null or r.tipo::text = :tipo)
                           and (cast(:recurso as bigint) is null or r.id = :recurso)
                        """)
                .param("tipo", tipo == null ? null : tipo.name())
                .param("recurso", recursoId)
                .query(Long.class).single();
    }
}
