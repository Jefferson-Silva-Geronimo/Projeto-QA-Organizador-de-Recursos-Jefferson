package br.senac.recursos.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/**
 * A resposta de cada reserva diz o que o Responsável logado pode fazer no uso dela: {@code podeIniciar},
 * {@code podeConcluir} e {@code podeMarcarNaoComparecimento}, calculados pelas regras que recusam a operação e pelo
 * relógio injetado (F6-16). CT-152. A tolerância de 30 minutos existe só neste teste (D1 é lacuna).
 * Relógio de teste: 20/10/2026 às 14:00 locais. A reserva de referência começa em 21/10/2026 às 14:00 locais (17:00 UTC).
 */
class PermissoesDeUsoApiIT extends ApiIT {

    private static final String INICIO_UTC = "2026-10-21T17:00:00Z";

    private String s1;
    private String r1;
    private String r2;
    private String adm;
    private long salaA;
    private long notebook;

    @BeforeEach
    void cenario() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r2@exemplo.test");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        s1 = login("s1@exemplo.test");
        r1 = login("r1@exemplo.test");
        r2 = login("r2@exemplo.test");
        adm = login("a1@exemplo.test");
        salaA = salaSql("Sala A", false);
        notebook = materialSql("Notebook N-001", "PAT-N001", false);
        jdbc.update("update configuracao set tolerancia_nao_comparecimento = interval '30 minutes'");
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

    /** Muda o relógio e abre sessões novas: o token antigo expira com o salto no tempo. */
    private void irPara(String instanteIso) throws Exception {
        agora(instanteIso);
        s1 = login("s1@exemplo.test");
        r1 = login("r1@exemplo.test");
        r2 = login("r2@exemplo.test");
        adm = login("a1@exemplo.test");
    }

