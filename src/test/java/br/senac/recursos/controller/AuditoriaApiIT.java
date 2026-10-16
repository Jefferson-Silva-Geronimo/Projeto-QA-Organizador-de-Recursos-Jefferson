package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/** Histórico auditável (RF-10, RN-08, RN-26, RN-27, RN-29, ADR-006). CT-096 a CT-101. */
class AuditoriaApiIT extends ApiIT {

    private long idS1;
    private String s1;
    private String r1;
    private String r2;
    private String adm;
    private long salaA;
    private long projetor;

    @BeforeEach
    void cenario() throws Exception {
        idS1 = criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r2@exemplo.test");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        s1 = login("s1@exemplo.test");
        r1 = login("r1@exemplo.test");
        r2 = login("r2@exemplo.test");
        adm = login("a1@exemplo.test");
        salaA = salaSql("Sala A", false);
        projetor = materialSql("Projetor P-001", "PAT-P001", true);
    }

    private long reservar(String token, long... recursos) throws Exception {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("titulo", "Aula de teste");
        c.put("inicio", local("2026-10-21T14:00"));
        c.put("fim", local("2026-10-21T16:00"));
        c.put("recursoIds", java.util.Arrays.stream(recursos).boxed().toList());
        String resposta = mvc.perform(post("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(c)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("id").asLong();
    }

    private ResultActions acao(String token, long reserva, String acao, Object corpo) throws Exception {
        return mvc.perform(post("/api/reservas/" + reserva + "/" + acao)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(corpo)));
    }

    @Test
    void ct096_cadaTransicaoGeraExatamenteUmEventoComAnteriorNovoAtorEInstante() throws Exception {
        long id = reservar(s1, salaA, projetor);                         // SOLICITADA
        acao(r2, id, "aprovacao", Map.of()).andExpect(status().isOk());   // APROVADA
        acao(r1, id, "inicio", Map.of()).andExpect(status().isOk());      // EM_USO
        acao(r1, id, "conclusao", Map.of()).andExpect(status().isOk());   // CONCLUIDA

        assertThat(contar("select count(*) from auditoria_eventos where entidade = 'RESERVA' and entidade_id = ?", id))
                .isEqualTo(4);
        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? and entidade = 'RESERVA' "
                + "and ocorrido_em is not null and ator_tipo is not null and estado_novo is not null", id))
                .isEqualTo(4);
        assertThat(contar("select count(distinct estado_novo) from auditoria_eventos where entidade_id = ? "
                + "and entidade = 'RESERVA'", id)).isEqualTo(4);
        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? and entidade = 'RESERVA' "
                + "and acao = 'RESERVA_CONCLUIDA' and estado_anterior = 'EM_USO' and estado_novo = 'CONCLUIDA'", id))
                .isEqualTo(1);
    }

    @Test
    void ct097_falhaAoAuditarDesfazATransicao() throws Exception {
        long id = reservar(s1, salaA);   // APROVADA
        jdbc.execute("create function falha_de_auditoria_de_teste() returns trigger language plpgsql as "
                + "$$ begin raise exception 'falha injetada na auditoria'; end; $$");
        jdbc.execute("create trigger auditoria_falha_de_teste before insert on auditoria_eventos "
                + "for each row when (new.acao = 'RESERVA_INICIADA') execute function falha_de_auditoria_de_teste()");
        try {
            acao(r1, id, "inicio", Map.of()).andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.code").value("ERRO_INTERNO"));
        } finally {
            jdbc.execute("drop trigger auditoria_falha_de_teste on auditoria_eventos");
            jdbc.execute("drop function falha_de_auditoria_de_teste()");
        }

        assertThat(jdbc.queryForObject("select estado::text from reservas where id = ?", String.class, id))
                .as("a transição foi desfeita junto com a auditoria").isEqualTo("APROVADA");
        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? "
                + "and acao = 'RESERVA_INICIADA'", id)).isZero();
    }

    @Test
    void ct098_transicoesAutomaticasTemAtorSistema() throws Exception {
        long id = reservar(s1, salaA);

        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? and acao = 'RESERVA_APROVADA' "
                + "and ator_tipo = 'SISTEMA' and ator_id is null", id)).isEqualTo(1);
    }

    @Test
    void ct099_administradorConsultaAuditoriaDeCadastrosEOutrosNaoConsultam() throws Exception {
        long id = reservar(s1, salaA);
        acao(adm, id, "cancelamento", Map.of("motivo", "Evento institucional")).andExpect(status().isOk());

        mvc.perform(get("/api/auditoria").header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(3)));
        mvc.perform(get("/api/auditoria").param("entidade", "RESERVA").param("entidadeId", String.valueOf(id))
                        .header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[2].acao").value("RESERVA_CANCELADA"))
                .andExpect(jsonPath("$[2].motivo").value("Evento institucional"));
    }

    @Test
    void ct100_responsavelVeOHistoricoDaReservaMasNaoAAuditoriaCompleta() throws Exception {
        long id = reservar(s1, salaA);

        mvc.perform(get("/api/reservas/" + id + "/historico").header(HttpHeaders.AUTHORIZATION, bearer(r1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/auditoria").header(HttpHeaders.AUTHORIZATION, bearer(r1)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
        mvc.perform(get("/api/auditoria").header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void ct100_solicitanteVeSoOHistoricoDaPropriaReserva() throws Exception {
        long doS1 = reservar(s1, salaA);
        criarUsuario("SOLICITANTE", "s2@exemplo.test");
        String s2 = login("s2@exemplo.test");

        mvc.perform(get("/api/reservas/" + doS1 + "/historico").header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/reservas/" + doS1 + "/historico").header(HttpHeaders.AUTHORIZATION, bearer(s2)))
                .andExpect(status().isForbidden());
    }

    @Test
    void ct101_historicoDeReservaRejeitadaCanceladaEConcluidaContinuaConsultavel() throws Exception {
        long rejeitada = reservar(s1, salaA, projetor);
        acao(r2, rejeitada, "rejeicao", Map.of("motivo", "Sem disponibilidade")).andExpect(status().isOk());
        long cancelada = reservar(s1, salaB());
        acao(s1, cancelada, "cancelamento", Map.of()).andExpect(status().isOk());
        long concluida = reservar(s1, salaC());
        acao(r1, concluida, "inicio", Map.of()).andExpect(status().isOk());
        acao(r1, concluida, "conclusao", Map.of()).andExpect(status().isOk());

        for (long id : new long[] {rejeitada, cancelada, concluida}) {
            mvc.perform(get("/api/reservas/" + id + "/historico").header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(2)));
        }
        assertThat(contar("select count(*) from reservas")).isEqualTo(3);
        assertThat(idS1).isPositive();
    }

    private long salaB() {
        return salaSql("Sala B", false);
    }

    private long salaC() {
        return salaSql("Sala C", false);
    }
}
