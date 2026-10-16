package br.senac.recursos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NovoMaterialRequisicao(@NotBlank @Size(max = 200) String nome,
                              @NotBlank @Size(max = 100) String codigoPatrimonio,
                              @Size(max = 500) String descricao,
                              boolean restrito) {
}
