package br.senac.recursos.model;

import java.time.Instant;

/** Sessão recém-aberta. {@code token} só existe em memória e na resposta ao cliente. */
public record SessaoAberta(String token, Perfil perfil, Instant expiraEm) {
}
