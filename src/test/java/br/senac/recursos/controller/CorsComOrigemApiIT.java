package br.senac.recursos.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

import br.senac.recursos.suporte.ApiIT;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;

/**
 * CORS com a variável de origens (P5-06): só a origem configurada é aceita, com o valor exato (nunca "*"; o curinga é
 * recusado em CorsPropertiesTest). A origem é fictícia de propósito: o código não tem origem padrão.
 */
@TestPropertySource(properties = "app.cors.origens=https://app.exemplo.test")
class CorsComOrigemApiIT extends ApiIT {

    private static final String PERMITIDA = "https://app.exemplo.test";
    private static final String OUTRA = "https://intruso.exemplo.test";

    @Test
    void preflightDaOrigemConfiguradaRecebeExatamenteEssaOrigem() throws Exception {
        mvc.perform(options("/api/reservas").header(HttpHeaders.ORIGIN, PERMITIDA)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization,content-type"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, PERMITIDA));
    }

    @Test
    void preflightDeOutraOrigemNaoRecebeAllowOrigin() throws Exception {
        mvc.perform(options("/api/reservas").header(HttpHeaders.ORIGIN, OUTRA)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
