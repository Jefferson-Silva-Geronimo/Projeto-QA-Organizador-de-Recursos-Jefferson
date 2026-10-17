package br.senac.recursos.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public record NovoBloqueioRequisicao(@NotNull Long recursoId, @NotNull Instant inicio, @NotNull Instant fim,
                    @Size(max = 1000) String motivo, List<@NotNull Long> reservasConfirmadas) {
}
