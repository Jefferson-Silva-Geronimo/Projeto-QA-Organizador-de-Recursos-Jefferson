package br.senac.recursos.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public record AlteracaoReservaRequisicao(@Size(min = 1, max = 200) String titulo,
                           @Size(max = 2000) String descricao,
                           Instant inicio,
                           Instant fim,
                           List<@NotNull Long> recursoIds) {
}
