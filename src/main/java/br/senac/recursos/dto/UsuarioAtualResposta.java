package br.senac.recursos.dto;

import br.senac.recursos.model.Perfil;

public record UsuarioAtualResposta(long id, String email, Perfil perfil) {
}
