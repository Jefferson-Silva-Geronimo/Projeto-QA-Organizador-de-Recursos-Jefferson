package br.senac.recursos.model;

import java.time.Instant;

public record Bloqueio(long id, long recursoId, Instant inicio, Instant fim, String motivo, boolean ativo) {
}