    private ResultActions obter(String token, long id) throws Exception {
        return mvc.perform(get("/api/reservas/" + id).header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }

    private ResultActions acao(String token, long id, String acao) throws Exception {
        return mvc.perform(post("/api/reservas/" + id + "/" + acao).header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content("{}"));
    }

    private ResultActions material(String token, long id, String acao, long materialId) throws Exception {
        return mvc.perform(post("/api/reservas/" + id + "/" + acao).header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content("{\"materialId\":" + materialId + "}"));
    }

    private void permissoes(ResultActions r, boolean iniciar, boolean concluir, boolean naoCompareceu) throws Exception {
        r.andExpect(status().isOk())
                .andExpect(jsonPath("$.podeIniciar").value(iniciar))
                .andExpect(jsonPath("$.podeConcluir").value(concluir))
                .andExpect(jsonPath("$.podeMarcarNaoComparecimento").value(naoCompareceu));
    }

    // ---- por perfil e posse

    @Test
    void ct152_responsavelPodeIniciarReservaAprovadaAntesDoInicio() throws Exception {
        long id = reservar(s1, salaA);

        permissoes(obter(r1, id), true, false, false);
        permissoes(obter(r2, id), true, false, false);
    }

    @Test
    void ct152_solicitanteEAdministradorNuncaRecebemAcaoDeUso() throws Exception {
        long id = reservar(s1, salaA);

        permissoes(obter(s1, id), false, false, false);
        permissoes(obter(adm, id), false, false, false);
    }

    @Test
    void ct152_responsavelDonoOperaAPropriaReserva() throws Exception {
        long propria = reservar(r1, salaA);

        permissoes(obter(r1, propria), true, false, false);
    }

    @Test
    void ct152_aListaTrazOsCamposDeCadaReservaParaOUsuarioLogado() throws Exception {
        long id = reservar(s1, salaA);

        mvc.perform(get("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(r1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + id + ")].podeIniciar").value(true));
        mvc.perform(get("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + id + ")].podeIniciar").value(false));
    }

    // ---- tolerância de não comparecimento, em trinca, com o relógio fixo (D1)

    static Stream<Arguments> limiteDaTolerancia() {
        return Stream.of(
                Arguments.of("2026-10-21T17:29:59.999Z", false),
                Arguments.of("2026-10-21T17:30:00Z", true),
                Arguments.of("2026-10-21T17:30:00.001Z", true));
    }

    @ParameterizedTest(name = "agora {0} -> pode marcar não comparecimento={1}")
    @MethodSource("limiteDaTolerancia")
    void ct152_naoComparecimentoSoDepoisDeInicioMaisTolerancia(String agora, boolean pode) throws Exception {
        long id = reservar(s1, salaA);
        irPara(agora);

        permissoes(obter(r1, id), true, false, pode);
    }

    @Test
    void ct152_antesDoInicioNaoHaNaoComparecimento() throws Exception {
        long id = reservar(s1, salaA);
        irPara(INICIO_UTC);

        permissoes(obter(r1, id), true, false, false);
    }

    @Test
    void ct152_semToleranciaConfiguradaOServidorRecusaEOCampoDizNao() throws Exception {
        jdbc.update("update configuracao set tolerancia_nao_comparecimento = null");
        long id = reservar(s1, salaA);
        irPara("2026-10-22T00:00:00Z");

        permissoes(obter(r1, id), true, false, false);
        acao(r1, id, "nao-comparecimento").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TOLERANCIA_NAO_CONFIGURADA"));
    }

    // ---- material pendente (RN-23)

    @Test
    void ct152_emUsoComMaterialRetiradoNaoPodeConcluirAteDevolver() throws Exception {
        long id = reservar(s1, salaA, notebook);

        permissoes(material(r1, id, "retiradas", notebook), false, false, false);
        permissoes(obter(r1, id), false, false, false);
        acao(r1, id, "conclusao").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MATERIAL_PENDENTE"));

        permissoes(material(r1, id, "devolucoes", notebook), false, true, false);
        permissoes(obter(r1, id), false, true, false);
        acao(r1, id, "conclusao").andExpect(status().isOk());
    }

    @Test
    void ct152_emUsoSemMaterialPodeConcluir() throws Exception {
        long id = reservar(s1, salaA);

        permissoes(acao(r1, id, "inicio"), false, true, false);
    }

    // ---- estados em que nada é oferecido

    @ParameterizedTest(name = "estado {0}: nada é oferecido")
    @ValueSource(strings = {"SOLICITADA", "CONCLUIDA", "REJEITADA", "CANCELADA", "NAO_COMPARECEU"})
    void ct152_foraDeAprovadaEEmUsoNaoHaAcaoDeUso(String estado) throws Exception {
        long id = reservar(s1, salaA);
        jdbc.update("update reservas set estado = cast(? as estado_reserva), motivo_texto = 'Motivo de teste' where id = ?",
                estado, id);
        irPara("2026-10-22T00:00:00Z");

        permissoes(obter(r1, id), false, false, false);
    }

    // ---- coerência com a defesa: o campo e a recusa do servidor dizem a mesma coisa

    @Test
    void ct152_quandoOCampoDizNaoOServidorRecusaComOCodigoEstavel() throws Exception {
        long id = reservar(s1, salaA);
        permissoes(obter(r1, id), true, false, false);

        acao(r1, id, "conclusao").andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("TRANSICAO_PROIBIDA"));
        acao(r1, id, "nao-comparecimento").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TOLERANCIA_NAO_ENCERRADA"));
    }

    @Test
    void ct152_quandoOCampoDizSimOServidorAceita() throws Exception {
        long id = reservar(s1, salaA);
        irPara("2026-10-21T17:30:00Z");
        permissoes(obter(r1, id), true, false, true);

        acao(r1, id, "nao-comparecimento").andExpect(status().isOk());
    }

    @Test
    void ct152_aRespostaDeNaoComparecimentoMostraQueJaNaoHaAcoes() throws Exception {
        long id = reservar(s1, salaA);
        irPara("2026-10-21T17:30:00Z");

        permissoes(acao(r1, id, "nao-comparecimento"), false, false, false);
    }
}
