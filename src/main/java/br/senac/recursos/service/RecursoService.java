package br.senac.recursos.service;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.EntidadeAuditada;
import br.senac.recursos.model.EventoAuditoria;
import br.senac.recursos.model.FiltroDeRecursos;
import br.senac.recursos.model.IntervaloOcupado;
import br.senac.recursos.model.NovaSala;
import br.senac.recursos.model.NovoMaterial;
import br.senac.recursos.model.NovoProfessor;
import br.senac.recursos.model.Periodo;
import br.senac.recursos.model.Recurso;
import br.senac.recursos.model.TipoRecurso;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.model.regra.JanelaDeFuncionamento;
import br.senac.recursos.repository.AuditoriaRepository;
import br.senac.recursos.repository.ConfiguracaoRepository;
import br.senac.recursos.repository.RecursoRepository;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneId;
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
public class RecursoService {

    private final RecursoRepository recursos;
    private final AuditoriaRepository auditoria;
    private final ConfiguracaoRepository configuracao;
    private final Clock relogio;

    public RecursoService(RecursoRepository recursos, AuditoriaRepository auditoria,
                          ConfiguracaoRepository configuracao, Clock relogio) {
        this.recursos = recursos;
        this.auditoria = auditoria;
        this.configuracao = configuracao;
        this.relogio = relogio;
    }

    @Transactional
    public Recurso criarSala(UsuarioAutenticado ator, NovaSala sala) {
        if (!sala.horaFechamento().isAfter(sala.horaAbertura())) {
            throw new ErroDeNegocio(CodigoErro.VALIDACAO_FALHOU,
                    "A hora de fechamento deve ser posterior à de abertura. A reserva não cruza a meia-noite.");
        }
        Instant agora = relogio.instant();
        long id = recursos.criarSala(sala, agora);
        return registrarCriacao(ator, id, agora);
    }

    @Transactional
    public Recurso criarProfessor(UsuarioAutenticado ator, NovoProfessor professor) {
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
    public Recurso criarMaterial(UsuarioAutenticado ator, NovoMaterial material) {
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
    public Recurso alterarRestrito(UsuarioAutenticado ator, long id, boolean restrito) {
        recursos.travar(id);
        Recurso antes = obter(id);
        if (antes.restrito() == restrito) {
            return antes;
        }
        recursos.alterarRestrito(id, restrito);
        auditoria.registrar(EventoAuditoria.deUsuario(relogio.instant(), ator.id(), EntidadeAuditada.RECURSO, id,
                "RECURSO_RESTRICAO_ALTERADA",
                Map.of("restrito", antes.restrito()), Map.of("restrito", restrito)));
        return obter(id);
    }

    @Transactional
    public Recurso desativar(UsuarioAutenticado ator, long id) {
        recursos.travar(id);
        Recurso antes = obter(id);
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
        auditoria.registrar(EventoAuditoria.deUsuario(agora, ator.id(), EntidadeAuditada.RECURSO, id, "RECURSO_DESATIVADO",
                Map.of("ativo", true), Map.of("ativo", false)));
        return obter(id);
    }

    @Transactional(readOnly = true)
    public Recurso obter(long id) {
        return recursos.buscarPorId(id).orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
    }

    @Transactional(readOnly = true)
    public List<Recurso> pesquisar(FiltroDeRecursos filtro) {
        if ((filtro.inicio() == null) != (filtro.fim() == null)) {
            throw new ErroDeNegocio(CodigoErro.VALIDACAO_FALHOU, "Informe início e fim juntos.");
        }
        if (filtro.inicio() != null && !filtro.fim().isAfter(filtro.inicio())) {
            throw new ErroDeNegocio(CodigoErro.VALIDACAO_FALHOU, "O fim deve ser posterior ao início.");
        }
        List<Recurso> encontrados = recursos.pesquisar(filtro);
        if (filtro.inicio() == null) {
            return encontrados;
        }
        // Sala só é devolvida se o intervalo cabe na janela e cai em dia de funcionamento (RN-14, RF-03).
        Periodo periodo = new Periodo(filtro.inicio(), filtro.fim());
        ZoneId fuso = configuracao.fuso();
        return encontrados.stream().filter(d -> d.tipo() != TipoRecurso.SALA || cabeNaJanela(d, periodo, fuso))
                .toList();
    }

    private static boolean cabeNaJanela(Recurso sala, Periodo periodo, ZoneId fuso) {
        JanelaDeFuncionamento janela = new JanelaDeFuncionamento(sala.horaAbertura(), sala.horaFechamento(),
                sala.diasFuncionamento().stream().map(DayOfWeek::of).collect(java.util.stream.Collectors.toSet()));
        try {
            janela.verificar(periodo, fuso);
            return true;
        } catch (ErroDeNegocio e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public List<IntervaloOcupado> ocupacoes(long recursoId, Instant inicio, Instant fim) {
        obter(recursoId);
        if (!fim.isAfter(inicio)) {
            throw new ErroDeNegocio(CodigoErro.VALIDACAO_FALHOU, "O fim deve ser posterior ao início.");
        }
        return recursos.ocupacoes(recursoId, inicio, fim);
    }

    private Recurso registrarCriacao(UsuarioAutenticado ator, long id, Instant agora) {
        Recurso criado = obter(id);
        Map<String, Object> visao = new LinkedHashMap<>();
        visao.put("tipo", criado.tipo().name());
        visao.put("nome", criado.nome());
        visao.put("restrito", criado.restrito());
        visao.put("ativo", criado.ativo());
        auditoria.registrar(EventoAuditoria.deUsuario(agora, ator.id(), EntidadeAuditada.RECURSO, id, "RECURSO_CRIADO", null, visao));
        return criado;
    }
}
