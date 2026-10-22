package br.senac.recursos.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Cada item da fila diz o que o Responsável logado pode decidir: {@code podeAprovar} e {@code podeRejeitar},
 * calculados pelas regras que recusam a decisão (RN-16, RN-33, D2, D10) e pelo relógio injetado. CT-147.
 * Relógio de teste: 20/10/2026 às 14:00 locais. As reservas de referência começam em 21/10/2026 às 10:00 locais
 * (13:00 UTC).
 */
class PermissoesDaFilaApiIT extends ApiIT {

    private static final String INICIO_UTC = "2026-10-21T13:00:00Z";

    private String s1;
    private String r1;
    private String r2;
    private long salaA;
    private long projetor;
    private long doSolicitante;
    private long doResponsavel;

    @BeforeEach
    void cenario() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r2@exemplo.test");
        s1 = login("s1@exemplo.test");
        r1 = login("r1@exemplo.test");
        r2 = login("r2@exemplo.test");
        salaA = salaSql("Sala A", false);
        long salaB = salaSql("Sala B", false);
        projetor = materialSql("Projetor P-001", "PAT-P001", true);
        long projetor2 = materialSql("Projetor P-002", "PAT-P002", true);
        doSolicitante = criar(s1, salaA, projetor);
        doResponsavel = criar(r1, salaB, projetor2);
    }

    // ---- apoio

    private long criar(String token, long sala, long restrito) throws Exception {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("titulo", "Aula de teste");
        corpo.put("inicio", local("2026-10-21T10:00"));
        corpo.put("fim", local("2026-10-21T12:00"));
        corpo.put("recursoIds", List.of(sala, restrito));
        String resposta = mvc.perform(post("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("id").asLong();
    }

    /** Muda o relógio e abre sessões novas: o token antigo expira com o salto no tempo. */
    private void irPara(String instanteIso) throws Exception {
        agora(instanteIso);
        s1 = login("s1@exemplo.test");
        r1 = login("r1@exemplo.test");
        r2 = login("r2@exemplo.test");
    }

    private ResultActions fila(String token) throws Exception {
        return mvc.perform(get("/api/reservas/fila").header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }

    private void item(ResultActions fila, long id, boolean aprovar, boolean rejeitar) throws Exception {
        fila.andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + id + ")].podeAprovar").value(aprovar))
                .andExpect(jsonPath("$[?(@.id==" + id + ")].podeRejeitar").value(rejeitar));
    }

    private ResultActions aprovar(String token, long id) throws Exception {
        return mvc.perform(post("/api/reservas/" + id + "/aprovacao").header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content("{}"));
    }

    private ResultActions rejeitar(String token, long id) throws Exception {
        return mvc.perform(post("/api/reservas/" + id + "/rejeicao").header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Recurso indisponível\"}"));
    }

    // ---- por posse

    @Test
    void ct147_responsavelDecideAReservaDeOutraPessoa() throws Exception {
        item(fila(r1), doSolicitante, true, true);
    }

    @Test
    void ct147_responsavelNaoDecideAPropriaReserva() throws Exception {
        item(fila(r1), doResponsavel, false, false);
    }

    @Test
    void ct147_outroResponsavelDecideAReservaDoColega() throws Exception {
        item(fila(r2), doResponsavel, true, true);
        item(fila(r2), doSolicitante, true, true);
    }

    @Test
    void ct147_solicitanteEAdministradorContinuamSemAFila() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        String adm = login("a1@exemplo.test");

        fila(s1).andExpect(status().isForbidden());
        fila(adm).andExpect(status().isForbidden());
    }

    // ---- o início da reserva, em trinca, com o relógio fixo (D2, D10)

    static Stream<Arguments> iniciosEmTrinca() {
        return Stream.of(
                Arguments.of("2026-10-21T12:59:59.999Z", true),
                Arguments.of(INICIO_UTC, false),
                Arguments.of("2026-10-21T13:00:00.001Z", false));
    }

    @ParameterizedTest(name = "agora {0} -> aprova={1}; rejeita continua permitido")
    @MethodSource("iniciosEmTrinca")
    void ct147_aprovarPerdeSentidoNoInstanteDeInicioERejeitarContinua(String agora, boolean aprovar) throws Exception {
        irPara(agora);

        item(fila(r1), doSolicitante, aprovar, true);
    }

    // ---- coerência com a defesa: o campo e a recusa do servidor dizem a mesma coisa

    @Test
    void ct147_quandoOCampoDizNaoAoDonoOServidorRecusaComOCodigoEstavel() throws Exception {
        item(fila(r1), doResponsavel, false, false);

        aprovar(r1, doResponsavel).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
        rejeitar(r1, doResponsavel).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
    }

    @Test
    void ct147_quandoOCampoDizNaoPorqueJaComecouOServidorRecusaAAprovacao() throws Exception {
        irPara(INICIO_UTC);
        item(fila(r1), doSolicitante, false, true);

        aprovar(r1, doSolicitante).andExpect(jsonPath("$.code").value("APROVACAO_APOS_INICIO"));
    }

    @Test
    void ct147_quandoOCampoDizSimOServidorAceita() throws Exception {
        irPara("2026-10-21T12:59:59.999Z");
        item(fila(r1), doSolicitante, true, true);

        aprovar(r1, doSolicitante).andExpect(status().isOk());
    }

    @Test
    void ct147_quandoRejeitarDizSimOServidorAceitaComMotivo() throws Exception {
        item(fila(r2), doResponsavel, true, true);

        rejeitar(r2, doResponsavel).andExpect(status().isOk());
    }
}
