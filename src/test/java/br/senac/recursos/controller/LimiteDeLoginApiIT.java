package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Limite de tentativas de login (SEC-01, P5-10, OWASP A07). Os valores de teste (5 tentativas em 10 minutos) vêm de
 * {@code BancoRealIT} e existem só no teste: a lacuna D18 não tem valor definido.
 */
class LimiteDeLoginApiIT extends ApiIT {

    private static final int LIMITE_DE_TESTE = 5;
    private static final String EMAIL = "s1@exemplo.test";

    private ResultActions tentar(String email, String senha) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"senha\":\"" + senha + "\"}"));
    }

    @Test
    void aposOLimiteDeFalhasAContaFicaBloqueadaMesmoComASenhaCorreta() throws Exception {
        criarUsuario("SOLICITANTE", EMAIL);
        for (int i = 0; i < LIMITE_DE_TESTE; i++) {
            tentar(EMAIL, "senha-errada-de-teste").andExpect(status().isUnauthorized());
        }

        tentar(EMAIL, SENHA_DE_TESTE)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("CREDENCIAIS_INVALIDAS"));

        assertThat(contar("select count(*) from sessoes")).as("nenhuma sessão foi aberta").isZero();
    }
}
