package br.senac.recursos.dto;

import br.senac.recursos.model.Perfil;
import jakarta.validation.constraints.NotNull;

public record NovoPerfilRequisicao(@NotNull Perfil perfil) {
}
