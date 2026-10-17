package br.senac.recursos.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

/** Cabeçalhos de segurança das respostas da API (P5-06, OWASP A05). */
class CabecalhosDeSegurancaApiIT extends ApiIT {

    @Test
    void respostaAutenticadaTrazCabecalhosDeSegurancaEnaoPermiteCache() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        String token = login("s1@exemplo.test");

        mvc.perform(get("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, org.hamcrest.Matchers.containsString("no-store")));
    }

    @Test
    void respostaDeErroSemSessaoTambemTrazOsCabecalhosEACorrelacao() throws Exception {
        mvc.perform(get("/api/reservas"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().exists("X-Correlation-Id"));
    }
}
