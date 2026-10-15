package br.senac.recursos.aplicacao;

import br.senac.recursos.aplicacao.porta.AuditoriaRepositorio;
import br.senac.recursos.aplicacao.porta.AuditoriaRepositorio.Entidade;
import br.senac.recursos.aplicacao.porta.AuditoriaRepositorio.Evento;
import br.senac.recursos.aplicacao.porta.SessaoRepositorio;
import br.senac.recursos.aplicacao.porta.UsuarioRepositorio;
import br.senac.recursos.aplicacao.porta.UsuarioRepositorio.Registro;
import br.senac.recursos.dominio.CodigoErro;
import br.senac.recursos.dominio.ErroDeNegocio;
import br.senac.recursos.dominio.Perfil;
import br.senac.recursos.dominio.UsuarioAutenticado;
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
public class UsuarioServico {

    /** Mínimo de Responsáveis ativos na operação (B1, D14). */
    static final int MINIMO_DE_RESPONSAVEIS = 2;

    private final UsuarioRepositorio usuarios;
    private final SessaoRepositorio sessoes;
    private final AuditoriaRepositorio auditoria;
    private final PasswordEncoder codificador;
    private final Clock relogio;

    public UsuarioServico(UsuarioRepositorio usuarios, SessaoRepositorio sessoes, AuditoriaRepositorio auditoria,
                          PasswordEncoder codificador, Clock relogio) {
        this.usuarios = usuarios;
        this.sessoes = sessoes;
        this.auditoria = auditoria;
        this.codificador = codificador;
        this.relogio = relogio;
    }

    @Transactional
    public Registro criar(UsuarioAutenticado ator, String nome, String email, String senha, Perfil perfil) {
        String normalizado = AutenticacaoServico.normalizar(email);
        Instant agora = relogio.instant();
        long id;
        try {
            id = usuarios.criar(nome.trim(), normalizado, codificador.encode(senha), perfil, agora);
        } catch (DuplicateKeyException e) {
            throw new ErroDeNegocio(CodigoErro.USUARIO_JA_EXISTE);
        }
        auditoria.registrar(Evento.deUsuario(agora, ator.id(), Entidade.USUARIO, id, "USUARIO_CRIADO",
                null, visao(nome.trim(), normalizado, perfil, true)));
        return usuarios.buscarPorId(id).orElseThrow();
    }

    @Transactional
    public Registro alterarPerfil(UsuarioAutenticado ator, long id, Perfil novo) {
        Registro antes = obter(id);
        if (antes.perfil() == novo) {
            return antes;
        }
        usuarios.alterarPerfil(id, novo);
        auditoria.registrar(Evento.deUsuario(relogio.instant(), ator.id(), Entidade.USUARIO, id,
                "USUARIO_PERFIL_ALTERADO",
                Map.of("perfil", antes.perfil().name()), Map.of("perfil", novo.name())));
        return obter(id);
    }

    @Transactional
    public Registro desativar(UsuarioAutenticado ator, long id) {
        // Trava os Responsáveis ativos antes de contar, para serializar desativações simultâneas.
        List<Long> responsaveis = usuarios.travarResponsaveisAtivos();
        Registro alvo = obter(id);
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
        auditoria.registrar(Evento.deUsuario(agora, ator.id(), Entidade.USUARIO, id, "USUARIO_DESATIVADO",
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
        String normalizado = AutenticacaoServico.normalizar(email);
        Instant agora = relogio.instant();
        long id = usuarios.criar(nome.trim(), normalizado, codificador.encode(senha), Perfil.ADMINISTRADOR, agora);
        auditoria.registrar(Evento.deSistema(agora, Entidade.USUARIO, id, "USUARIO_CRIADO",
                null, visao(nome.trim(), normalizado, Perfil.ADMINISTRADOR, true)));
        return true;
    }

    @Transactional(readOnly = true)
    public List<Registro> listar() {
        return usuarios.listar();
    }

    private Registro obter(long id) {
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
