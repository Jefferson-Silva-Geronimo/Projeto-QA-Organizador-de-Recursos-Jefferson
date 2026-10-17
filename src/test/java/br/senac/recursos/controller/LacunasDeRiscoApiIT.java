package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Lacunas de risco apontadas pelo relatório de cobertura ao ligar o gate (Prompt 4.C): caminhos de
 * recusa que não tinham teste. Cada caso afirma o resultado e a ausência de efeito, não só executa o código.
 */
class LacunasDeRiscoApiIT extends ApiIT {

    private long idS1;
    private String s1;
    private String r1;
    private String adm;
    private long salaA;
    private long notebook;

    @BeforeEach
    void cenario() throws Exception {
        idS1 = criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        s1 = login("s1@exemplo.test");
        r1 = login("r1@exemplo.test");
        adm = login("a1@exemplo.test");
        salaA = salaSql("Sala A", false);
        notebook = materialSql("Notebook N-001", "PAT-N001", false);
    }

    private ResultActions enviar(String metodo, String token, String caminho, Object corpo) throws Exception {
        var req = metodo.equals("PUT") ? put(caminho) : post(caminho);
        return mvc.perform(req.header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo)));
    }

    private Map<String, Object> reserva(long... recursos) {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("titulo", "Aula de teste");
        c.put("inicio", local("2026-10-21T14:00"));
        c.put("fim", local("2026-10-21T16:00"));
        c.put("recursoIds", java.util.Arrays.stream(recursos).boxed().toList());
        return c;
    }

    // ---- bloqueio

    @Test
    void bloqueioDeRecursoInexistenteOuInativoEhRecusado() throws Exception {
        Map<String, Object> inexistente = Map.of("recursoId", 999999, "inicio", local("2026-10-21T08:00"),
                "fim", local("2026-10-21T12:00"), "motivo", "Manutenção");
        enviar("POST", adm, "/api/bloqueios", inexistente).andExpect(status().isNotFound());

        jdbc.update("update recursos set ativo = false where id = ?", salaA);
        Map<String, Object> inativo = Map.of("recursoId", salaA, "inicio", local("2026-10-21T08:00"),
                "fim", local("2026-10-21T12:00"), "motivo", "Manutenção");
        enviar("POST", adm, "/api/bloqueios", inativo).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RECURSO_INATIVO"));

        assertThat(contar("select count(*) from bloqueios_manutencao")).isZero();
    }

    @Test
    void bloqueioSemMotivoOuComPeriodoInvalidoEhRecusado() throws Exception {
        enviar("POST", adm, "/api/bloqueios", Map.of("recursoId", salaA, "inicio", local("2026-10-21T08:00"),
                "fim", local("2026-10-21T12:00"), "motivo", "  ")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MOTIVO_OBRIGATORIO"));
        enviar("POST", adm, "/api/bloqueios", Map.of("recursoId", salaA, "inicio", local("2026-10-21T12:00"),
                "fim", local("2026-10-21T08:00"), "motivo", "Manutenção")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PERIODO_INVALIDO"));

        assertThat(contar("select count(*) from bloqueios_manutencao")).isZero();
    }

    @Test
    void levantarBloqueioInexistenteOuJaLevantadoNaoGeraSegundoEvento() throws Exception {
        enviar("POST", adm, "/api/bloqueios/999999/levantamento", Map.of("motivo", "Fim")).andExpect(status().isNotFound());

        String corpo = enviar("POST", adm, "/api/bloqueios", Map.of("recursoId", salaA,
                "inicio", local("2026-10-21T08:00"), "fim", local("2026-10-21T12:00"), "motivo", "Manutenção"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(corpo).get("id").asLong();
        enviar("POST", adm, "/api/bloqueios/" + id + "/levantamento", Map.of("motivo", "Concluída"))
                .andExpect(status().isOk());
        enviar("POST", adm, "/api/bloqueios/" + id + "/levantamento", Map.of("motivo", "Concluída de novo"))
                .andExpect(status().isOk());

        assertThat(contar("select count(*) from auditoria_eventos where acao = 'BLOQUEIO_LEVANTADO'")).isEqualTo(1);
    }

    // ---- recursos

    @Test
    void consultaDeRecursoInexistenteEIntervaloInvalidoSaoRecusados() throws Exception {
        mvc.perform(get("/api/recursos/999999").header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NAO_ENCONTRADO"));
        mvc.perform(get("/api/recursos").param("inicio", local("2026-10-21T14:00"))
                        .header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/recursos").param("inicio", local("2026-10-21T16:00"))
                        .param("fim", local("2026-10-21T14:00")).header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/recursos/" + salaA + "/ocupacoes").param("inicio", local("2026-10-21T16:00"))
                        .param("fim", local("2026-10-21T14:00")).header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void alterarRestritoParaOMesmoValorNaoGeraEventoENaoAlteraNada() throws Exception {
        long antes = contar("select count(*) from auditoria_eventos");

        enviar("PUT", adm, "/api/recursos/" + salaA + "/restrito", Map.of("restrito", false))
                .andExpect(status().isOk()).andExpect(jsonPath("$.restrito").value(false));

        assertThat(contar("select count(*) from auditoria_eventos")).isEqualTo(antes);
    }

    @Test
    void desativarRecursoJaDesativadoEhIdempotenteESemSegundoEvento() throws Exception {
        enviar("POST", adm, "/api/recursos/" + notebook + "/desativacao", Map.of()).andExpect(status().isOk());
        enviar("POST", adm, "/api/recursos/" + notebook + "/desativacao", Map.of()).andExpect(status().isOk());

        assertThat(contar("select count(*) from auditoria_eventos where acao = 'RECURSO_DESATIVADO'")).isEqualTo(1);
    }

    // ---- reservas

    @Test
    void reservaComRecursoInexistenteOuInativoOuSemRecursoEhRecusada() throws Exception {
        enviar("POST", s1, "/api/reservas", reserva(999999)).andExpect(status().isNotFound());
        jdbc.update("update recursos set ativo = false where id = ?", notebook);
        enviar("POST", s1, "/api/reservas", reserva(notebook)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RECURSO_INATIVO"));
        enviar("POST", s1, "/api/reservas", reserva()).andExpect(status().isBadRequest());

        assertThat(contar("select count(*) from reservas")).isZero();
    }

    @Test
    void alterarReservaSemMudancaNaoGeraEventoENaoBateEmReservaInexistente() throws Exception {
        String corpo = enviar("POST", s1, "/api/reservas", reserva(salaA)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(corpo).get("id").asLong();
        long antes = contar("select count(*) from auditoria_eventos where acao = 'RESERVA_ALTERADA'");

        enviar("PUT", s1, "/api/reservas/" + id, Map.of("titulo", "Aula de teste")).andExpect(status().isOk());
        enviar("PUT", s1, "/api/reservas/999999", Map.of("titulo", "Outro")).andExpect(status().isNotFound());
        enviar("POST", s1, "/api/reservas/999999/cancelamento", Map.of()).andExpect(status().isNotFound());

        assertThat(contar("select count(*) from auditoria_eventos where acao = 'RESERVA_ALTERADA'"))
                .isEqualTo(antes);
    }

    @Test
    void alterarReservaTrocandoDeRecursoEPeriodoAtualizaAsOcupacoes() throws Exception {
        long salaB = salaSql("Sala B", false);
        String corpo = enviar("POST", s1, "/api/reservas", reserva(salaA)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(corpo).get("id").asLong();

        Map<String, Object> nova = new LinkedHashMap<>();
        nova.put("recursoIds", List.of(salaB));
        nova.put("inicio", local("2026-10-22T09:00"));
        nova.put("fim", local("2026-10-22T11:00"));
        enviar("PUT", s1, "/api/reservas/" + id, nova).andExpect(status().isOk())
                .andExpect(jsonPath("$.recursoIds[0]").value(salaB));

        assertThat(contar("select count(*) from ocupacoes where reserva_id = ? and recurso_id = ? and ativa",
                id, salaB)).isEqualTo(1);
        assertThat(contar("select count(*) from ocupacoes where reserva_id = ? and recurso_id = ?", id, salaA))
                .isZero();
    }

    // ---- autenticação e usuários

    @Test
    void usuarioInativoNaoEntraEEmailEhNormalizado() throws Exception {
        jdbc.update("update usuarios set ativo = false where id = ?", idS1);

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"S1@EXEMPLO.TEST\",\"senha\":\"" + SENHA_DE_TESTE + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("CREDENCIAIS_INVALIDAS"));
    }

    @Test
    void emailEmMaiusculasEntraQuandoOUsuarioEstaAtivo() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"  S1@EXEMPLO.TEST \",\"senha\":\"" + SENHA_DE_TESTE + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.perfil").value("SOLICITANTE"));
    }

    @Test
    void usuariosAlterarPerfilParaOMesmoValorEOutrosCaminhosDeRecusa() throws Exception {
        long antes = contar("select count(*) from auditoria_eventos");
        enviar("PUT", adm, "/api/usuarios/" + idS1 + "/perfil", Map.of("perfil", "SOLICITANTE"))
                .andExpect(status().isOk());
        assertThat(contar("select count(*) from auditoria_eventos")).isEqualTo(antes);

        enviar("PUT", adm, "/api/usuarios/999999/perfil", Map.of("perfil", "RESPONSAVEL"))
                .andExpect(status().isNotFound());
        enviar("POST", adm, "/api/usuarios/999999/desativacao", Map.of()).andExpect(status().isNotFound());
        mvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(3)));
    }

    // ---- uso

    @Test
    void usoDeReservaInexistenteEMovimentacoesDeOutroUsuario() throws Exception {
        enviar("POST", r1, "/api/reservas/999999/inicio", Map.of()).andExpect(status().isNotFound());
        enviar("POST", r1, "/api/reservas/999999/conclusao", Map.of()).andExpect(status().isNotFound());
        mvc.perform(get("/api/reservas/999999/movimentacoes").header(HttpHeaders.AUTHORIZATION, bearer(r1)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/reservas/999999/historico").header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isNotFound());
        enviar("POST", r1, "/api/reservas/999999/aprovacao", Map.of()).andExpect(status().isNotFound());
        enviar("POST", r1, "/api/reservas/999999/rejeicao", Map.of("motivo", "x")).andExpect(status().isNotFound());
    }

    @Test
    void retiradaDuplicadaEDevolucaoForaDeEmUsoSaoRecusadas() throws Exception {
        String corpo = enviar("POST", s1, "/api/reservas", reserva(salaA, notebook)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(corpo).get("id").asLong();

        enviar("POST", r1, "/api/reservas/" + id + "/devolucoes", Map.of("materialId", notebook))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("TRANSICAO_PROIBIDA"));
        enviar("POST", r1, "/api/reservas/" + id + "/retiradas", Map.of("materialId", notebook))
                .andExpect(status().isOk());
        enviar("POST", r1, "/api/reservas/" + id + "/retiradas", Map.of("materialId", notebook))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("MATERIAL_JA_RETIRADO"));
        enviar("POST", r1, "/api/reservas/" + id + "/retiradas", Map.of("materialId", salaA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MATERIAL_FORA_DA_RESERVA"));

        assertThat(contar("select count(*) from movimentacoes_material where reserva_id = ?", id)).isEqualTo(1);
    }
}
