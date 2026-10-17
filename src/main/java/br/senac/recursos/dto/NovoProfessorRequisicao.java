package br.senac.recursos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record NovoProfessorRequisicao(@NotBlank @Size(max = 200) String nome,
                               Long usuarioId,
                               List<@NotBlank @Size(max = 100) String> competencias,
                               boolean restrito) {
}
