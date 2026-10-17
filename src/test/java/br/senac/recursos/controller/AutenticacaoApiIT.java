package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/** Autenticação e erros padronizados (RF-01, RF-13, ADR-004, ADR-008). CT-001 a CT-006. */
class AutenticacaoApiIT extends ApiIT {

    @Test
    void ct001_loginValidoAbreSessaoComUmPerfil() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");

        String corpo = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"s1@exemplo.test\",\"senha\":\"" + SENHA_DE_TESTE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.perfil").value("SOLICITANTE"))
                .andReturn().getResponse().getContentAsString();

        String token = json.readTree(corpo).get("token").asText();
        assertThat(contar("select count(*) from sessoes")).isEqualTo(1);
        assertThat(contar("select count(*) from sessoes where token_hash = ?", token))
                .as("o token em texto nunca é gravado")
                .isZero();
    }

    @Test
    void ct002_loginInvalidoNaoCriaSessao() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"s1@exemplo.test\",\"senha\":\"errada-errada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("CREDENCIAIS_INVALIDAS"))
                .andExpect(content().string(not(containsString("Exception"))));

        assertThat(contar("select count(*) from sessoes")).isZero();
    }

    @Test
    void ct002_loginDeUsuarioInexistenteTemAMesmaResposta() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ninguem@exemplo.test\",\"senha\":\"qualquer-coisa\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("CREDENCIAIS_INVALIDAS"));
    }

    @Test
    void ct003_requisicaoSemTokenRetorna401() throws Exception {
        mvc.perform(get("/api/reservas"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("NAO_AUTENTICADO"));
    }

    @ParameterizedTest(name = "agora={0} aceita={1}")
    @CsvSource({
            "2026-10-20T17:59:59.999Z, true",
            "2026-10-20T18:00:00Z, false",
            "2026-10-20T18:00:00.001Z, false"
    })
    void ct004_expiracaoDaSessaoEmTrinca(String agora, boolean aceita) throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        String token = login("s1@exemplo.test");   // sessão de PT1H (valor de teste), expira às 18:00:00Z

        agora(agora);

        mvc.perform(get("/api/auth/eu").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().is(aceita ? 200 : 401));
    }

    @Test
    void ct005_sairRevogaASessao() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        String token = login("s1@exemplo.test");

        mvc.perform(post("/api/auth/logout").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/auth/eu").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isUnauthorized());
        assertThat(contar("select count(*) from sessoes where revogada_em is not null")).isEqualTo(1);
    }

    @Test
    void ct006_recusaPorRegraTemCodigoEstavelSemDetalheInterno() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDACAO_FALHOU"))
                .andExpect(jsonPath("$.detail").isNotEmpty());
    }

    @Test
    void ct006_falhaInternaNaoVazaDetalhe() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        String token = login("a1@exemplo.test");

        mvc.perform(get("/api/_teste/explosao").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("ERRO_INTERNO"))
                .andExpect(content().string(not(containsString("senha_hash"))))
                .andExpect(content().string(not(containsString("IllegalStateException"))))
                .andExpect(content().string(not(containsString("usuarios"))))
                .andExpect(content().string(not(containsString("stackTrace"))));
    }
}
