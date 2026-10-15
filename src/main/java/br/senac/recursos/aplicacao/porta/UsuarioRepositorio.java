package br.senac.recursos.aplicacao.porta;

import br.senac.recursos.dominio.Perfil;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Porta de persistência de usuários (ADR-001). */
public interface UsuarioRepositorio {

    /** Usuário como gravado. A senha é sempre o hash. */
    record Registro(long id, String nome, String email, String senhaHash, Perfil perfil, boolean ativo) {
    }

    Optional<Registro> buscarPorEmail(String email);

    Optional<Registro> buscarPorId(long id);

    List<Registro> listar();

    long contar();

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
