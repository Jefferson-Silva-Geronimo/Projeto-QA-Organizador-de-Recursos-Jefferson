package br.senac.recursos.model;

import java.time.Instant;

/** Retirada ou devolução de uma unidade de material, com quem registrou e quando (RF-09). */
public record Movimentacao(long id, long reservaId, long materialId, TipoMovimentacao tipo,
                           long registradoPorId, Instant registradoEm) {
}
