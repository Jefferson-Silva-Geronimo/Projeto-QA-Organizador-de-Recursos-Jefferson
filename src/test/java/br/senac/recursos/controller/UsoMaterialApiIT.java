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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Uso da reserva, retirada e devolução de material, conclusão e não comparecimento
 * (RF-09, RF-16, RN-05, RN-12, RN-20, RN-21, RN-23, D13). CT-084 a CT-095.
 * A tolerância de não comparecimento é a lacuna D1: o valor de 30 minutos existe só neste teste.
 */
class UsoMaterialApiIT extends ApiIT {

    private static final String TOLERANCIA_DE_TESTE = "30 minutes";

    private long idR1;
    private String s1;
    private String r1;
    private String r2;
    private String adm;
    private long salaA;
    private long notebook1;
    private long notebook2;

    @BeforeEach
    void cenario() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        idR1 = criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r2@exemplo.test");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        s1 = login("s1@exemplo.test");
        r1 = login("r1@exemplo.test");
        r2 = login("r2@exemplo.test");
        adm = login("a1@exemplo.test");
        salaA = salaSql("Sala A", false);
        notebook1 = materialSql("Notebook N-001", "PAT-N001", false);
        notebook2 = materialSql("Notebook N-002", "PAT-N002", false);
        jdbc.update("update configuracao set tolerancia_nao_comparecimento = interval '" + TOLERANCIA_DE_TESTE + "'");
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

