package br.senac.recursos.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

import br.senac.recursos.suporte.ApiIT;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

/** CORS sem a variável de origens (P5-06): nenhuma origem é permitida, nem em preflight nem em requisição real. */
class CorsSemOrigemApiIT extends ApiIT {

    private static final String ORIGEM = "https://app.exemplo.test";

    @Test
    void preflightSemOrigemConfiguradaNaoRecebeAllowOrigin() throws Exception {
        mvc.perform(options("/api/reservas").header(HttpHeaders.ORIGIN, ORIGEM)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void requisicaoComOrigemSemConfiguracaoNaoRecebeAllowOrigin() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        String token = login("s1@exemplo.test");

        mvc.perform(get("/api/reservas").header(HttpHeaders.ORIGIN, ORIGEM)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
