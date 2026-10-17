package br.senac.recursos.dto;

import jakarta.validation.constraints.Size;

public record CancelamentoRequisicao(@Size(max = 1000) String motivo) {
}
