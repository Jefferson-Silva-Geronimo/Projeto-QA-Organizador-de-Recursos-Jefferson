package br.senac.recursos.aplicacao.porta;

import br.senac.recursos.dominio.UsuarioAutenticado;
import java.time.Instant;
import java.util.Optional;

/** Porta de persistência das sessões com token opaco (ADR-004). Só o hash do token é guardado. */
public interface SessaoRepositorio {

    void criar(long usuarioId, String tokenHash, Instant criadaEm, Instant expiraEm);

    /** Sessão não revogada, não expirada em {@code agora} e de usuário ativo. */
    Optional<UsuarioAutenticado> buscarAtiva(String tokenHash, Instant agora);

    void revogar(String tokenHash, Instant agora);

    /** Revoga todas as sessões abertas do usuário (desativação, D14). */
    void revogarTodas(long usuarioId, Instant agora);
}
