package br.senac.recursos.service;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.SessaoAberta;
import br.senac.recursos.model.Usuario;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.repository.SessaoRepository;
import br.senac.recursos.repository.UsuarioRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Login, identificação e saída (RF-01, ADR-004). O token é opaco e aleatório; o banco guarda só o hash.
 * O tempo vem sempre do relógio injetado (ADR-005).
 */
public class AutenticacaoService {

    private static final SecureRandom ALEATORIO = new SecureRandom();

    private final UsuarioRepository usuarios;
    private final SessaoRepository sessoes;
    private final PasswordEncoder codificador;
    private final Clock relogio;
    private final Duration duracaoDaSessao;
    private final String hashParaTempoConstante;

    public AutenticacaoService(UsuarioRepository usuarios, SessaoRepository sessoes,
                               PasswordEncoder codificador, Clock relogio, Duration duracaoDaSessao) {
        this.usuarios = usuarios;
        this.sessoes = sessoes;
        this.codificador = codificador;
        this.relogio = relogio;
        this.duracaoDaSessao = duracaoDaSessao;
        // Comparado quando o usuário não existe, para que a resposta demore o mesmo tempo. A senha-isca é
        // aleatória a cada inicialização: nenhuma credencial fixa no código.
        this.hashParaTempoConstante = codificador.encode(UUID.randomUUID().toString());
    }

    public SessaoAberta entrar(String email, String senha) {
        Optional<Usuario> encontrado = usuarios.buscarPorEmail(normalizar(email));
        String hash = encontrado.map(Usuario::senhaHash).orElse(hashParaTempoConstante);
        boolean confere = codificador.matches(senha, hash);
        if (encontrado.isEmpty() || !confere || !encontrado.get().ativo()) {
            throw new ErroDeNegocio(CodigoErro.CREDENCIAIS_INVALIDAS);
        }
        Usuario usuario = encontrado.get();
        String token = novoToken();
        Instant agora = relogio.instant();
        Instant expiraEm = agora.plus(duracaoDaSessao);
        sessoes.criar(usuario.id(), hashDoToken(token), agora, expiraEm);
        return new SessaoAberta(token, usuario.perfil(), expiraEm);
    }

    public Optional<UsuarioAutenticado> identificar(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return sessoes.buscarAtiva(hashDoToken(token), relogio.instant());
    }

    public void sair(String token) {
        if (token != null && !token.isBlank()) {
            sessoes.revogar(hashDoToken(token), relogio.instant());
        }
    }

    public static String normalizar(String email) {
        return email == null ? "" : email.trim().toLowerCase(java.util.Locale.ROOT);
    }

    static String novoToken() {
        byte[] bytes = new byte[32];
        ALEATORIO.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hashDoToken(String token) {
        try {
            byte[] resumo = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(resumo);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
