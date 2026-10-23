package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/**
 * Motivo obrigatório do bloqueio no contrato das requisições (RF-08, RF-14, R-15, F6-19). CT-166 e CT-167.
 *
 * <p>O servidor sempre exigiu o motivo ao criar e ao levantar um bloqueio ({@code MOTIVO_OBRIGATORIO}, RN-22 e D15),
 * mas o OpenAPI o declarava opcional, e o cliente gerado aceitava um corpo que o servidor recusa. O contrato precisa
 * dizer o que o servidor faz. Só documentação: o comportamento HTTP não muda, e o código de erro continua sendo
 * {@code MOTIVO_OBRIGATORIO}, não {@code VALIDACAO_FALHOU}.
 */
class ContratoDeRequisicoesApiIT extends ApiIT {

    private String adm;

    @BeforeEach
    void administrador() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        adm = login("a1@exemplo.test");
    }

    private Set<String> obrigatoriosNoContrato(String esquema) throws Exception {
        JsonNode contrato = json.readTree(mvc.perform(get("/v3/api-docs").header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        Set<String> campos = new TreeSet<>();
        contrato.path("components").path("schemas").path(esquema).path("required").forEach(n -> campos.add(n.asText()));
        return campos;
    }

    private Map<String, Object> novoBloqueio(long recurso, String motivo) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("recursoId", recurso);
        corpo.put("inicio", local("2026-10-26T08:00"));
        corpo.put("fim", local("2026-10-26T10:00"));
        if (motivo != null) {
            corpo.put("motivo", motivo);
        }
        return corpo;
    }

    // ---- CT-166

    @Test
    void ct166_motivoDoBloqueioEhObrigatorioNoContrato() throws Exception {
        assertThat(obrigatoriosNoContrato("NovoBloqueioRequisicao"))
                .as("required de NovoBloqueioRequisicao no contrato")
                .containsExactlyInAnyOrder("recursoId", "inicio", "fim", "motivo");
        assertThat(obrigatoriosNoContrato("LevantamentoRequisicao"))
                .as("required de LevantamentoRequisicao no contrato")
                .containsExactly("motivo");
    }

    // ---- CT-167: o servidor faz o que o contrato diz

    @Test
    void ct167_servidorRecusaSemMotivoComOCodigoEstavel() throws Exception {
        long sala = salaSql("Sala A", false);

        mvc.perform(post("/api/bloqueios").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(novoBloqueio(sala, null)))
                        .header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MOTIVO_OBRIGATORIO"));
        assertThat(contar("select count(*) from bloqueios_manutencao")).as("nada foi gravado sem motivo").isZero();

        String criado = mvc.perform(post("/api/bloqueios").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(novoBloqueio(sala, "Pintura")))
                        .header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(criado).get("id").asLong();

        mvc.perform(post("/api/bloqueios/" + id + "/levantamento").contentType(MediaType.APPLICATION_JSON)
                        .content("{}").header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MOTIVO_OBRIGATORIO"));
        mvc.perform(post("/api/bloqueios/" + id + "/levantamento")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MOTIVO_OBRIGATORIO"));
        assertThat(contar("select count(*) from bloqueios_manutencao where id = ? and ativo", id))
                .as("o bloqueio continua ativo sem motivo").isEqualTo(1);
    }
}
