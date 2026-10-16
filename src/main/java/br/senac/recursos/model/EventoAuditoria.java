package br.senac.recursos.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * EventoAuditoria de auditoria. {@code atorId} é nulo se, e somente se, o ator é SISTEMA.
 * {@code antes} e {@code depois} nunca contêm senha, hash nem token.
 */
public record EventoAuditoria(Instant ocorridoEm, TipoAtor ator, Long atorId, EntidadeAuditada entidade, long entidadeId,
              String acao, String estadoAnterior, String estadoNovo,
              Map<String, Object> antes, Map<String, Object> depois, String motivo, UUID correlacaoId) {

    public static EventoAuditoria deUsuario(Instant quando, long atorId, EntidadeAuditada entidade, long entidadeId, String acao,
                                   Map<String, Object> antes, Map<String, Object> depois) {
        return new EventoAuditoria(quando, TipoAtor.USUARIO, atorId, entidade, entidadeId, acao,
                null, null, antes, depois, null, null);
    }

    /** Transição de estado de reserva feita por um usuário. */
    public static EventoAuditoria transicaoDeUsuario(Instant quando, long atorId, long reservaId, String acao,
                                            String anterior, String novo, Map<String, Object> antes,
                                            Map<String, Object> depois, String motivo) {
        return new EventoAuditoria(quando, TipoAtor.USUARIO, atorId, EntidadeAuditada.RESERVA, reservaId, acao,
                anterior, novo, antes, depois, motivo, null);
    }

    /** Transição de estado de reserva feita pelo SISTEMA (aprovação automática, job). */
    public static EventoAuditoria transicaoDoSistema(Instant quando, long reservaId, String acao,
                                            String anterior, String novo, String motivo) {
        return new EventoAuditoria(quando, TipoAtor.SISTEMA, null, EntidadeAuditada.RESERVA, reservaId, acao,
                anterior, novo, null, null, motivo, null);
    }

    public static EventoAuditoria deSistema(Instant quando, EntidadeAuditada entidade, long entidadeId, String acao,
                                   Map<String, Object> antes, Map<String, Object> depois) {
        return new EventoAuditoria(quando, TipoAtor.SISTEMA, null, entidade, entidadeId, acao,
                null, null, antes, depois, null, null);
    }
}
