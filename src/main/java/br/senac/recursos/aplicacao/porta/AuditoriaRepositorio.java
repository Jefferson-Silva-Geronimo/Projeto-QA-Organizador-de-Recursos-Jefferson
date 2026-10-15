package br.senac.recursos.aplicacao.porta;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Porta da trilha de auditoria, somente inserção (ADR-006). Sempre chamada na mesma transação da
 * mudança que ela registra: falha ao auditar desfaz a mudança.
 */
public interface AuditoriaRepositorio {

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
    }

    void registrar(Evento evento);
}
