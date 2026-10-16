package br.senac.recursos.controller;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.service.DespachoDeNotificacoesService;
import br.senac.recursos.suporte.ApiIT;
import com.fasterxml.jackson.databind.JsonNode;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.github.tomakehurst.wiremock.verification.LoggedRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/**
 * Notificação por webhook (RF-11, RN-28, A5, C6, ADR-007) com WireMock. INT-01 a INT-06, CT-102 a CT-105.
 * Tempo limite, tolerância de reenvio e tentativas são lacunas (D3): os valores abaixo existem só no teste.
 */
@ExtendWith(OutputCaptureExtension.class)
class NotificacaoApiIT extends ApiIT {

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

    private long idS1;
    private long idR1;
    private long idR2;
    private String s1;
    private String r1;
    private String r2;
    private long salaA;
    private long projetor;

    @BeforeEach
    void cenario() throws Exception {
        PROVEDOR.resetAll();
        idS1 = criarUsuario("SOLICITANTE", "s1@exemplo.test");
        idR1 = criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        idR2 = criarUsuario("RESPONSAVEL", "r2@exemplo.test");
        s1 = login("s1@exemplo.test");
        r1 = login("r1@exemplo.test");
        r2 = login("r2@exemplo.test");
        salaA = salaSql("Sala A", false);
        projetor = materialSql("Projetor P-001", "PAT-P001", true);
        jdbc.update("update configuracao set tentativas_reenvio = 3, intervalo_reenvio_inicial = interval '1 minute'");
    }

    // ---- apoio

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

