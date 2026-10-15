package br.senac.recursos.aplicacao;

import br.senac.recursos.aplicacao.porta.AuditoriaRepositorio;
import br.senac.recursos.aplicacao.porta.AuditoriaRepositorio.Entidade;
import br.senac.recursos.aplicacao.porta.AuditoriaRepositorio.Evento;
import br.senac.recursos.aplicacao.porta.RecursoRepositorio;
import br.senac.recursos.aplicacao.porta.RecursoRepositorio.Detalhe;
import br.senac.recursos.aplicacao.porta.RecursoRepositorio.Filtro;
import br.senac.recursos.aplicacao.porta.RecursoRepositorio.Intervalo;
import br.senac.recursos.aplicacao.porta.RecursoRepositorio.NovaSala;
import br.senac.recursos.aplicacao.porta.RecursoRepositorio.NovoMaterial;
import br.senac.recursos.aplicacao.porta.RecursoRepositorio.NovoProfessor;
import br.senac.recursos.dominio.CodigoErro;
import br.senac.recursos.dominio.ErroDeNegocio;
import br.senac.recursos.dominio.UsuarioAutenticado;
import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cadastro, consulta e desativação de recursos (RF-02, RF-03). Cada alteração grava auditoria na
 * mesma transação (RN-29). O tempo vem sempre do relógio injetado (ADR-005).
 */
@Service
public class RecursoServico {

    private final RecursoRepositorio recursos;
    private final AuditoriaRepositorio auditoria;
    private final Clock relogio;

    public RecursoServico(RecursoRepositorio recursos, AuditoriaRepositorio auditoria, Clock relogio) {
        this.recursos = recursos;
        this.auditoria = auditoria;
        this.relogio = relogio;
    }

    @Transactional
    public Detalhe criarSala(UsuarioAutenticado ator, NovaSala sala) {
        if (!sala.horaFechamento().isAfter(sala.horaAbertura())) {
            throw new ErroDeNegocio(CodigoErro.VALIDACAO_FALHOU,
                    "A hora de fechamento deve ser posterior à de abertura. A reserva não cruza a meia-noite.");
        }
        Instant agora = relogio.instant();
        long id = recursos.criarSala(sala, agora);
        return registrarCriacao(ator, id, agora);
    }

    @Transactional
    public Detalhe criarProfessor(UsuarioAutenticado ator, NovoProfessor professor) {
        Instant agora = relogio.instant();
        long id;
        try {
            id = recursos.criarProfessor(professor, agora);
        } catch (DuplicateKeyException e) {
            throw new ErroDeNegocio(CodigoErro.VINCULO_JA_EXISTE);
        } catch (DataIntegrityViolationException e) {
            throw new ErroDeNegocio(CodigoErro.VALIDACAO_FALHOU, "O usuário informado para o vínculo não existe.");
        }
        return registrarCriacao(ator, id, agora);
    }

    @Transactional
    public Detalhe criarMaterial(UsuarioAutenticado ator, NovoMaterial material) {
        Instant agora = relogio.instant();
        long id;
        try {
            id = recursos.criarMaterial(material, agora);
        } catch (DuplicateKeyException e) {
            throw new ErroDeNegocio(CodigoErro.PATRIMONIO_JA_EXISTE);
        }
        return registrarCriacao(ator, id, agora);
    }

    @Transactional
    public Detalhe alterarRestrito(UsuarioAutenticado ator, long id, boolean restrito) {
        recursos.travar(id);
        Detalhe antes = obter(id);
        if (antes.restrito() == restrito) {
            return antes;
        }
        recursos.alterarRestrito(id, restrito);
        auditoria.registrar(Evento.deUsuario(relogio.instant(), ator.id(), Entidade.RECURSO, id,
                "RECURSO_RESTRICAO_ALTERADA",
                Map.of("restrito", antes.restrito()), Map.of("restrito", restrito)));
        return obter(id);
    }

    @Transactional
    public Detalhe desativar(UsuarioAutenticado ator, long id) {
        recursos.travar(id);
        Detalhe antes = obter(id);
        if (!antes.ativo()) {
            return antes;
        }
        Instant agora = relogio.instant();
        List<Long> futuras = recursos.reservasFuturas(id, agora);
        if (!futuras.isEmpty()) {
            throw new ErroDeNegocio(CodigoErro.RECURSO_COM_RESERVA_FUTURA,
                    CodigoErro.RECURSO_COM_RESERVA_FUTURA.mensagemPadrao(),
                    futuras.stream().map(String::valueOf).toList());
        }
        recursos.desativar(id);
        auditoria.registrar(Evento.deUsuario(agora, ator.id(), Entidade.RECURSO, id, "RECURSO_DESATIVADO",
                Map.of("ativo", true), Map.of("ativo", false)));
        return obter(id);
    }

    @Transactional(readOnly = true)
    public Detalhe obter(long id) {
        return recursos.buscarPorId(id).orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
    }

    @Transactional(readOnly = true)
    public List<Detalhe> pesquisar(Filtro filtro) {
        if ((filtro.inicio() == null) != (filtro.fim() == null)) {
            throw new ErroDeNegocio(CodigoErro.VALIDACAO_FALHOU, "Informe início e fim juntos.");
        }
        if (filtro.inicio() != null && !filtro.fim().isAfter(filtro.inicio())) {
            throw new ErroDeNegocio(CodigoErro.VALIDACAO_FALHOU, "O fim deve ser posterior ao início.");
        }
        return recursos.pesquisar(filtro);
    }

    @Transactional(readOnly = true)
    public List<Intervalo> ocupacoes(long recursoId, Instant inicio, Instant fim) {
        obter(recursoId);
        if (!fim.isAfter(inicio)) {
            throw new ErroDeNegocio(CodigoErro.VALIDACAO_FALHOU, "O fim deve ser posterior ao início.");
        }
        return recursos.ocupacoes(recursoId, inicio, fim);
    }

    private Detalhe registrarCriacao(UsuarioAutenticado ator, long id, Instant agora) {
        Detalhe criado = obter(id);
        Map<String, Object> visao = new LinkedHashMap<>();
        visao.put("tipo", criado.tipo().name());
        visao.put("nome", criado.nome());
        visao.put("restrito", criado.restrito());
        visao.put("ativo", criado.ativo());
        auditoria.registrar(Evento.deUsuario(agora, ator.id(), Entidade.RECURSO, id, "RECURSO_CRIADO", null, visao));
        return criado;
    }
}
