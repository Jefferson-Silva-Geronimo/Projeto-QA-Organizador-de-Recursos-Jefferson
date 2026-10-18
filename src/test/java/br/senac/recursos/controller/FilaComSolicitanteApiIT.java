package br.senac.recursos.controller;



import static org.assertj.core.api.Assertions.assertThat;

import static org.hamcrest.Matchers.hasSize;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;



import br.senac.recursos.suporte.ApiIT;

import java.util.LinkedHashMap;

import java.util.List;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;

import org.junit.jupiter.api.Test;

import org.springframework.http.HttpHeaders;

import org.springframework.http.MediaType;



/**

 * Fila de aprovações com o nome de quem pediu (RF-07, RN-26, B3, F6-06b). CT-125 e CT-126.

 */

class FilaComSolicitanteApiIT extends ApiIT {



    private static final String EMAIL_DO_SOLICITANTE = "maria.souza@exemplo.test";



    private String solicitante;

    private String responsavel;

    private String administrador;

    private long solicitanteId;

    private long salaA;

    private long projetor;



    @BeforeEach

    void cenario() throws Exception {

        solicitanteId = criarUsuario("SOLICITANTE", EMAIL_DO_SOLICITANTE, "Maria Souza");

        criarUsuario("RESPONSAVEL", "r1@exemplo.test");

        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");

        solicitante = login(EMAIL_DO_SOLICITANTE);

        responsavel = login("r1@exemplo.test");

        administrador = login("a1@exemplo.test");

        salaA = salaSql("Sala A", false);

        projetor = materialSql("Projetor P-001", "PAT-P001", true);

    }



    private long reservarComRestrito() throws Exception {

        Map<String, Object> corpo = new LinkedHashMap<>();

        corpo.put("titulo", "Aula de teste");

        corpo.put("inicio", local("2026-10-21T14:00"));

        corpo.put("fim", local("2026-10-21T16:00"));

        corpo.put("recursoIds", List.of(salaA, projetor));

        String resposta = mvc.perform(post("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(solicitante))

                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo)))

                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();

        return json.readTree(resposta).get("id").asLong();

    }



    @Test

    void ct125_filaTrazONomeDoSolicitanteENuncaOEmail() throws Exception {

        long reserva = reservarComRestrito();



        String corpo = mvc.perform(get("/api/reservas/fila").header(HttpHeaders.AUTHORIZATION, bearer(responsavel)))

                .andExpect(status().isOk())

                .andExpect(jsonPath("$", hasSize(1)))

                .andExpect(jsonPath("$[0].id").value(reserva))

                .andExpect(jsonPath("$[0].solicitanteId").value(solicitanteId))

                .andExpect(jsonPath("$[0].solicitanteNome").value("Maria Souza"))

                .andReturn().getResponse().getContentAsString();



        assertThat(corpo).as("a fila não expõe o e-mail do solicitante").doesNotContain(EMAIL_DO_SOLICITANTE)

                .doesNotContain("email");

    }


    @Test
    void ct126_filaRecusaSolicitanteEAdministrador() throws Exception {
        reservarComRestrito();

        mvc.perform(get("/api/reservas/fila").header(HttpHeaders.AUTHORIZATION, bearer(solicitante)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
        mvc.perform(get("/api/reservas/fila").header(HttpHeaders.AUTHORIZATION, bearer(administrador)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
    }

    @Test
    void ct126_filaSemSessaoRetorna401() throws Exception {
        mvc.perform(get("/api/reservas/fila"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("NAO_AUTENTICADO"));
    }
}
