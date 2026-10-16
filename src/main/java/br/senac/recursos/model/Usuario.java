package br.senac.recursos.model;

/** Usuário como gravado. A senha é sempre o hash. */
public record Usuario(long id, String nome, String email, String senhaHash, Perfil perfil, boolean ativo) {
}
