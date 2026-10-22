package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Histórico de movimentações de uma reserva: quem registrou (o nome, nunca o e-mail) e qual é a movimentação atual
 * de cada material (RF-09, L-04, F6-16). CT-153. Ninguém ganha acesso novo ao histórico.
 */
class HistoricoDeMovimentacoesApiIT extends ApiIT {

    private static final String EMAIL_DO_CARLOS = "carlos.lima@exemplo.test";

    private long idCarlos;
    private String s1;
    private String s2;
    private String carlos;
    private String ana;
    private String adm;
    private long salaA;
    private long notebook1;
    private long notebook2;
    private long reserva;

    @BeforeEach
    void cenario() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("SOLICITANTE", "s2@exemplo.test");
        idCarlos = criarUsuario("RESPONSAVEL", EMAIL_DO_CARLOS, "Carlos Lima");
        criarUsuario("RESPONSAVEL", "ana.prado@exemplo.test", "Ana Prado");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        s1 = login("s1@exemplo.test");
        s2 = login("s2@exemplo.test");
        carlos = login(EMAIL_DO_CARLOS);
        ana = login("ana.prado@exemplo.test");
        adm = login("a1@exemplo.test");
        salaA = salaSql("Sala A", false);
        notebook1 = materialSql("Notebook N-001", "PAT-N001", false);
        notebook2 = materialSql("Notebook N-002", "PAT-N002", false);
        reserva = reservar(s1, salaA, notebook1, notebook2);
    }

    // ---- apoio

    private long reservar(String token, long... recursos) throws Exception {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("titulo", "Aula de teste");
        c.put("inicio", local("2026-10-21T14:00"));
        c.put("fim", local("2026-10-21T16:00"));
        c.put("recursoIds", java.util.Arrays.stream(recursos).boxed().toList());
        String resposta = mvc.perform(post("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(c)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("id").asLong();
    }

    private ResultActions material(String token, String acao, long materialId) throws Exception {
        return mvc.perform(post("/api/reservas/" + reserva + "/" + acao).header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content("{\"materialId\":" + materialId + "}"));
    }

    private ResultActions historico(String token) throws Exception {
        return mvc.perform(get("/api/reservas/" + reserva + "/movimentacoes").header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }

    // ---- quem registrou

    @Test
    void ct153_historicoTrazONomeDeQuemRegistrouENuncaOEmail() throws Exception {
        material(carlos, "retiradas", notebook1).andExpect(status().isOk());

        String corpo = historico(carlos).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].registradoPorId").value(idCarlos))
                .andExpect(jsonPath("$[0].registradoPorNome").value("Carlos Lima"))
                .andReturn().getResponse().getContentAsString();

        assertThat(corpo).as("o histórico não expõe o e-mail de quem registrou").doesNotContain(EMAIL_DO_CARLOS)
                .doesNotContain("email");
    }

    @Test
    void ct153_cadaMovimentacaoTemOnomeDeQuemARegistrou() throws Exception {
        material(carlos, "retiradas", notebook1).andExpect(status().isOk());
        material(ana, "devolucoes", notebook1).andExpect(status().isOk());

        historico(carlos).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].registradoPorNome").value("Carlos Lima"))
                .andExpect(jsonPath("$[1].registradoPorNome").value("Ana Prado"));
    }

    @Test
    void ct153_usuarioDesativadoContinuaComONomeNoHistorico() throws Exception {
        criarUsuario("RESPONSAVEL", "terceiro.responsavel@exemplo.test");   // o sistema exige um mínimo de Responsáveis ativos
        material(carlos, "retiradas", notebook1).andExpect(status().isOk());
        mvc.perform(post("/api/usuarios/" + idCarlos + "/desativacao").header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().is2xxSuccessful());

        historico(ana).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].registradoPorNome").value("Carlos Lima"));
    }

    // ---- movimentação atual de cada material

    @Test
    void ct153_soAUltimaMovimentacaoDeCadaMaterialEAAtual() throws Exception {
        material(carlos, "retiradas", notebook1).andExpect(status().isOk());      // 1
        material(carlos, "devolucoes", notebook1).andExpect(status().isOk());     // 2
        material(carlos, "retiradas", notebook1).andExpect(status().isOk());      // 3: atual de notebook1
        material(carlos, "retiradas", notebook2).andExpect(status().isOk());      // 4: atual de notebook2

        historico(carlos).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].atual").value(false))
                .andExpect(jsonPath("$[1].atual").value(false))
                .andExpect(jsonPath("$[2].atual").value(true))
                .andExpect(jsonPath("$[3].atual").value(true));
    }

    @Test
    void ct153_materialDevolvidoTemADevolucaoComoAtual() throws Exception {
        material(carlos, "retiradas", notebook1).andExpect(status().isOk());
        material(carlos, "devolucoes", notebook1).andExpect(status().isOk());

        historico(carlos).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].atual").value(false))
                .andExpect(jsonPath("$[1].atual").value(true))
                .andExpect(jsonPath("$[1].tipo").value("DEVOLUCAO"));
    }

    @Test
    void ct153_historicoVazioNaoTemMovimentacaoAtual() throws Exception {
        historico(carlos).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
    }

    // ---- coerência com a defesa: a movimentação atual e a recusa do servidor dizem a mesma coisa

    @Test
    void ct153_comARetiradaAtualOServidorRecusaNovaRetiradaEAceitaDevolucao() throws Exception {
        material(carlos, "retiradas", notebook1).andExpect(status().isOk());
        historico(carlos).andExpect(jsonPath("$[0].tipo").value("RETIRADA")).andExpect(jsonPath("$[0].atual").value(true));

        material(carlos, "retiradas", notebook1).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MATERIAL_JA_RETIRADO"));
        material(carlos, "devolucoes", notebook1).andExpect(status().isOk());
    }

    @Test
    void ct153_comADevolucaoAtualOuSemMovimentacaoOServidorRecusaDevolucaoEAceitaRetirada() throws Exception {
        material(carlos, "retiradas", notebook1).andExpect(status().isOk());       // a reserva passa a EM_USO
        // notebook2 nunca foi movimentado
        material(carlos, "devolucoes", notebook2).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DEVOLUCAO_SEM_RETIRADA"));
        material(carlos, "devolucoes", notebook1).andExpect(status().isOk());
        historico(carlos).andExpect(jsonPath("$[1].tipo").value("DEVOLUCAO")).andExpect(jsonPath("$[1].atual").value(true));

        material(carlos, "devolucoes", notebook1).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DEVOLUCAO_SEM_RETIRADA"));
        material(carlos, "retiradas", notebook1).andExpect(status().isOk());
    }

    // ---- autorização: quem já via continua vendo, e ninguém ganha acesso novo

    @Test
    void ct153_quemJaPodiaVerOHistoricoContinuaVendo() throws Exception {
        material(carlos, "retiradas", notebook1).andExpect(status().isOk());

        historico(s1).andExpect(status().isOk()).andExpect(jsonPath("$[0].registradoPorNome").value("Carlos Lima"));
        historico(ana).andExpect(status().isOk());
        historico(adm).andExpect(status().isOk());
    }

    @Test
    void ct153_ninguemGanhaAcessoNovo() throws Exception {
        material(carlos, "retiradas", notebook1).andExpect(status().isOk());

        historico(s2).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
        mvc.perform(get("/api/reservas/" + reserva + "/movimentacoes")).andExpect(status().isUnauthorized());
    }
}
