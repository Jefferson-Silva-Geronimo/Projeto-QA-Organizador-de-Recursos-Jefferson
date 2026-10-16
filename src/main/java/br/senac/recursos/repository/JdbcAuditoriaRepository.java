package br.senac.recursos.repository;

import br.senac.recursos.repository.AuditoriaRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
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
    public void registrar(Evento e) {
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
}
