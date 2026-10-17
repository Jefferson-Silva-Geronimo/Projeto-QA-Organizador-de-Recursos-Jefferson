package br.senac.recursos.service;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.EntidadeAuditada;
import br.senac.recursos.model.EventoAuditoria;
import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Usuario;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.repository.AuditoriaRepository;
import br.senac.recursos.repository.SessaoRepository;
import br.senac.recursos.repository.UsuarioRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gestão de usuários e perfis (RF-15). Só o Administrador a executa; a camada de API garante o perfil.
 * Cada operação grava a auditoria na mesma transação (RN-29, ADR-006).
 */
@Service
public class UsuarioService {

    /** Mínimo de Responsáveis ativos na operação (B1, D14). */
    static final int MINIMO_DE_RESPONSAVEIS = 2;

    private final UsuarioRepository usuarios;
    private final SessaoRepository sessoes;
    private final AuditoriaRepository auditoria;
    private final PasswordEncoder codificador;
    private final Clock relogio;

    public UsuarioService(UsuarioRepository usuarios, SessaoRepository sessoes, AuditoriaRepository auditoria,
                          PasswordEncoder codificador, Clock relogio) {
        this.usuarios = usuarios;
        this.sessoes = sessoes;
        this.auditoria = auditoria;
        this.codificador = codificador;
        this.relogio = relogio;
    }

    @Transactional
    public Usuario criar(UsuarioAutenticado ator, String nome, String email, String senha, Perfil perfil) {
        String normalizado = AutenticacaoService.normalizar(email);
        Instant agora = relogio.instant();
        long id;
        try {
            id = usuarios.criar(nome.trim(), normalizado, codificador.encode(senha), perfil, agora);
        } catch (DuplicateKeyException e) {
            throw new ErroDeNegocio(CodigoErro.USUARIO_JA_EXISTE);
        }
        auditoria.registrar(EventoAuditoria.deUsuario(agora, ator.id(), EntidadeAuditada.USUARIO, id, "USUARIO_CRIADO",
                null, visao(nome.trim(), normalizado, perfil, true)));
        return usuarios.buscarPorId(id).orElseThrow();
    }

    @Transactional
    public Usuario alterarPerfil(UsuarioAutenticado ator, long id, Perfil novo) {
        Usuario antes = obter(id);
        if (antes.perfil() == novo) {
            return antes;
        }
        usuarios.alterarPerfil(id, novo);
        auditoria.registrar(EventoAuditoria.deUsuario(relogio.instant(), ator.id(), EntidadeAuditada.USUARIO, id,
                "USUARIO_PERFIL_ALTERADO",
                Map.of("perfil", antes.perfil().name()), Map.of("perfil", novo.name())));
        return obter(id);
    }

    @Transactional
    public Usuario desativar(UsuarioAutenticado ator, long id) {
        // Trava os Responsáveis ativos antes de contar, para serializar desativações simultâneas.
        List<Long> responsaveis = usuarios.travarResponsaveisAtivos();
        Usuario alvo = obter(id);
        if (!alvo.ativo()) {
            return alvo;
        }
        if (alvo.perfil() == Perfil.RESPONSAVEL && responsaveis.size() - 1 < MINIMO_DE_RESPONSAVEIS) {
            throw new ErroDeNegocio(CodigoErro.MINIMO_DE_RESPONSAVEIS);
        }
        Instant agora = relogio.instant();
        List<Long> futuras = usuarios.reservasFuturas(id, agora);
        if (!futuras.isEmpty()) {
            throw new ErroDeNegocio(CodigoErro.USUARIO_COM_RESERVA_FUTURA,
                    CodigoErro.USUARIO_COM_RESERVA_FUTURA.mensagemPadrao(),
                    futuras.stream().map(String::valueOf).toList());
        }
        usuarios.desativar(id);
        sessoes.revogarTodas(id, agora);
        auditoria.registrar(EventoAuditoria.deUsuario(agora, ator.id(), EntidadeAuditada.USUARIO, id, "USUARIO_DESATIVADO",
                Map.of("ativo", true), Map.of("ativo", false)));
        return obter(id);
    }

    /**
     * Cria o primeiro Administrador quando não há nenhum usuário. Sem ele, ninguém cadastra usuários.
     * Devolve {@code true} se criou.
     */
    @Transactional
    public boolean semearPrimeiroAdministrador(String nome, String email, String senha) {
        if (usuarios.contar() > 0) {
            return false;
        }
        String normalizado = AutenticacaoService.normalizar(email);
        Instant agora = relogio.instant();
        long id = usuarios.criar(nome.trim(), normalizado, codificador.encode(senha), Perfil.ADMINISTRADOR, agora);
        auditoria.registrar(EventoAuditoria.deSistema(agora, EntidadeAuditada.USUARIO, id, "USUARIO_CRIADO",
                null, visao(nome.trim(), normalizado, Perfil.ADMINISTRADOR, true)));
        return true;
    }

    @Transactional(readOnly = true)
    public List<Usuario> listar() {
        return usuarios.listar();
    }

    private Usuario obter(long id) {
        return usuarios.buscarPorId(id).orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
    }

    /** Visão auditável do usuário. Nunca inclui senha nem hash. */
    private static Map<String, Object> visao(String nome, String email, Perfil perfil, boolean ativo) {
        Map<String, Object> visao = new LinkedHashMap<>();
        visao.put("nome", nome);
        visao.put("email", email);
        visao.put("perfil", perfil.name());
        visao.put("ativo", ativo);
        return visao;
    }
}