    private ResultActions acao(String token, long reserva, String acao, Object corpo) throws Exception {
        return mvc.perform(post("/api/reservas/" + reserva + "/" + acao)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(corpo)));
    }

    private ResultActions material(String token, long reserva, String acao, long material) throws Exception {
        return acao(token, reserva, acao, Map.of("materialId", material));
    }

    private String estado(long id) {
        return jdbc.queryForObject("select estado::text from reservas where id = ?", String.class, id);
    }

    // ---- início e retirada

    @Test
    void ct084_primeiraRetiradaLevaAEmUsoERegistraUnidadeQuemEQuando() throws Exception {
        long id = reservar(s1, salaA, notebook1);
        assertThat(estado(id)).isEqualTo("APROVADA");

        material(r1, id, "retiradas", notebook1).andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("EM_USO"));

        assertThat(estado(id)).isEqualTo("EM_USO");
        assertThat(contar("select count(*) from movimentacoes_material where reserva_id = ? and material_id = ? "
                + "and tipo = 'RETIRADA' and registrado_por_id = ?", id, notebook1, idR1)).isEqualTo(1);
        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? and acao = 'RESERVA_INICIADA' "
                + "and estado_anterior = 'APROVADA' and estado_novo = 'EM_USO'", id)).isEqualTo(1);
    }

    @Test
    void ct084_retiradaDeMaterialForaDaReservaEhRecusada() throws Exception {
        long id = reservar(s1, salaA, notebook1);

        material(r1, id, "retiradas", notebook2).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MATERIAL_FORA_DA_RESERVA"));

        assertThat(estado(id)).isEqualTo("APROVADA");
    }

    @Test
    void ct085_inicioDeUsoSemMaterialLevaAEmUso() throws Exception {
        long id = reservar(s1, salaA);

        acao(r1, id, "inicio", Map.of()).andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("EM_USO"));

        assertThat(estado(id)).isEqualTo("EM_USO");
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"SOLICITADA", "EM_USO", "CONCLUIDA", "CANCELADA", "REJEITADA", "NAO_COMPARECEU"})
    void ct086_inicioSoEmReservaAprovada(String estadoForcado) throws Exception {
        long id = reservar(s1, salaA);
        jdbc.update("update reservas set estado = cast(? as estado_reserva), "
                + "motivo_texto = case when ? = 'REJEITADA' then 'teste' else motivo_texto end where id = ?",
                estadoForcado, estadoForcado, id);

        acao(r1, id, "inicio", Map.of()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSICAO_PROIBIDA"));
    }

    @Test
    void ct087_soOResponsavelRegistraOInicio() throws Exception {
        long id = reservar(s1, salaA);

        acao(s1, id, "inicio", Map.of()).andExpect(status().isForbidden());
        acao(adm, id, "inicio", Map.of()).andExpect(status().isForbidden());

        assertThat(estado(id)).isEqualTo("APROVADA");
    }

    // ---- devolução e conclusão

    @Test
    void ct088_devolverUnidadeNaoRetiradaEhRecusado() throws Exception {
        long id = reservar(s1, salaA, notebook1, notebook2);
        material(r1, id, "retiradas", notebook1).andExpect(status().isOk());

        material(r1, id, "devolucoes", notebook2).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DEVOLUCAO_SEM_RETIRADA"));

        assertThat(contar("select count(*) from movimentacoes_material where tipo = 'DEVOLUCAO'")).isZero();
    }

    @Test
    void ct089_conclusaoComMaterialRetiradoENaoDevolvidoListaAsPendencias() throws Exception {
        long id = reservar(s1, salaA, notebook1, notebook2);
        material(r1, id, "retiradas", notebook1).andExpect(status().isOk());
        material(r1, id, "retiradas", notebook2).andExpect(status().isOk());
        material(r1, id, "devolucoes", notebook1).andExpect(status().isOk());

        acao(r1, id, "conclusao", Map.of()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MATERIAL_PENDENTE"))
                .andExpect(jsonPath("$.itens", hasSize(1)))
                .andExpect(jsonPath("$.itens[0]").value(String.valueOf(notebook2)));

        assertThat(estado(id)).isEqualTo("EM_USO");
    }

    @Test
    void ct090_conclusaoComTudoDevolvidoEhAceita() throws Exception {
        long id = reservar(s1, salaA, notebook1, notebook2);
        material(r1, id, "retiradas", notebook1).andExpect(status().isOk());
        material(r1, id, "retiradas", notebook2).andExpect(status().isOk());
        material(r1, id, "devolucoes", notebook1).andExpect(status().isOk());
        material(r1, id, "devolucoes", notebook2).andExpect(status().isOk());

        acao(r1, id, "conclusao", Map.of()).andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CONCLUIDA"));

        assertThat(estado(id)).isEqualTo("CONCLUIDA");
        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? and acao = 'RESERVA_CONCLUIDA'",
                id)).isEqualTo(1);
        assertThat(contar("select count(*) from ocupacoes where reserva_id = ? and ativa", id)).isZero();
    }

    @Test
    void ct091_materialReservadoENuncaRetiradoNaoImpedeAConclusao() throws Exception {
        long id = reservar(s1, salaA, notebook1);
        acao(r1, id, "inicio", Map.of()).andExpect(status().isOk());

        acao(r1, id, "conclusao", Map.of()).andExpect(status().isOk());

        assertThat(estado(id)).isEqualTo("CONCLUIDA");
    }

    @Test
    void ct092_responsavelDonoOperaAPropriaReservaMasAuditaOAtor() throws Exception {
        long id = reservar(r1, salaA, notebook1);

        material(r1, id, "retiradas", notebook1).andExpect(status().isOk());
        material(r1, id, "devolucoes", notebook1).andExpect(status().isOk());
        acao(r1, id, "conclusao", Map.of()).andExpect(status().isOk());

        assertThat(estado(id)).isEqualTo("CONCLUIDA");
        assertThat(contar("select count(*) from movimentacoes_material where reserva_id = ? and registrado_por_id = ?",
                id, idR1)).isEqualTo(2);
        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? and ator_id = ? "
                + "and acao = 'RESERVA_CONCLUIDA'", id, idR1)).isEqualTo(1);
    }

    @Test
    void ct086_conclusaoSoAPartirDeEmUso() throws Exception {
        long id = reservar(s1, salaA);

        acao(r1, id, "conclusao", Map.of()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSICAO_PROIBIDA"));
    }

    // ---- não compareceu

    @ParameterizedTest(name = "agora = início + 30min {0} ms -> aceita={1}")
    @CsvSource({"-1, false", "0, true", "1, true"})
    void ct093_naoCompareceuSoDepoisDaTolerancia(long deslocamentoMs, boolean aceita) throws Exception {
        long id = reservar(s1, salaA);
        // início às 17:00Z em 21/10/2026, mais 30 minutos de tolerância de teste
        agora(java.time.Instant.parse("2026-10-21T17:30:00Z").plusMillis(deslocamentoMs).toString());
        String token = login("r1@exemplo.test");

        ResultActions r = acao(token, id, "nao-comparecimento", Map.of());

        if (aceita) {
            r.andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("NAO_COMPARECEU"));
            assertThat(estado(id)).isEqualTo("NAO_COMPARECEU");
            assertThat(contar("select count(*) from ocupacoes where reserva_id = ? and ativa", id)).isZero();
        } else {
            r.andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("TOLERANCIA_NAO_ENCERRADA"));
            assertThat(estado(id)).isEqualTo("APROVADA");
        }
    }

    @Test
    void ct093_semToleranciaConfiguradaNaoCompareceuEhRecusado() throws Exception {
        jdbc.update("update configuracao set tolerancia_nao_comparecimento = null");
        long id = reservar(s1, salaA);
        agora("2026-10-22T00:00:00Z");
        String token = login("r1@exemplo.test");

        acao(token, id, "nao-comparecimento", Map.of()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TOLERANCIA_NAO_CONFIGURADA"));
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"SOLICITADA", "EM_USO"})
    void ct094_naoCompareceuSoEmReservaAprovada(String estadoForcado) throws Exception {
        long id = reservar(s1, salaA);
        jdbc.update("update reservas set estado = cast(? as estado_reserva) where id = ?", estadoForcado, id);
        agora("2026-10-22T00:00:00Z");
        String token = login("r1@exemplo.test");

        acao(token, id, "nao-comparecimento", Map.of()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSICAO_PROIBIDA"));
    }

    // ---- histórico

    @Test
    void ct095_historicoDeRetiradaEDevolucaoEhConsultavel() throws Exception {
        long id = reservar(s1, salaA, notebook1);
        material(r2, id, "retiradas", notebook1).andExpect(status().isOk());
        material(r2, id, "devolucoes", notebook1).andExpect(status().isOk());

        mvc.perform(get("/api/reservas/" + id + "/movimentacoes").header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].tipo").value("RETIRADA"))
                .andExpect(jsonPath("$[1].tipo").value("DEVOLUCAO"))
                .andExpect(jsonPath("$[0].materialId").value(notebook1));
    }
}
