package br.senac.recursos.service;

import br.senac.recursos.repository.AuditoriaRepository;
import br.senac.recursos.repository.AuditoriaRepository.Entidade;
import br.senac.recursos.repository.AuditoriaRepository.Evento;
import br.senac.recursos.repository.AuditoriaRepository.TipoAtor;
import br.senac.recursos.repository.BloqueioRepository;
import br.senac.recursos.repository.BloqueioRepository.Registro;
import br.senac.recursos.repository.RecursoRepository;
import br.senac.recursos.repository.RecursoRepository.Detalhe;
import br.senac.recursos.repository.ReservaRepository;
import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.Periodo;
import br.senac.recursos.model.UsuarioAutenticado;
import java.sql.SQLException;
import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.UUID;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bloqueio de manutenção (RF-08, RN-04, RN-22, D7, D15). Só o Administrador (RN-17).
 *
 * <p>Criar bloqueio sobre reservas é em duas etapas: a primeira resposta lista as reservas afetadas,
 * sem gravar nada; a confirmação precisa devolver exatamente essa lista. Reserva em uso impede o
 * bloqueio, sem opção de forçar (RN-07).
 */
@Service
public class BloqueioService {

    private static final String SQLSTATE_EXCLUSAO = "23P01";
    private static final String SQLSTATE_IMPASSE = "40P01";

    /** Bloqueio criado e as reservas que ele cancelou por inteiro. */
    public record Criado(Registro bloqueio, List<Long> reservasCanceladas) {
    }

    private final BloqueioRepository bloqueios;
    private final ReservaRepository reservas;
    private final RecursoRepository recursos;
    private final AuditoriaRepository auditoria;
    private final Clock relogio;

    public BloqueioService(BloqueioRepository bloqueios, ReservaRepository reservas, RecursoRepository recursos,
                           AuditoriaRepository auditoria, Clock relogio) {
        this.bloqueios = bloqueios;
        this.reservas = reservas;
        this.recursos = recursos;
        this.auditoria = auditoria;
        this.relogio = relogio;
    }

    @Transactional
    public Criado criar(UsuarioAutenticado ator, long recursoId, Periodo periodo, String motivo,
                        List<Long> reservasConfirmadas) {
        Instant agora = relogio.instant();
        if (motivo == null || motivo.isBlank()) {
            throw new ErroDeNegocio(CodigoErro.MOTIVO_OBRIGATORIO);
        }
        // Trava exclusiva do recurso: espera as reservas em criação e impede novas durante o bloqueio.
        if (!recursos.travar(recursoId)) {
            throw new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO);
        }
        Detalhe recurso = recursos.buscarPorId(recursoId).orElseThrow();
        if (!recurso.ativo()) {
            throw new ErroDeNegocio(CodigoErro.RECURSO_INATIVO);
        }

        var afetadas = reservas.reservasAtivasQueTocam(recursoId, periodo);
        if (afetadas.stream().anyMatch(r -> r.estado() == EstadoReserva.EM_USO)) {
            throw new ErroDeNegocio(CodigoErro.BLOQUEIO_COM_RESERVA_EM_USO);
        }
        List<Long> ids = afetadas.stream().map(r -> r.id()).sorted().toList();
        if (!ids.isEmpty()) {
            List<String> itens = ids.stream().map(String::valueOf).toList();
            if (reservasConfirmadas == null) {
                throw new ErroDeNegocio(CodigoErro.BLOQUEIO_PENDE_CONFIRMACAO,
                        CodigoErro.BLOQUEIO_PENDE_CONFIRMACAO.mensagemPadrao(), itens);
            }
            if (!new TreeSet<>(reservasConfirmadas).equals(new TreeSet<>(ids))) {
                throw new ErroDeNegocio(CodigoErro.BLOQUEIO_LISTA_DESATUALIZADA,
                        CodigoErro.BLOQUEIO_LISTA_DESATUALIZADA.mensagemPadrao(), itens);
            }
        }

        UUID correlacao = UUID.randomUUID();
        for (var reserva : afetadas) {
            if (!reservas.cancelarPeloSistema(reserva.id(), reserva.estado(), "MANUTENCAO", agora)) {
                throw new ErroDeNegocio(CodigoErro.BLOQUEIO_LISTA_DESATUALIZADA);
            }
            reservas.inativarOcupacoes(reserva.id());                               // por inteiro (D7)
            auditoria.registrar(new Evento(agora, TipoAtor.SISTEMA, null, Entidade.RESERVA, reserva.id(),
                    "RESERVA_CANCELADA", reserva.estado().name(), EstadoReserva.CANCELADA.name(),
                    null, null, "MANUTENCAO", correlacao));
        }

        long id;
        try {
            id = bloqueios.inserir(recursoId, periodo, motivo.trim(), ator.id(), agora);
        } catch (DataAccessException e) {
            Throwable causa = NestedExceptionUtils.getMostSpecificCause(e);
            if (causa instanceof SQLException sql
                    && (SQLSTATE_EXCLUSAO.equals(sql.getSQLState()) || SQLSTATE_IMPASSE.equals(sql.getSQLState()))) {
                throw new ErroDeNegocio(CodigoErro.CONFLITO_DE_ALOCACAO);
            }
            throw e;
        }
        Map<String, Object> depois = new LinkedHashMap<>();
        depois.put("recursoId", recursoId);
        depois.put("inicio", periodo.inicio().toString());
        depois.put("fim", periodo.fim().toString());
        depois.put("motivo", motivo.trim());
        auditoria.registrar(new Evento(agora, TipoAtor.USUARIO, ator.id(), Entidade.BLOQUEIO, id,
                "BLOQUEIO_CRIADO", null, null, null, depois, null, correlacao));
        Registro criado = new Registro(id, recursoId, periodo.inicio(), periodo.fim(), motivo.trim(), true);
        return new Criado(criado, ids);
    }

    @Transactional
    public Registro levantar(UsuarioAutenticado ator, long id, String motivo) {
        if (motivo == null || motivo.isBlank()) {
            throw new ErroDeNegocio(CodigoErro.MOTIVO_OBRIGATORIO);
        }
        Registro atual = bloqueios.buscarTravando(id)
                .orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
        if (!atual.ativo()) {
            return atual;
        }
        bloqueios.levantar(id);
        auditoria.registrar(new Evento(relogio.instant(), TipoAtor.USUARIO, ator.id(), Entidade.BLOQUEIO, id,
                "BLOQUEIO_LEVANTADO", null, null, Map.of("ativo", true), Map.of("ativo", false),
                motivo.trim(), null));
        return new Registro(atual.id(), atual.recursoId(), atual.inicio(), atual.fim(), atual.motivo(), false);
    }
}
