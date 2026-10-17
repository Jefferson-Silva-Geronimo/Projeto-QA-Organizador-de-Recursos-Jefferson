package br.senac.recursos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public record NovaReservaRequisicao(@NotBlank @Size(max = 200) String titulo,
                             @Size(max = 2000) String descricao,
                             @NotNull Instant inicio,
                             @NotNull Instant fim,
                             @NotEmpty List<@NotNull Long> recursoIds) {
}
