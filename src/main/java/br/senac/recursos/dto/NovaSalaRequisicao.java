package br.senac.recursos.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;
import java.util.List;

public record NovaSalaRequisicao(@NotBlank @Size(max = 200) String nome,
                          @NotNull @Min(1) Integer capacidade,
                          @NotBlank @Size(max = 200) String localizacao,
                          @Size(max = 100) String tipoSala,
                          @NotNull LocalTime horaAbertura,
                          @NotNull LocalTime horaFechamento,
                          @NotEmpty List<@NotNull @Min(1) @Max(7) Integer> diasFuncionamento,
                          boolean restrito) {
}
