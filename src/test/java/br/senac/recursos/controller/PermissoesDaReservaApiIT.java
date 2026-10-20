package br.senac.recursos.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/**
 * A resposta de cada reserva diz o que o usuário logado pode fazer com ela (F6-14): {@code podeAlterar} e
 * {@code podeCancelar}, calculados pelas políticas de RN-18 e RN-19 e pelo relógio injetado (D10). CT-145.
 * Relógio de teste: 20/10/2026 às 14:00 locais. A reserva de referência começa em 21/10/2026 às 10:00 locais
 * (13:00 UTC).
 */
class PermissoesDaReservaApiIT extends ApiIT {

    private static final String INICIO_UTC = "2026-10-21T13:00:00Z";

    private String s1;
    private String s2;
    private String r1;
    private String adm;
    private long salaA;
    private long projetor;
    private long aprovada;
    private long solicitada;

    @BeforeEach
    void cenario() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("SOLICITANTE", "s2@exemplo.test");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        s1 = login("s1@exemplo.test");
        s2 = login("s2@exemplo.test");
        r1 = login("r1@exemplo.test");
        adm = login("a1@exemplo.test");
        salaA = salaSql("Sala A", false);
        projetor = materialSql("Projetor P-001", "PAT-P001", true);
        aprovada = criar(s1, "2026-10-21T10:00", "2026-10-21T12:00", salaA);
        solicitada = criar(s1, "2026-10-22T10:00", "2026-10-22T12:00", salaA, projetor);
    }

    // ---- apoio

    private long criar(String token, String inicioLocal, String fimLocal, long... recursos) throws Exception {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("titulo", "Aula de teste");
        corpo.put("inicio", local(inicioLocal));
        corpo.put("fim", local(fimLocal));
        corpo.put("recursoIds", java.util.Arrays.stream(recursos).boxed().toList());
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
        adm = login("a1@exemplo.test");
    }

    private ResultActions obter(String token, long id) throws Exception {
        return mvc.perform(get("/api/reservas/" + id).header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }

    private ResultActions alterarTitulo(String token, long id) throws Exception {
        return mvc.perform(put("/api/reservas/" + id).header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content("{\"titulo\":\"Novo título\"}"));
    }

    private ResultActions cancelar(String token, long id, String motivo) throws Exception {
        String conteudo = motivo == null ? "{}" : json.writeValueAsString(Map.of("motivo", motivo));
        return mvc.perform(post("/api/reservas/" + id + "/cancelamento").header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content(conteudo));
    }

    private void permissoes(ResultActions r, boolean alterar, boolean cancelar) throws Exception {
        r.andExpect(status().isOk())
                .andExpect(jsonPath("$.podeAlterar").value(alterar))
                .andExpect(jsonPath("$.podeCancelar").value(cancelar));
    }

    // ---- por perfil e posse

    @Test
    void ct145_donoSolicitanteAlteraECancelaAntesDoInicio() throws Exception {
        permissoes(obter(s1, aprovada), true, true);
        permissoes(obter(s1, solicitada), true, true);
    }

    @Test
    void ct145_outroSolicitanteNemVeAReservaEPortanto_naoRecebePermissao() throws Exception {
        obter(s2, aprovada).andExpect(status().is4xxClientError());
    }

    @Test
    void ct145_responsavelQueNaoEDonoSoCancelaReservaAprovada() throws Exception {
        permissoes(obter(r1, aprovada), false, true);
        permissoes(obter(r1, solicitada), false, false);
    }

    @Test
    void ct145_administradorCancelaMasNuncaAltera() throws Exception {
        permissoes(obter(adm, aprovada), false, true);
        permissoes(obter(adm, solicitada), false, true);
    }

    @Test
    void ct145_responsavelDonoAlteraECancelaAPropriaReserva() throws Exception {
        long propria = criar(r1, "2026-10-23T10:00", "2026-10-23T12:00", salaA);

        permissoes(obter(r1, propria), true, true);
    }

    @Test
    void ct145_aListaTrazOsCamposDeCadaReservaParaOUsuarioLogado() throws Exception {
        mvc.perform(get("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(r1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + aprovada + ")].podeCancelar").value(true))
                .andExpect(jsonPath("$[?(@.id==" + aprovada + ")].podeAlterar").value(false))
                .andExpect(jsonPath("$[?(@.id==" + solicitada + ")].podeCancelar").value(false));
        mvc.perform(get("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + aprovada + ")].podeAlterar").value(true))
                .andExpect(jsonPath("$[?(@.id==" + solicitada + ")].podeAlterar").value(true));
    }

    // ---- o início da reserva, em trinca, com o relógio fixo (D10, RN-07)

    static Stream<Arguments> iniciosEmTrinca() {
        return Stream.of(
                Arguments.of("2026-10-21T12:59:59.999Z", true, true),
                Arguments.of(INICIO_UTC, false, false),
                Arguments.of("2026-10-21T13:00:00.001Z", false, false));
    }

    @ParameterizedTest(name = "dono, agora {0} -> altera={1}, cancela={2}")
    @MethodSource("iniciosEmTrinca")
    void ct145_donoPerdeAsDuasAcoesNoInstanteDeInicio(String agora, boolean alterar, boolean cancelar) throws Exception {
        irPara(agora);

        permissoes(obter(s1, aprovada), alterar, cancelar);
    }

    @ParameterizedTest(name = "Responsável que não é o dono, agora {0}: cancela com motivo a qualquer hora")
    @MethodSource("iniciosEmTrinca")
    void ct145_responsavelContinuaPodendoCancelarDepoisDoInicio(String agora, boolean alterarDoDono, boolean cancelarDoDono)
            throws Exception {
        irPara(agora);

        permissoes(obter(r1, aprovada), false, true);
    }

    // ---- coerência com a defesa: o campo e a recusa do servidor dizem a mesma coisa

    @Test
    void ct145_quandoOCampoDizNaoOServidorRecusaComOCodigoEstavel() throws Exception {
        irPara(INICIO_UTC);
        permissoes(obter(s1, aprovada), false, false);

        alterarTitulo(s1, aprovada).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("RESERVA_JA_INICIADA"));
        cancelar(s1, aprovada, null).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("RESERVA_JA_INICIADA"));
    }

    @Test
    void ct145_quandoOCampoDizSimOServidorAceita() throws Exception {
        irPara("2026-10-21T12:59:59.999Z");
        permissoes(obter(s1, aprovada), true, true);

        alterarTitulo(s1, aprovada).andExpect(status().isOk());
        cancelar(s1, aprovada, null).andExpect(status().isOk());
    }

    // ---- estados em que ninguém age

    @ParameterizedTest(name = "estado {0}: ninguém altera nem cancela")
    @org.junit.jupiter.params.provider.ValueSource(strings = {"EM_USO", "CONCLUIDA", "REJEITADA", "CANCELADA", "NAO_COMPARECEU"})
    void ct145_emUsoEEstadosTerminaisNaoTemAcoes(String estado) throws Exception {
        jdbc.update("update reservas set estado = cast(? as estado_reserva), motivo_texto = 'Motivo de teste' where id = ?", estado, aprovada);

        permissoes(obter(s1, aprovada), false, false);
        permissoes(obter(r1, aprovada), false, false);
        permissoes(obter(adm, aprovada), false, false);
    }

    // ---- as respostas das operações também trazem os campos

    @Test
    void ct145_aRespostaDeCriarTrazOsCampos() throws Exception {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("titulo", "Outra aula");
        corpo.put("inicio", local("2026-10-23T14:00"));
        corpo.put("fim", local("2026-10-23T16:00"));
        corpo.put("recursoIds", java.util.List.of(salaA));

        mvc.perform(post("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(s1))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.podeAlterar").value(true))
                .andExpect(jsonPath("$.podeCancelar").value(true));
    }

    @Test
    void ct145_aRespostaDeCancelarMostraQueJaNaoHaAcoes() throws Exception {
        permissoes(cancelar(s1, aprovada, null), false, false);
    }

    @Test
    void ct145_aRespostaDeAprovarMostraAsPermissoesDoResponsavelQueAprovou() throws Exception {
        permissoes(mvc.perform(post("/api/reservas/" + solicitada + "/aprovacao")
                .header(HttpHeaders.AUTHORIZATION, bearer(r1)).contentType(MediaType.APPLICATION_JSON).content("{}")),
                false, true);
    }
}
