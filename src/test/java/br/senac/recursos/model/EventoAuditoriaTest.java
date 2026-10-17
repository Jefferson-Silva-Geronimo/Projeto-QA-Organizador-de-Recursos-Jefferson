package br.senac.recursos.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

/**
 * Fábricas do evento de auditoria (RN-08): o ator é USUARIO com identificador ou SISTEMA sem identificador,
 * e só a transição carrega estado anterior e novo.
 */
class EventoAuditoriaTest {

    private static final Instant QUANDO = Instant.parse("2026-10-20T13:00:00Z");
    private static final Map<String, Object> ANTES = Map.of("titulo", "antes");
    private static final Map<String, Object> DEPOIS = Map.of("titulo", "depois");

    @Test
    void eventoDeUsuarioTemAtorUsuarioComIdentificadorESemEstados() {
        EventoAuditoria e = EventoAuditoria.deUsuario(QUANDO, 7L, EntidadeAuditada.RECURSO, 3L, "RECURSO_CRIADO",
                ANTES, DEPOIS);

        assertThat(e.ocorridoEm()).isEqualTo(QUANDO);
        assertThat(e.ator()).isEqualTo(TipoAtor.USUARIO);
        assertThat(e.atorId()).isEqualTo(7L);
        assertThat(e.entidade()).isEqualTo(EntidadeAuditada.RECURSO);
        assertThat(e.entidadeId()).isEqualTo(3L);
        assertThat(e.acao()).isEqualTo("RECURSO_CRIADO");
        assertThat(e.estadoAnterior()).isNull();
        assertThat(e.estadoNovo()).isNull();
        assertThat(e.antes()).isEqualTo(ANTES);
        assertThat(e.depois()).isEqualTo(DEPOIS);
    }

    @Test
    void eventoDeSistemaTemAtorSistemaSemIdentificador() {
        EventoAuditoria e = EventoAuditoria.deSistema(QUANDO, EntidadeAuditada.RECURSO, 3L, "RECURSO_AJUSTADO",
                ANTES, DEPOIS);

        assertThat(e.ator()).isEqualTo(TipoAtor.SISTEMA);
        assertThat(e.atorId()).isNull();
        assertThat(e.entidade()).isEqualTo(EntidadeAuditada.RECURSO);
        assertThat(e.entidadeId()).isEqualTo(3L);
        assertThat(e.acao()).isEqualTo("RECURSO_AJUSTADO");
        assertThat(e.antes()).isEqualTo(ANTES);
        assertThat(e.depois()).isEqualTo(DEPOIS);
    }

    @Test
    void transicaoDeUsuarioGuardaEstadosMotivoEOAtor() {
        EventoAuditoria e = EventoAuditoria.transicaoDeUsuario(QUANDO, 9L, 42L, "RESERVA_APROVADA",
                "SOLICITADA", "APROVADA", ANTES, DEPOIS, "sem conflito");

        assertThat(e.ator()).isEqualTo(TipoAtor.USUARIO);
        assertThat(e.atorId()).isEqualTo(9L);
        assertThat(e.entidade()).isEqualTo(EntidadeAuditada.RESERVA);
        assertThat(e.entidadeId()).isEqualTo(42L);
        assertThat(e.acao()).isEqualTo("RESERVA_APROVADA");
        assertThat(e.estadoAnterior()).isEqualTo("SOLICITADA");
        assertThat(e.estadoNovo()).isEqualTo("APROVADA");
        assertThat(e.motivo()).isEqualTo("sem conflito");
    }

    @Test
    void transicaoDoSistemaGuardaEstadosEMotivoSemAtorIdentificado() {
        EventoAuditoria e = EventoAuditoria.transicaoDoSistema(QUANDO, 42L, "RESERVA_SEM_DECISAO",
                "SOLICITADA", "CANCELADA", "SEM_DECISAO");

        assertThat(e.ator()).isEqualTo(TipoAtor.SISTEMA);
        assertThat(e.atorId()).isNull();
        assertThat(e.entidade()).isEqualTo(EntidadeAuditada.RESERVA);
        assertThat(e.entidadeId()).isEqualTo(42L);
        assertThat(e.acao()).isEqualTo("RESERVA_SEM_DECISAO");
        assertThat(e.estadoAnterior()).isEqualTo("SOLICITADA");
        assertThat(e.estadoNovo()).isEqualTo("CANCELADA");
        assertThat(e.motivo()).isEqualTo("SEM_DECISAO");
    }
}
