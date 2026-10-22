package br.senac.recursos.controller;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.service.DespachoDeNotificacoesService;
import br.senac.recursos.suporte.ApiIT;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/**
 * Tempo limite do envio de notificação (RF-11, ADR-007, INT-04), com WireMock. Esta classe roda com o limite de
 * leitura de produção (1,5 s, sem sobrescrever a propriedade), porque o assunto aqui é o próprio limite.
 * O {@link NotificacaoApiIT} roda com um limite folgado, pois testa o contrato do corpo e não o tempo (BUG-017, R-25).
 * O teste foi movido de lá sem alterar o corpo nem as asserções.
 */
class NotificacaoTempoLimiteApiIT extends ApiIT {

    private static final String TOKEN_DO_PROVEDOR = "token-secreto-do-provedor-de-teste";

    static final WireMockServer PROVEDOR = new WireMockServer(WireMockConfiguration.options().dynamicPort());

    static {
        PROVEDOR.start();
    }

    @DynamicPropertySource
    static void provedor(DynamicPropertyRegistry registro) {
        registro.add("app.notificacao.url", () -> "http://localhost:" + PROVEDOR.port() + "/webhook");
        registro.add("app.notificacao.token", () -> TOKEN_DO_PROVEDOR);
    }

    @AfterAll
    static void para() {
        PROVEDOR.stop();
    }

    @Autowired
    private DespachoDeNotificacoesService despacho;

    private String s1;
    private long salaA;
    private long projetor;

    @BeforeEach
    void cenario() throws Exception {
        PROVEDOR.resetAll();
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r2@exemplo.test");
        s1 = login("s1@exemplo.test");
        salaA = salaSql("Sala A", false);
        projetor = materialSql("Projetor P-001", "PAT-P001", true);
        jdbc.update("update configuracao set tentativas_reenvio = 3, intervalo_reenvio_inicial = interval '1 minute'");
    }

    private long reservarComRestrito() throws Exception {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("titulo", "Aula de teste");
        c.put("inicio", local("2026-10-21T14:00"));
        c.put("fim", local("2026-10-21T16:00"));
        c.put("recursoIds", List.of(salaA, projetor));
        String resposta = mvc.perform(MockMvcRequestBuilders.post("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(s1))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(c)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("id").asLong();
    }

    @Test
    void int04_respostaMaisLentaQueOLimiteInterrompeEMarcaPendente() throws Exception {
        reservarComRestrito();
        PROVEDOR.stubFor(post(urlEqualTo("/webhook")).willReturn(aResponse().withStatus(200).withFixedDelay(4000)));

        long inicio = System.nanoTime();
        despacho.despachar();
        long duracaoMs = (System.nanoTime() - inicio) / 1_000_000;

        assertThat(contar("select count(*) from notificacoes where status = 'PENDENTE' and tentativas = 1"))
                .isEqualTo(2);
        assertThat(duracaoMs).as("cada envio é interrompido no limite, sem esperar o provedor").isLessThan(4500);
    }
}
