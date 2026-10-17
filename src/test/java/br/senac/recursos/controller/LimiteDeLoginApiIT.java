package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Limite de tentativas de login (SEC-01, P5-10, OWASP A07). Os valores (5 tentativas em 10 minutos, decisão D18 da
 * equipe) vêm de {@code BancoRealIT}.
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

    private void falhar(String email, int vezes) throws Exception {
        for (int i = 0; i < vezes; i++) {
            tentar(email, "senha-errada-de-teste").andExpect(status().isUnauthorized());
        }
    }

    /** Janela de 10 minutos (valor de teste). A mais antiga das N falhas está na hora 0; o relógio avança dela. */
    @ParameterizedTest(name = "{0} ms depois da primeira falha -> login com senha correta {1}")
    @CsvSource({"599999,401", "600000,200", "600001,200"})
    void bloqueioTerminaQuandoAMaisAntigaDasFalhasSaiDaJanela(long msDepois, int statusEsperado) throws Exception {
        criarUsuario("SOLICITANTE", EMAIL);
        java.time.Instant inicio = relogio.instant();
        falhar(EMAIL, LIMITE_DE_TESTE);
        agora(inicio.plusMillis(msDepois).toString());

        tentar(EMAIL, SENHA_DE_TESTE).andExpect(status().is(statusEsperado));
    }

    @Test
    void umaFalhaAMenosQueOLimiteNaoBloqueia() throws Exception {
        criarUsuario("SOLICITANTE", EMAIL);
        falhar(EMAIL, LIMITE_DE_TESTE - 1);

        tentar(EMAIL, SENHA_DE_TESTE).andExpect(status().isOk());
    }

    @Test
    void loginComSucessoZeraAsFalhasDaConta() throws Exception {
        criarUsuario("SOLICITANTE", EMAIL);
        falhar(EMAIL, LIMITE_DE_TESTE - 1);
        tentar(EMAIL, SENHA_DE_TESTE).andExpect(status().isOk());
        falhar(EMAIL, LIMITE_DE_TESTE - 1);

        tentar(EMAIL, SENHA_DE_TESTE).andExpect(status().isOk());
        assertThat(contar("select count(*) from tentativas_login where email = ?", EMAIL)).isZero();
    }

    @Test
    void respostaDeContaBloqueadaInexistenteESenhaErradaSaoIdenticas() throws Exception {
        criarUsuario("SOLICITANTE", EMAIL);
        criarUsuario("SOLICITANTE", "s2@exemplo.test");
        falhar(EMAIL, LIMITE_DE_TESTE);

        String bloqueada = tentar(EMAIL, SENHA_DE_TESTE).andReturn().getResponse().getContentAsString();
        String senhaErrada = tentar("s2@exemplo.test", "senha-errada-de-teste").andReturn().getResponse()
                .getContentAsString();
        String inexistente = tentar("nao.existe@exemplo.test", "senha-errada-de-teste").andReturn().getResponse()
                .getContentAsString();

        assertThat(json.readTree(bloqueada)).isEqualTo(json.readTree(senhaErrada)).isEqualTo(json.readTree(inexistente));
    }

    @Test
    void tentativaDuranteOBloqueioNaoEhRegistradaENaoEstendeOBloqueio() throws Exception {
        criarUsuario("SOLICITANTE", EMAIL);
        falhar(EMAIL, LIMITE_DE_TESTE);
        falhar(EMAIL, 3);

        assertThat(contar("select count(*) from tentativas_login where email = ?", EMAIL)).isEqualTo(LIMITE_DE_TESTE);
    }

    @Test
    void contaInexistenteTambemAcumulaFalhasSemRevelarNada() throws Exception {
        falhar("nao.existe@exemplo.test", LIMITE_DE_TESTE);

        assertThat(contar("select count(*) from tentativas_login where email = ?", "nao.existe@exemplo.test"))
                .isEqualTo(LIMITE_DE_TESTE);
    }

    @Test
    void emailComMaiusculasEEspacosCaiNaMesmaConta() throws Exception {
        criarUsuario("SOLICITANTE", EMAIL);
        falhar("  S1@Exemplo.TEST ", LIMITE_DE_TESTE);

        tentar(EMAIL, SENHA_DE_TESTE).andExpect(status().isUnauthorized());
    }

    @Test
    void falhaAntigaForaDaJanelaEApagadaNaProximaFalha() throws Exception {
        criarUsuario("SOLICITANTE", EMAIL);
        falhar(EMAIL, 2);
        agora(relogio.instant().plusSeconds(601).toString());
        falhar(EMAIL, 1);

        assertThat(contar("select count(*) from tentativas_login where email = ?", EMAIL)).isEqualTo(1);
    }
}
