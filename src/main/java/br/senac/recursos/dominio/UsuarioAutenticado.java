package br.senac.recursos.dominio;

/** Quem faz a requisição, já autenticado. Vem da sessão, nunca do corpo da requisição. */
public record UsuarioAutenticado(long id, String email, Perfil perfil) {
}
