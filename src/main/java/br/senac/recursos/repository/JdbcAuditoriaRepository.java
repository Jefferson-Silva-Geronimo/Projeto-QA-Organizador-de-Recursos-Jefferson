package br.senac.recursos.repository;

import br.senac.recursos.model.EntidadeAuditada;
import br.senac.recursos.model.EventoAuditoria;
import br.senac.recursos.model.RegistroDeAuditoria;
import br.senac.recursos.model.TipoAtor;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcAuditoriaRepository implements AuditoriaRepository {

    private final JdbcClient jdbc;
    private final ObjectMapper json;

    JdbcAuditoriaRepository(JdbcClient jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    @Override
    public void registrar(EventoAuditoria e) {
        jdbc.sql("""
                        insert into auditoria_eventos
                               (ocorrido_em, ator_tipo, ator_id, entidade, entidade_id, acao,
                                estado_anterior, estado_novo, valores_antes, valores_depois, motivo, correlacao_id)
                        values (:quando, cast(:ator as tipo_ator), :atorId, cast(:entidade as entidade_auditada),
                                :entidadeId, :acao, :anterior, :novo, cast(:antes as jsonb), cast(:depois as jsonb),
                                :motivo, :correlacao)
                        """)
                .param("quando", JdbcSessaoRepository.utc(e.ocorridoEm()))
                .param("ator", e.ator().name())
                .param("atorId", e.atorId())
                .param("entidade", e.entidade().name())
                .param("entidadeId", e.entidadeId())
                .param("acao", e.acao())
                .param("anterior", e.estadoAnterior())
                .param("novo", e.estadoNovo())
                .param("antes", serializar(e.antes()))
                .param("depois", serializar(e.depois()))
                .param("motivo", e.motivo())
                .param("correlacao", e.correlacaoId())
                .update();
    }

    @Override
    public List<RegistroDeAuditoria> listar(EntidadeAuditada entidade, Long entidadeId) {
        return jdbc.sql("""
                        select a.id, a.ocorrido_em, a.ator_tipo::text as ator_tipo, a.ator_id, u.nome as ator_nome,
                               a.entidade::text as entidade, a.entidade_id, a.acao, a.estado_anterior, a.estado_novo,
                               a.valores_antes::text as antes, a.valores_depois::text as depois, a.motivo,
                               a.correlacao_id
                          from auditoria_eventos a
                          left join usuarios u on u.id = a.ator_id
                         where (cast(:entidade as text) is null or a.entidade::text = :entidade)
                           and (cast(:entidadeId as bigint) is null or a.entidade_id = :entidadeId)
                         order by a.ocorrido_em, a.id
                        """)
                .param("entidade", entidade == null ? null : entidade.name())
                .param("entidadeId", entidadeId)
                .query((rs, n) -> {
                    long ator = rs.getLong("ator_id");
                    Long atorId = rs.wasNull() ? null : ator;
                    return new RegistroDeAuditoria(rs.getLong("id"), new EventoAuditoria(
                            rs.getObject("ocorrido_em", OffsetDateTime.class).toInstant(),
                            TipoAtor.valueOf(rs.getString("ator_tipo")), atorId,
                            EntidadeAuditada.valueOf(rs.getString("entidade")), rs.getLong("entidade_id"),
                            rs.getString("acao"), rs.getString("estado_anterior"), rs.getString("estado_novo"),
                            ler(rs.getString("antes")), ler(rs.getString("depois")), rs.getString("motivo"),
                            (UUID) rs.getObject("correlacao_id")), rs.getString("ator_nome"));
                })
                .list();
    }

    private String serializar(Map<String, Object> valores) {
        if (valores == null) {
            return null;
        }
        try {
            return json.writeValueAsString(valores);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Valores de auditoria não serializáveis", ex);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> ler(String texto) {
        if (texto == null) {
            return null;
        }
        try {
            return json.readValue(texto, Map.class);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Valores de auditoria ilegíveis", ex);
        }
    }
}
