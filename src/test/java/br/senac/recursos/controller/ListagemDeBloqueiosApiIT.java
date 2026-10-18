package br.senac.recursos.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

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
}
