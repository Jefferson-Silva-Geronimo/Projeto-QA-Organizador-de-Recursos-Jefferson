package br.senac.recursos.model;

import java.time.Instant;

/**
 * Notificação a enviar ao provedor externo. O conteúdo é mínimo: só identificadores, sem dado pessoal
 * (C6). A chave de idempotência é a mesma em todo reenvio.
 */
public record Notificacao(long id, long reservaId, EventoNotificacao evento, long destinatarioId,
                          StatusNotificacao status, int tentativas, String chaveIdempotencia,
                          Instant proximaTentativaEm) {
}
