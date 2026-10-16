package br.senac.recursos.dto;

import br.senac.recursos.model.Perfil;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Senha: mínimo de 8 caracteres (NIST SP 800-63B) e máximo de 72 bytes do BCrypt. Sem requisito próprio. */
public record NovoUsuarioRequisicao(@NotBlank @Size(max = 200) String nome,
                   @NotBlank @Email @Size(max = 254) String email,
                   @NotBlank @Size(min = 8, max = 72) String senha,
                   @NotNull Perfil perfil) {
}
