package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Logs sem segredo e com correlação (RNF-12, P5-07). Provoca uma violação real de constraint com um e-mail
 * fictício e confere que o valor do banco não chega ao log, que a classe da exceção chega e que o identificador
 * de correlação devolvido ao cliente aparece na linha do log.
 */
@ExtendWith(OutputCaptureExtension.class)
class LogSeguroApiIT extends ApiIT {

    private static final String EMAIL_SENTINELA = "log.sentinela@exemplo.test";

    @Test
    void violacaoDeConstraintNaoVazaOEmailParaOLogEFicaCorrelacionada(CapturedOutput saida) throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        String token = login("s1@exemplo.test");

        MvcResult resposta = mvc.perform(get("/api/_teste/violacao").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isInternalServerError())
                .andReturn();

        String correlacao = resposta.getResponse().getHeader("X-Correlation-Id");
        assertThat(correlacao).as("cabeçalho de correlação").isNotBlank();
        assertThat(saida.getAll())
                .as("o valor da coluna não pode aparecer no log")
                .doesNotContain(EMAIL_SENTINELA)
                .as("a classe da exceção e a correlação aparecem")
                .contains("DuplicateKeyException")
                .contains(correlacao);
    }

    @Test
    void tokenDoCabecalhoAuthorizationNaoApareceNoLog(CapturedOutput saida) throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        String token = login("s1@exemplo.test");

        mvc.perform(get("/api/_teste/explosao").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isInternalServerError());
        mvc.perform(get("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer("token-invalido-de-teste")))
                .andExpect(status().isUnauthorized());

        assertThat(saida.getAll()).doesNotContain(token).doesNotContain("token-invalido-de-teste");
    }
}
