package br.senac.recursos.repository;

import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Usuario;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Porta de persistência de usuários (ADR-001). */
public interface UsuarioRepository {

    Optional<Usuario> buscarPorEmail(String email);

    Optional<Usuario> buscarPorId(long id);

    List<Usuario> listar();

    long contar();

    /** Identificadores dos Responsáveis ativos, em ordem. */
    List<Long> idsDeResponsaveisAtivos();

    /** Cria o usuário. Falha com {@code DuplicateKeyException} se o e-mail já existe. */
    long criar(String nome, String email, String senhaHash, Perfil perfil, Instant criadoEm);

    void alterarPerfil(long id, Perfil perfil);

    void desativar(long id);

    /**
     * Trava os Responsáveis ativos até o fim da transação e devolve os seus identificadores.
     * Serializa desativações simultâneas, para que o mínimo de dois Responsáveis valha (B1, D14).
     */
    List<Long> travarResponsaveisAtivos();

    /** Reservas SOLICITADA, APROVADA ou EM_USO do dono com término posterior a {@code agora} (D11). */
    List<Long> reservasFuturas(long usuarioId, Instant agora);
}
