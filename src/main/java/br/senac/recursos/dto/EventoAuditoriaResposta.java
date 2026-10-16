package br.senac.recursos.dto;

import br.senac.recursos.model.EventoAuditoria;
import br.senac.recursos.model.RegistroDeAuditoria;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Evento da trilha de auditoria. Nunca contém senha, hash nem token (ADR-006). */
public record EventoAuditoriaResposta(long id, Instant ocorridoEm, String atorTipo, Long atorId, String entidade,
                                      long entidadeId, String acao, String estadoAnterior, String estadoNovo,
                                      String motivo, Map<String, Object> antes, Map<String, Object> depois,
                                      UUID correlacaoId) {

    public static EventoAuditoriaResposta de(RegistroDeAuditoria r) {
        EventoAuditoria e = r.evento();
        return new EventoAuditoriaResposta(r.id(), e.ocorridoEm(), e.ator().name(), e.atorId(),
                e.entidade().name(), e.entidadeId(), e.acao(), e.estadoAnterior(), e.estadoNovo(), e.motivo(),
                e.antes(), e.depois(), e.correlacaoId());
    }
}
