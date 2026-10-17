package br.senac.recursos.dto;

import jakarta.validation.constraints.NotNull;

/** Unidade de material retirada ou devolvida (RF-09). */
public record MaterialRequisicao(@NotNull Long materialId) {
}
