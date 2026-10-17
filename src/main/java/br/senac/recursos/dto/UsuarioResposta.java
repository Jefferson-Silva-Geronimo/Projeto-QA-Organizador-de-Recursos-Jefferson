package br.senac.recursos.dto;

import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Usuario;

public record UsuarioResposta(long id, String nome, String email, Perfil perfil, boolean ativo) {
    public static UsuarioResposta de(Usuario r) {
        return new UsuarioResposta(r.id(), r.nome(), r.email(), r.perfil(), r.ativo());
    }
}
