package br.senac.recursos.repository;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Porta da trilha de auditoria, somente inserção (ADR-006). Sempre chamada na mesma transação da
 * mudança que ela registra: falha ao auditar desfaz a mudança.
 */
public interface AuditoriaRepository {

    enum TipoAtor { USUARIO, SISTEMA }

    enum Entidade { RESERVA, RECURSO, USUARIO, BLOQUEIO, CONFIGURACAO }

    /**
     * Evento de auditoria. {@code atorId} é nulo se, e somente se, o ator é SISTEMA.
     * {@code antes} e {@code depois} nunca contêm senha, hash nem token.
     */
    record Evento(Instant ocorridoEm, TipoAtor ator, Long atorId, Entidade entidade, long entidadeId,
                  String acao, String estadoAnterior, String estadoNovo,
                  Map<String, Object> antes, Map<String, Object> depois, String motivo, UUID correlacaoId) {

        public static Evento deUsuario(Instant quando, long atorId, Entidade entidade, long entidadeId, String acao,
                                       Map<String, Object> antes, Map<String, Object> depois) {
            return new Evento(quando, TipoAtor.USUARIO, atorId, entidade, entidadeId, acao,
                    null, null, antes, depois, null, null);
        }

        /** Transição de estado de reserva feita por um usuário. */
        public static Evento transicaoDeUsuario(Instant quando, long atorId, long reservaId, String acao,
                                                String anterior, String novo, Map<String, Object> antes,
                                                Map<String, Object> depois, String motivo) {
            return new Evento(quando, TipoAtor.USUARIO, atorId, Entidade.RESERVA, reservaId, acao,
                    anterior, novo, antes, depois, motivo, null);
        }

        /** Transição de estado de reserva feita pelo SISTEMA (aprovação automática, job). */
        public static Evento transicaoDoSistema(Instant quando, long reservaId, String acao,
                                                String anterior, String novo, String motivo) {
            return new Evento(quando, TipoAtor.SISTEMA, null, Entidade.RESERVA, reservaId, acao,
                    anterior, novo, null, null, motivo, null);
        }

        public static Evento deSistema(Instant quando, Entidade entidade, long entidadeId, String acao,
                                       Map<String, Object> antes, Map<String, Object> depois) {
            return new Evento(quando, TipoAtor.SISTEMA, null, entidade, entidadeId, acao,
                    null, null, antes, depois, null, null);
        }
    }

    void registrar(Evento evento);
}
