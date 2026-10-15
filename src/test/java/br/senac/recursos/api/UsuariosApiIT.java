package br.senac.recursos.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import br.senac.recursos.suporte.RelogioDeTesteConfig;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/** Gestão de usuários e perfis (RF-15, RN-16, RN-17, RN-29). CT-005, CT-012 a CT-016. */
class UsuariosApiIT extends ApiIT {

    private String novoUsuarioJson(String email, String perfil) {
        return "{\"nome\":\"Fulano de teste\",\"email\":\"" + email + "\",\"senha\":\"" + SENHA_DE_TESTE
                + "\",\"perfil\":\"" + perfil + "\"}";
    }

    private ResultActions criar(String token, String email, String perfil) throws Exception {
        return mvc.perform(post("/api/usuarios")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(novoUsuarioJson(email, perfil)));
    }

    private ResultActions desativar(String token, long id) throws Exception {
        return mvc.perform(post("/api/usuarios/" + id + "/desativacao")
                .header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }

    private long reservaFutura(long solicitante, String estado, Instant fim) {
        return jdbc.queryForObject(
                "insert into reservas (solicitante_id, titulo, inicio, fim, estado, exige_aprovacao, criada_em, atualizada_em) "
                        + "values (?, 'Aula de teste', ?, ?, cast(? as estado_reserva), false, now(), now()) returning id",
                Long.class, solicitante, java.sql.Timestamp.from(fim.minusSeconds(7200)),
                java.sql.Timestamp.from(fim), estado);
    }

    @Test
    void ct012_usuarioNasceComExatamenteUmPerfil() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        String token = login("a1@exemplo.test");

        criar(token, "r1@exemplo.test", "RESPONSAVEL")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.perfil").value("RESPONSAVEL"))
                .andExpect(jsonPath("$.id").isNumber());

        assertThat(contar("select count(*) from usuarios where email = 'r1@exemplo.test' and perfil = 'RESPONSAVEL'"))
                .isEqualTo(1);
    }

    @Test
    void ct012_segundoPerfilEhRecusado() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        long alvo = criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        String token = login("a1@exemplo.test");

        mvc.perform(put("/api/usuarios/" + alvo + "/perfil")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"perfil\":[\"RESPONSAVEL\",\"ADMINISTRADOR\"]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDACAO_FALHOU"));

        assertThat(contar("select count(*) from usuarios where id = ? and perfil = 'RESPONSAVEL'", alvo)).isEqualTo(1);
    }

    @Test
    void ct012_emailDuplicadoEhRecusado() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        String token = login("a1@exemplo.test");

        criar(token, "s1@exemplo.test", "SOLICITANTE")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USUARIO_JA_EXISTE"));
    }

    @Test
    void ct013_soOAdministradorGereUsuarios() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");

        for (String quem : new String[] {"s1@exemplo.test", "r1@exemplo.test"}) {
            String token = login(quem);
            criar(token, "novo-" + quem, "SOLICITANTE")
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
            mvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                    .andExpect(status().isForbidden());
        }

        assertThat(contar("select count(*) from usuarios")).isEqualTo(2);
    }

    @Test
    void ct014_doisOuMaisResponsaveisPodemSerCadastrados() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        String token = login("a1@exemplo.test");

        criar(token, "r1@exemplo.test", "RESPONSAVEL").andExpect(status().isCreated());
        criar(token, "r2@exemplo.test", "RESPONSAVEL").andExpect(status().isCreated());

        assertThat(contar("select count(*) from usuarios where perfil = 'RESPONSAVEL'")).isEqualTo(2);
    }

    @Test
    void ct015_desativacaoQueDeixariaMenosDeDoisResponsaveisEhRecusada() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        long r1 = criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r2@exemplo.test");
        String token = login("a1@exemplo.test");

        desativar(token, r1)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MINIMO_DE_RESPONSAVEIS"));

        assertThat(contar("select count(*) from usuarios where id = ? and ativo", r1)).isEqualTo(1);
    }

    @Test
    void ct015_desativacaoComReservaFuturaEhRecusadaComALista() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        long solicitante = criarUsuario("SOLICITANTE", "s1@exemplo.test");
        long reserva = reservaFutura(solicitante, "APROVADA", RelogioDeTesteConfig.INICIAL.plusSeconds(3600));
        String token = login("a1@exemplo.test");

        desativar(token, solicitante)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USUARIO_COM_RESERVA_FUTURA"))
                .andExpect(jsonPath("$.itens[0]").value(String.valueOf(reserva)));

        assertThat(contar("select count(*) from usuarios where id = ? and ativo", solicitante)).isEqualTo(1);
    }

    @Test
    void ct015_reservaFuturaEhATerminoPosteriorAoInstanteAtual() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        long terminaAgora = criarUsuario("SOLICITANTE", "s1@exemplo.test");
        long terminaDepois = criarUsuario("SOLICITANTE", "s2@exemplo.test");
        reservaFutura(terminaAgora, "EM_USO", RelogioDeTesteConfig.INICIAL);
        reservaFutura(terminaDepois, "EM_USO", RelogioDeTesteConfig.INICIAL.plusMillis(1));
        String token = login("a1@exemplo.test");

        desativar(token, terminaAgora).andExpect(status().isOk());
        desativar(token, terminaDepois).andExpect(status().isConflict());
    }

    @Test
    void ct005_desativarUsuarioRevogaAsSessoes() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        long alvo = jdbc.queryForObject("select id from usuarios where email = 's1@exemplo.test'", Long.class);
        String tokenAlvo = login("s1@exemplo.test");
        String tokenAdmin = login("a1@exemplo.test");

        desativar(tokenAdmin, alvo).andExpect(status().isOk()).andExpect(jsonPath("$.ativo").value(false));

        mvc.perform(get("/api/auth/eu").header(HttpHeaders.AUTHORIZATION, bearer(tokenAlvo)))
                .andExpect(status().isUnauthorized());
        assertThat(contar("select count(*) from sessoes where usuario_id = ? and revogada_em is not null", alvo))
                .isEqualTo(1);
    }

    @Test
    void ct016_cadaOperacaoDeUsuarioGeraUmEventoDeAuditoria() throws Exception {
        long admin = criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        String token = login("a1@exemplo.test");

        String corpo = criar(token, "s1@exemplo.test", "SOLICITANTE").andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(corpo).get("id").asLong();
        mvc.perform(put("/api/usuarios/" + id + "/perfil")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"perfil\":\"RESPONSAVEL\"}"))
                .andExpect(status().isOk());
        desativar(token, id).andExpect(status().isOk());

        assertThat(contar("select count(*) from auditoria_eventos where entidade = 'USUARIO' and entidade_id = ?", id))
                .isEqualTo(3);
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'USUARIO_CRIADO' and ator_id = ?", admin))
                .isEqualTo(1);
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'USUARIO_PERFIL_ALTERADO' "
                + "and valores_antes ->> 'perfil' = 'SOLICITANTE' and valores_depois ->> 'perfil' = 'RESPONSAVEL'"))
                .isEqualTo(1);
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'USUARIO_DESATIVADO'"))
                .isEqualTo(1);
        assertThat(contar("select count(*) from auditoria_eventos where valores_antes::text like '%senha%' "
                + "or valores_depois::text like '%senha%'"))
                .as("a trilha nunca guarda senha nem hash")
                .isZero();
    }
}
