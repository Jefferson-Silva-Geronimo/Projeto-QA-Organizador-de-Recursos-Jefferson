package br.senac.recursos.repository;

import br.senac.recursos.model.Movimentacao;
import br.senac.recursos.model.TipoMovimentacao;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcMovimentacaoRepository implements MovimentacaoRepository {

    private final JdbcClient jdbc;

    JdbcMovimentacaoRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void registrar(long reservaId, long materialId, TipoMovimentacao tipo, long registradoPorId,
                          Instant agora) {
        jdbc.sql("""
                        insert into movimentacoes_material (reserva_id, material_id, tipo, registrado_por_id, registrado_em)
                        values (:reserva, :material, cast(:tipo as tipo_movimentacao), :usuario, :agora)
                        """)
                .param("reserva", reservaId)
                .param("material", materialId)
                .param("tipo", tipo.name())
                .param("usuario", registradoPorId)
                .param("agora", JdbcSessaoRepository.utc(agora))
                .update();
    }

    @Override
    public Map<Long, TipoMovimentacao> ultimaPorMaterial(long reservaId) {
        Map<Long, TipoMovimentacao> ultimas = new LinkedHashMap<>();
        for (Movimentacao m : listar(reservaId)) {
            ultimas.put(m.materialId(), m.tipo());   // a lista vem em ordem; a última prevalece
        }
        return ultimas;
    }

    @Override
    public List<Movimentacao> listar(long reservaId) {
        return jdbc.sql("""
                        select id, reserva_id, material_id, tipo::text as tipo, registrado_por_id, registrado_em
                          from movimentacoes_material
                         where reserva_id = :reserva
                         order by id
                        """)
                .param("reserva", reservaId)
                .query((rs, n) -> new Movimentacao(rs.getLong("id"), rs.getLong("reserva_id"),
                        rs.getLong("material_id"), TipoMovimentacao.valueOf(rs.getString("tipo")),
                        rs.getLong("registrado_por_id"), null,
                        rs.getObject("registrado_em", OffsetDateTime.class).toInstant()))
                .list();
    }
}
