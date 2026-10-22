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
 * Histórico auditável com o nome de quem agiu (RF-10, RN-08, L-04, F6-17). CT-155. O evento traz só o nome, nunca o
 * e-mail; o SISTEMA não tem nome; o usuário desativado depois continua com o nome; e ninguém ganha acesso novo.
 */
class AtorDoHistoricoApiIT extends ApiIT {

    private static final String EMAIL_DA_MARIA = "maria.souza@exemplo.test";
    private static final String EMAIL_DA_ANA = "ana.prado@exemplo.test";

    private long idAna;
    private String maria;
    private String outraPessoa;
    private String carlos;
    private String ana;
    private String adm;
    private long salaA;
    private long projetor;

    @BeforeEach
    void cenario() throws Exception {
        criarUsuario("SOLICITANTE", EMAIL_DA_MARIA, "Maria Souza");
        criarUsuario("SOLICITANTE", "outra.pessoa@exemplo.test", "Outra Pessoa");
        criarUsuario("RESPONSAVEL", "carlos.lima@exemplo.test", "Carlos Lima");
        idAna = criarUsuario("RESPONSAVEL", EMAIL_DA_ANA, "Ana Prado");
        criarUsuario("RESPONSAVEL", "terceiro.responsavel@exemplo.test", "Terceiro Responsável");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test", "Beatriz Admin");
        maria = login(EMAIL_DA_MARIA);
        outraPessoa = login("outra.pessoa@exemplo.test");
        carlos = login("carlos.lima@exemplo.test");
        ana = login(EMAIL_DA_ANA);
        adm = login("a1@exemplo.test");
        salaA = salaSql("Sala A", false);
        projetor = materialSql("Projetor P-001", "PAT-P001", true);
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

    private ResultActions aprovar(String token, long reserva) throws Exception {
        return mvc.perform(post("/api/reservas/" + reserva + "/aprovacao").header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content("{}"));
    }

    private ResultActions historico(String token, long reserva) throws Exception {
        return mvc.perform(get("/api/reservas/" + reserva + "/historico").header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }

    // ---- quem agiu

    @Test
    void ct155_historicoTrazONomeDeQuemAgiuENuncaOEmail() throws Exception {
        long id = reservar(maria, salaA, projetor);          // SOLICITADA, pedida por Maria
        aprovar(ana, id).andExpect(status().isOk());          // aprovada por Ana

        String corpo = historico(carlos, id).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].atorNome").value("Maria Souza"))
                .andExpect(jsonPath("$[1].atorNome").value("Ana Prado"))
                .andReturn().getResponse().getContentAsString();

        assertThat(corpo).as("o histórico não expõe o e-mail de quem agiu").doesNotContain(EMAIL_DA_MARIA)
                .doesNotContain(EMAIL_DA_ANA).doesNotContain("email");
    }

    @Test
    void ct155_oSistemaNaoTemNome() throws Exception {
        long id = reservar(maria, salaA);                      // aprovada automaticamente pelo SISTEMA

        historico(carlos, id).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.atorTipo=='SISTEMA')].atorNome").isEmpty())
                .andExpect(jsonPath("$[?(@.atorTipo=='SISTEMA')].atorId").isEmpty());
    }

    @Test
    void ct155_usuarioDesativadoContinuaComONomeNoHistorico() throws Exception {
        long id = reservar(maria, salaA, projetor);
        aprovar(ana, id).andExpect(status().isOk());
        mvc.perform(post("/api/usuarios/" + idAna + "/desativacao").header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().is2xxSuccessful());

        historico(carlos, id).andExpect(status().isOk())
                .andExpect(jsonPath("$[1].atorNome").value("Ana Prado"));
    }

    @Test
    void ct155_auditoriaCompletaDoAdministradorTrazONomeDoAtor() throws Exception {
        long id = reservar(maria, salaA);
        mvc.perform(post("/api/reservas/" + id + "/cancelamento").header(HttpHeaders.AUTHORIZATION, bearer(adm))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Evento institucional\"}"))
                .andExpect(status().isOk());

        String corpo = mvc.perform(get("/api/auditoria").param("entidade", "RESERVA").param("entidadeId", String.valueOf(id))
                        .header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.acao=='RESERVA_CANCELADA')].atorNome").value("Beatriz Admin"))
                .andReturn().getResponse().getContentAsString();

        assertThat(corpo).doesNotContain("a1@exemplo.test").doesNotContain(EMAIL_DA_MARIA);
    }

    // ---- autorização: quem já via continua vendo e ninguém ganha acesso novo

    @Test
    void ct155_quemJaPodiaVerOHistoricoContinuaVendoComONome() throws Exception {
        long id = reservar(maria, salaA);

        historico(maria, id).andExpect(status().isOk()).andExpect(jsonPath("$[0].atorNome").value("Maria Souza"));
        historico(carlos, id).andExpect(status().isOk()).andExpect(jsonPath("$[0].atorNome").value("Maria Souza"));
        historico(adm, id).andExpect(status().isOk()).andExpect(jsonPath("$[0].atorNome").value("Maria Souza"));
    }

    @Test
    void ct155_ninguemGanhaAcessoNovo() throws Exception {
        long id = reservar(maria, salaA);

        historico(outraPessoa, id).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
        mvc.perform(get("/api/auditoria").header(HttpHeaders.AUTHORIZATION, bearer(carlos)))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
        mvc.perform(get("/api/auditoria").header(HttpHeaders.AUTHORIZATION, bearer(maria))).andExpect(status().isForbidden());
        mvc.perform(get("/api/reservas/" + id + "/historico")).andExpect(status().isUnauthorized());
    }
}
