package br.senac.recursos.aplicacao.porta;

import br.senac.recursos.dominio.Perfil;
import java.util.Optional;

/** Porta de persistência de usuários (ADR-001). */
public interface UsuarioRepositorio {

    /** Usuário como gravado. A senha é sempre o hash. */
    record Registro(long id, String nome, String email, String senhaHash, Perfil perfil, boolean ativo) {
    }

    Optional<Registro> buscarPorEmail(String email);
}