    private ResultActions acao(String token, long reserva, String acao, Object corpo) throws Exception {
        return mvc.perform(MockMvcRequestBuilders.post("/api/reservas/" + reserva + "/" + acao)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(corpo)));
    }

    private void provedorResponde(int status) {
        PROVEDOR.stubFor(post(urlEqualTo("/webhook")).willReturn(aResponse().withStatus(status)));
    }

    private String statusDe(long notificacao) {
        return jdbc.queryForObject("select status::text from notificacoes where id = ?", String.class, notificacao);
    }

    private long unicaNotificacao() {
        return jdbc.queryForObject("select id from notificacoes order by id limit 1", Long.class);
    }

    // ---- destinatários e conteúdo

    @Test
    void ct102_destinatariosPorEvento() throws Exception {
        long id = reservarComRestrito();

        assertThat(contar("select count(*) from notificacoes where reserva_id = ? "
                + "and evento = 'SOLICITACAO_PENDENTE'", id)).isEqualTo(2);
        assertThat(contar("select count(*) from notificacoes where evento = 'SOLICITACAO_PENDENTE' "
                + "and destinatario_id in (?, ?)", idR1, idR2)).isEqualTo(2);

        acao(r2, id, "aprovacao", Map.of()).andExpect(status().isOk());
        assertThat(contar("select count(*) from notificacoes where evento = 'RESERVA_APROVADA' "
                + "and destinatario_id = ?", idS1)).isEqualTo(1);

        long outra = reservarComRestrito2();
        acao(r2, outra, "rejeicao", Map.of("motivo", "Sem disponibilidade")).andExpect(status().isOk());
        assertThat(contar("select count(*) from notificacoes where evento = 'RESERVA_REJEITADA' "
                + "and destinatario_id = ?", idS1)).isEqualTo(1);

        acao(s1, id, "cancelamento", Map.of()).andExpect(status().isOk());
        assertThat(contar("select count(*) from notificacoes where evento = 'RESERVA_CANCELADA' "
                + "and destinatario_id = ?", idS1)).isEqualTo(1);
    }

    private long reservarComRestrito2() throws Exception {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("titulo", "Outra aula");
        c.put("inicio", local("2026-10-22T14:00"));
        c.put("fim", local("2026-10-22T16:00"));
        c.put("recursoIds", List.of(salaA, projetor));
        String resposta = mvc.perform(MockMvcRequestBuilders.post("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(s1))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(c)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("id").asLong();
    }

    @Test
    void int01ECt103_resposta200MarcaEnviadaECorpoTemSoOContratoMinimo() throws Exception {
        long id = reservarComRestrito();
        provedorResponde(200);

        int enviadas = despacho.despachar();

        assertThat(enviadas).isEqualTo(2);
        assertThat(contar("select count(*) from notificacoes where status = 'ENVIADA' and enviada_em is not null"))
                .isEqualTo(2);
        List<LoggedRequest> chamadas = PROVEDOR.findAll(postRequestedFor(urlEqualTo("/webhook")));
        assertThat(chamadas).hasSize(2);
        JsonNode corpo = json.readTree(chamadas.get(0).getBodyAsString());
        Set<String> campos = new TreeSet<>();
        corpo.fieldNames().forEachRemaining(campos::add);
        assertThat(campos).containsExactlyInAnyOrder("evento", "reservaId", "destinatarioId", "instante",
                "chaveIdempotencia");
        assertThat(corpo.get("evento").asText()).isEqualTo("SOLICITACAO_PENDENTE");
        assertThat(corpo.get("reservaId").asLong()).isEqualTo(id);
        assertThat(chamadas.get(0).getBodyAsString()).doesNotContain("@").doesNotContain("Usuário de teste");
        assertThat(chamadas.get(0).getHeader("Authorization")).isEqualTo("Bearer " + TOKEN_DO_PROVEDOR);
    }

    // ---- matriz de respostas do provedor

    @Test
    void int02_resposta404EhFalhaDefinitivaSemRepetirAChamada() throws Exception {
        reservarComRestrito();
        provedorResponde(404);

        despacho.despachar();
        int primeira = PROVEDOR.findAll(postRequestedFor(urlEqualTo("/webhook"))).size();
        despacho.despachar();

        assertThat(contar("select count(*) from notificacoes where status = 'FALHA' and tentativas = 1"))
                .isEqualTo(2);
        assertThat(PROVEDOR.findAll(postRequestedFor(urlEqualTo("/webhook"))).size()).isEqualTo(primeira);
    }

    @Test
    void int03_resposta500DeixaPendenteEAReservaContinuaValida() throws Exception {
        long id = reservarComRestrito();
        provedorResponde(500);

        despacho.despachar();

        assertThat(contar("select count(*) from notificacoes where status = 'PENDENTE' and tentativas = 1 "
                + "and proxima_tentativa_em is not null")).isEqualTo(2);
        assertThat(jdbc.queryForObject("select estado::text from reservas where id = ?", String.class, id))
                .isEqualTo("SOLICITADA");
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

    @Test
    void int05_corpoInvalidoDoProvedorEhDescartadoSemQuebrarOEnvio() throws Exception {
        reservarComRestrito();
        PROVEDOR.stubFor(post(urlEqualTo("/webhook")).willReturn(aResponse().withStatus(200)
                .withHeader("Content-Type", "application/json").withBody("{nao-e-json")));

        despacho.despachar();

        assertThat(contar("select count(*) from notificacoes where status = 'ENVIADA'")).isEqualTo(2);
    }

    @Test
    void int06_tokenDevolvidoNoCorpoDoErroNaoAtravessaNemApareceEmLog(CapturedOutput saida) throws Exception {
        reservarComRestrito();
        PROVEDOR.stubFor(post(urlEqualTo("/webhook")).willReturn(aResponse().withStatus(500)
                .withBody("{\"erro\":\"token invalido\",\"token\":\"" + TOKEN_DO_PROVEDOR + "\"}")));

        despacho.despachar();

        assertThat(saida.getAll()).doesNotContain(TOKEN_DO_PROVEDOR);
        assertThat(contar("select count(*) from notificacoes")).isEqualTo(2);
        String registros = jdbc.queryForObject(
                "select coalesce(string_agg(n::text, ' '), '') from notificacoes n", String.class);
        assertThat(registros).doesNotContain(TOKEN_DO_PROVEDOR);
    }

    // ---- depois do commit e reenvio

    @Test
    void ct104_seATransacaoFalhaNaoHaNotificacaoNemChamada() throws Exception {
        long id = reservarComRestrito();
        long antes = contar("select count(*) from notificacoes");
        jdbc.execute("create function falha_de_teste() returns trigger language plpgsql as "
                + "$$ begin raise exception 'falha injetada'; end; $$");
        jdbc.execute("create trigger auditoria_falha_de_teste before insert on auditoria_eventos "
                + "for each row when (new.acao = 'RESERVA_APROVADA') execute function falha_de_teste()");
        try {
            acao(r2, id, "aprovacao", Map.of()).andExpect(status().isInternalServerError());
        } finally {
            jdbc.execute("drop trigger auditoria_falha_de_teste on auditoria_eventos");
            jdbc.execute("drop function falha_de_teste()");
        }

        assertThat(contar("select count(*) from notificacoes")).isEqualTo(antes);
        assertThat(PROVEDOR.findAll(postRequestedFor(urlEqualTo("/webhook")))).isEmpty();
    }

    @Test
    void ct105_reenvioUsaAMesmaChaveDeIdempotencia() throws Exception {
        reservarComRestrito();
        provedorResponde(500);
        despacho.despachar();
        long notificacao = unicaNotificacao();
        String chave = jdbc.queryForObject("select chave_idempotencia from notificacoes where id = ?",
                String.class, notificacao);

        agora("2026-10-20T17:01:00Z");                 // passou o intervalo de reenvio de teste (1 minuto)
        provedorResponde(200);
        despacho.despachar();

        assertThat(statusDe(notificacao)).isEqualTo("ENVIADA");
        assertThat(contar("select count(*) from notificacoes where id = ? and tentativas = 2", notificacao))
                .isEqualTo(1);
        long comAChave = PROVEDOR.findAll(postRequestedFor(urlEqualTo("/webhook"))).stream()
                .filter(r -> r.getBodyAsString().contains(chave)).count();
        assertThat(comAChave).as("a mesma chave nas duas tentativas").isEqualTo(2);
        assertThat(PROVEDOR.findAll(postRequestedFor(urlEqualTo("/webhook"))).stream()
                .filter(r -> r.getBodyAsString().contains(chave))
                .allMatch(r -> chave.equals(r.getHeader("Idempotency-Key")))).isTrue();
    }

    @Test
    void naoReenviaAntesDoIntervaloNemDepoisDeEnviada() throws Exception {
        reservarComRestrito();
        provedorResponde(500);
        despacho.despachar();
        int depoisDaPrimeira = PROVEDOR.findAll(postRequestedFor(urlEqualTo("/webhook"))).size();

        despacho.despachar();   // o relógio de teste não andou: ainda não é hora

        assertThat(PROVEDOR.findAll(postRequestedFor(urlEqualTo("/webhook"))).size()).isEqualTo(depoisDaPrimeira);
    }
}
