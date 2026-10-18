package br.senac.recursos.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/**
 * Listagem dos bloqueios de manutenção (RF-08, RN-22, F6-06a). CT-123 e CT-124.
 */
class ListagemDeBloqueiosApiIT extends ApiIT {

    private String adm;

    @BeforeEach
    void cenario() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        adm = login("a1@exemplo.test");
    }

    @Test
    void ct123_semBloqueiosAListagemVemVazia() throws Exception {
        mvc.perform(get("/api/bloqueios").header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void ct124_listaAtivosELevantadosComOsCamposDoContratoEmOrdemDeInicio() throws Exception {
        long sala = salaSql("Sala A", false);
        long depois = bloquear(sala, "2026-10-26T08:00", "2026-10-26T10:00", "Pintura");
        long antes = bloquear(sala, "2026-10-21T08:00", "2026-10-21T10:00", "Troca de lâmpadas");
        mvc.perform(post("/api/bloqueios/" + antes + "/levantamento").header(HttpHeaders.AUTHORIZATION, bearer(adm))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Concluído antes\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/bloqueios").header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(antes))
                .andExpect(jsonPath("$[0].recursoId").value(sala))
                .andExpect(jsonPath("$[0].motivo").value("Troca de lâmpadas"))
                .andExpect(jsonPath("$[0].ativo").value(false))
                .andExpect(jsonPath("$[0].inicio").value(local("2026-10-21T08:00")))
                .andExpect(jsonPath("$[0].fim").value(local("2026-10-21T10:00")))
                .andExpect(jsonPath("$[1].id").value(depois))
                .andExpect(jsonPath("$[1].ativo").value(true));
    }

    private long bloquear(long recurso, String inicio, String fim, String motivo) throws Exception {
        String corpo = json.writeValueAsString(java.util.Map.of("recursoId", recurso, "inicio", local(inicio),
                "fim", local(fim), "motivo", motivo));
        String resposta = mvc.perform(post("/api/bloqueios").header(HttpHeaders.AUTHORIZATION, bearer(adm))
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("id").asLong();
    }
}
