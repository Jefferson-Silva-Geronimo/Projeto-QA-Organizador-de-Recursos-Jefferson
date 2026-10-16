package br.senac.recursos.repository;

import br.senac.recursos.model.EventoNotificacao;
import br.senac.recursos.model.Notificacao;
import br.senac.recursos.model.StatusNotificacao;
import java.time.Instant;
import java.util.List;

/** Acesso a dados das notificações, que funcionam como caixa de saída transacional (RN-28, ADR-007). */
public interface NotificacaoRepository {

    /** Grava a notificação PENDENTE. Chamada na mesma transação da mudança que a originou. */
    void inserir(long reservaId, EventoNotificacao evento, long destinatarioId, String chaveIdempotencia,
                 Instant agora);

    /**
     * Notificações prontas para envio: nunca tentadas, ou com a próxima tentativa vencida. Travadas
     * com {@code skip locked}, para duas instâncias não enviarem a mesma notificação.
     */
    List<Notificacao> buscarParaEnvio(Instant agora, int limite);

    void atualizar(long id, StatusNotificacao status, int tentativas, Instant proximaTentativaEm,
                   Instant enviadaEm);
}
