package br.senac.recursos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequisicao(@NotBlank @Size(max = 254) String email,
                       @NotBlank @Size(max = 72) String senha) {
}
