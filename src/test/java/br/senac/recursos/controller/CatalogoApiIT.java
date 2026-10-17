package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import br.senac.recursos.suporte.RelogioDeTesteConfig;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/** Cadastro e pesquisa de recursos (RF-02, RF-03, RN-10, RN-12, RN-13, RN-32). CT-017 a CT-032. */
class CatalogoApiIT extends ApiIT {

    private String admin;
    private String solicitante;

    @BeforeEach
    void entra() throws Exception {
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        admin = login("a1@exemplo.test");
        solicitante = login("s1@exemplo.test");
    }

    // ---- apoio

    private static Map<String, Object> sala(String nome) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("nome", nome);
        m.put("capacidade", 30);
        m.put("localizacao", "Bloco A");
        m.put("tipoSala", "AULA");
        m.put("horaAbertura", "07:00");
        m.put("horaFechamento", "22:00");
        m.put("diasFuncionamento", List.of(1, 2, 3, 4, 5));
        return m;
    }

    private ResultActions postar(String token, String caminho, Object corpo) throws Exception {
        return mvc.perform(post(caminho)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(corpo)));
    }

    private long criarRecurso(String caminho, Object corpo) throws Exception {
        String resposta = postar(admin, caminho, corpo).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("id").asLong();
    }

    private long criarSala(String nome) throws Exception {
        return criarRecurso("/api/salas", sala(nome));
    }

    private long criarMaterial(String nome, String patrimonio, boolean restrito) throws Exception {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("nome", nome);
        m.put("codigoPatrimonio", patrimonio);
        m.put("restrito", restrito);
        return criarRecurso("/api/materiais", m);
    }

    private ResultActions buscar(String token, String consulta) throws Exception {
        return mvc.perform(get("/api/recursos" + consulta).header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }

    private ResultActions desativar(long id) throws Exception {
        return mvc.perform(post("/api/recursos/" + id + "/desativacao")
                .header(HttpHeaders.AUTHORIZATION, bearer(admin)));
    }

    private long reservaComOcupacao(long recurso, String estado, Instant inicio, Instant fim, boolean exigeAprovacao) {
        long solicitante = jdbc.queryForObject("select id from usuarios where email = 's1@exemplo.test'", Long.class);
        long reserva = jdbc.queryForObject(
                "insert into reservas (solicitante_id, titulo, inicio, fim, estado, exige_aprovacao, criada_em, atualizada_em) "
                        + "values (?, 'Aula de teste', ?, ?, cast(? as estado_reserva), ?, now(), now()) returning id",
                Long.class, solicitante, java.sql.Timestamp.from(inicio), java.sql.Timestamp.from(fim), estado,
                exigeAprovacao);
        boolean ativa = List.of("SOLICITADA", "APROVADA", "EM_USO").contains(estado);
        jdbc.update("insert into ocupacoes (recurso_id, periodo, reserva_id, ativa) "
                        + "values (?, tstzrange(?, ?, '[)'), ?, ?)",
                recurso, java.sql.Timestamp.from(inicio), java.sql.Timestamp.from(fim), reserva, ativa);
        return reserva;
    }

    private static Instant instante(String iso) {
        return Instant.parse(iso);
    }

    // ---- RF-02

    @ParameterizedTest(name = "sem {0}")
    @ValueSource(strings = {"capacidade", "localizacao", "horaAbertura", "horaFechamento", "diasFuncionamento"})
    void ct017_salaExigeTodosOsCampos(String ausente) throws Exception {
        Map<String, Object> corpo = sala("Sala A");
        corpo.remove(ausente);

        postar(admin, "/api/salas", corpo)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDACAO_FALHOU"));

        assertThat(contar("select count(*) from salas")).isZero();
    }

    @Test
    void ct017_salaSemNenhumDiaDeFuncionamentoEhRecusada() throws Exception {
        Map<String, Object> corpo = sala("Sala A");
        corpo.put("diasFuncionamento", List.of());

        postar(admin, "/api/salas", corpo).andExpect(status().isBadRequest());

        assertThat(contar("select count(*) from salas")).isZero();
    }

    @Test
    void ct018_salaValidaApareceNaConsultaComOsAtributosInformados() throws Exception {
        long id = criarSala("Sala A");

        mvc.perform(get("/api/recursos/" + id).header(HttpHeaders.AUTHORIZATION, bearer(solicitante)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Sala A"))
                .andExpect(jsonPath("$.tipo").value("SALA"))
                .andExpect(jsonPath("$.capacidade").value(30))
                .andExpect(jsonPath("$.localizacao").value("Bloco A"))
                .andExpect(jsonPath("$.horaAbertura").value("07:00"))
                .andExpect(jsonPath("$.horaFechamento").value("22:00"))
                .andExpect(jsonPath("$.diasFuncionamento", hasSize(5)))
                .andExpect(jsonPath("$.restrito").value(false))
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    void ct019_materialExigePatrimonioUnico() throws Exception {
        Map<String, Object> semPatrimonio = new LinkedHashMap<>();
        semPatrimonio.put("nome", "Notebook N-001");
        postar(admin, "/api/materiais", semPatrimonio).andExpect(status().isBadRequest());

        criarMaterial("Notebook N-001", "PAT-0001", false);

        Map<String, Object> repetido = new LinkedHashMap<>();
        repetido.put("nome", "Notebook N-002");
        repetido.put("codigoPatrimonio", "PAT-0001");
        postar(admin, "/api/materiais", repetido)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PATRIMONIO_JA_EXISTE"));

        assertThat(contar("select count(*) from materiais")).isEqualTo(1);
    }

    @Test
    void ct020_professorPodeSerCadastradoSemUsuario() throws Exception {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("nome", "Professor 1");
        corpo.put("competencias", List.of("Banco de dados", "Qualidade de software"));

        long id = criarRecurso("/api/professores", corpo);

        assertThat(contar("select count(*) from professores where recurso_id = ? and usuario_id is null", id))
                .isEqualTo(1);
        assertThat(contar("select count(*) from professor_competencias where professor_id = ?", id)).isEqualTo(2);
    }

    @Test
    void ct021_vinculoComUsuarioNaoAlteraOPerfil() throws Exception {
        long usuario = jdbc.queryForObject("select id from usuarios where email = 's1@exemplo.test'", Long.class);
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("nome", "Professor 2");
        corpo.put("usuarioId", usuario);

        long id = criarRecurso("/api/professores", corpo);

        assertThat(contar("select count(*) from professores where recurso_id = ? and usuario_id = ?", id, usuario))
                .isEqualTo(1);
        assertThat(contar("select count(*) from usuarios where id = ? and perfil = 'SOLICITANTE'", usuario))
                .isEqualTo(1);
    }

    @Test
    void ct022_alterarRestritoNaoAlteraReservasExistentes() throws Exception {
        long projetor = criarMaterial("Projetor P-001", "PAT-P001", true);
        reservaComOcupacao(projetor, "SOLICITADA", instante("2026-10-21T17:00:00Z"),
                instante("2026-10-21T19:00:00Z"), true);

        mvc.perform(put("/api/recursos/" + projetor + "/restrito")
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"restrito\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restrito").value(false));

        assertThat(contar("select count(*) from reservas where exige_aprovacao")).isEqualTo(1);
    }

    @Test
    void ct023_desativarRecursoComReservaFuturaEhRecusadoComALista() throws Exception {
        long salaA = criarSala("Sala A");
        long reserva = reservaComOcupacao(salaA, "APROVADA", instante("2026-10-20T17:00:00Z"),
                instante("2026-10-20T19:00:00Z"), false);

        desativar(salaA)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RECURSO_COM_RESERVA_FUTURA"))
                .andExpect(jsonPath("$.itens[0]").value(String.valueOf(reserva)));

        assertThat(contar("select count(*) from recursos where id = ? and ativo", salaA)).isEqualTo(1);
    }

    @Test
    void ct024_reservaFuturaEhATerminoPosteriorAoInstanteAtual() throws Exception {
        long terminaAgora = criarSala("Sala termina agora");
        long terminaDepois = criarSala("Sala termina depois");
        Instant agora = RelogioDeTesteConfig.INICIAL;
        reservaComOcupacao(terminaAgora, "EM_USO", agora.minusSeconds(3600), agora, false);
        reservaComOcupacao(terminaDepois, "EM_USO", agora.minusSeconds(3600), agora.plusMillis(1), false);

        desativar(terminaAgora).andExpect(status().isOk());
        desativar(terminaDepois).andExpect(status().isConflict());
    }

    @Test
    void ct025_desativarSemReservaFuturaRemoveDasBuscasMasMantemHistorico() throws Exception {
        long notebook = criarMaterial("Notebook N-001", "PAT-0001", false);
        reservaComOcupacao(notebook, "CONCLUIDA", instante("2026-10-13T17:00:00Z"),
                instante("2026-10-13T19:00:00Z"), false);

        desativar(notebook).andExpect(status().isOk()).andExpect(jsonPath("$.ativo").value(false));

        buscar(solicitante, "?tipo=MATERIAL").andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
        assertThat(contar("select count(*) from reservas where estado = 'CONCLUIDA'")).isEqualTo(1);
    }

    @Test
    void ct026_cadaOperacaoDeCadastroGeraUmEventoDeAuditoria() throws Exception {
        long id = criarSala("Sala A");
        mvc.perform(put("/api/recursos/" + id + "/restrito")
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"restrito\":true}"))
                .andExpect(status().isOk());
        desativar(id).andExpect(status().isOk());

        assertThat(contar("select count(*) from auditoria_eventos where entidade = 'RECURSO' and entidade_id = ?", id))
                .isEqualTo(3);
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'RECURSO_CRIADO' and entidade_id = ?", id))
                .isEqualTo(1);
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'RECURSO_RESTRICAO_ALTERADA' "
                + "and valores_antes ->> 'restrito' = 'false' and valores_depois ->> 'restrito' = 'true'"))
                .isEqualTo(1);
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'RECURSO_DESATIVADO'")).isEqualTo(1);
    }

    @Test
    void soOAdministradorCadastraRecursos() throws Exception {
        postar(solicitante, "/api/salas", sala("Sala A"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));

        assertThat(contar("select count(*) from recursos")).isZero();
    }

    // ---- RF-03

    @Test
    void ct027_filtroPorTipoCapacidadeLocalizacaoECompetencia() throws Exception {
        Map<String, Object> grande = sala("Sala grande");
        grande.put("capacidade", 60);
        grande.put("localizacao", "Bloco B");
        criarRecurso("/api/salas", grande);
        criarSala("Sala pequena");
        criarMaterial("Notebook N-001", "PAT-0001", false);
        Map<String, Object> professor = new LinkedHashMap<>();
        professor.put("nome", "Professor 1");
        professor.put("competencias", List.of("Banco de dados"));
        criarRecurso("/api/professores", professor);

        buscar(solicitante, "?tipo=SALA").andExpect(jsonPath("$", hasSize(2)));
        buscar(solicitante, "?tipo=MATERIAL").andExpect(jsonPath("$", hasSize(1)));
        buscar(solicitante, "?tipo=SALA&capacidadeMinima=50")
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nome").value("Sala grande"));
        buscar(solicitante, "?tipo=SALA&localizacao=Bloco B")
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nome").value("Sala grande"));
        buscar(solicitante, "?tipo=PROFESSOR&competencia=Banco de dados")
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nome").value("Professor 1"));
        buscar(solicitante, "?tipo=PROFESSOR&competencia=Inexistente")
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void ct028_disponibilidadeRespeitaAFronteiraSemiaberta() throws Exception {
        long salaA = criarSala("Sala A");
        reservaComOcupacao(salaA, "APROVADA", instante("2026-10-20T17:00:00Z"),
                instante("2026-10-20T19:00:00Z"), false);   // 14:00 às 16:00 locais

        // termina às 16:00 locais e a consulta começa às 16:00: devolvida
        buscar(solicitante, "?tipo=SALA&inicio=2026-10-20T19:00:00Z&fim=2026-10-20T21:00:00Z")
                .andExpect(jsonPath("$", hasSize(1)));
        // um instante de sobreposição: não devolvida
        buscar(solicitante, "?tipo=SALA&inicio=2026-10-20T18:59:59.999Z&fim=2026-10-20T21:00:00Z")
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void ct029_bloqueioQueCobreOIntervaloTiraARecursoDaDisponibilidade() throws Exception {
        long salaA = criarSala("Sala A");
        long bloqueio = jdbc.queryForObject(
                "insert into bloqueios_manutencao (recurso_id, inicio, fim, motivo, criado_por_id, criado_em) "
                        + "values (?, ?, ?, 'Manutenção de teste', (select id from usuarios where email = 'a1@exemplo.test'), now()) "
                        + "returning id",
                Long.class, salaA, java.sql.Timestamp.from(instante("2026-10-21T11:00:00Z")),
                java.sql.Timestamp.from(instante("2026-10-21T15:00:00Z")));
        jdbc.update("insert into ocupacoes (recurso_id, periodo, bloqueio_id, ativa) values (?, tstzrange(?, ?, '[)'), ?, true)",
                salaA, java.sql.Timestamp.from(instante("2026-10-21T11:00:00Z")),
                java.sql.Timestamp.from(instante("2026-10-21T15:00:00Z")), bloqueio);

        buscar(solicitante, "?tipo=SALA&inicio=2026-10-21T14:00:00Z&fim=2026-10-21T16:00:00Z")
                .andExpect(jsonPath("$", hasSize(0)));
        buscar(solicitante, "?tipo=SALA&inicio=2026-10-21T15:00:00Z&fim=2026-10-21T16:00:00Z")
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void ct031_ocupacaoNaoIdentificaODono() throws Exception {
        long salaA = criarSala("Sala A");
        reservaComOcupacao(salaA, "APROVADA", instante("2026-10-20T17:00:00Z"),
                instante("2026-10-20T19:00:00Z"), false);

        String corpo = mvc.perform(get("/api/recursos/" + salaA + "/ocupacoes"
                                + "?inicio=2026-10-20T00:00:00Z&fim=2026-10-21T00:00:00Z")
                        .header(HttpHeaders.AUTHORIZATION, bearer(solicitante)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andReturn().getResponse().getContentAsString();

        JsonNode item = json.readTree(corpo).get(0);
        assertThat(item.has("inicio")).isTrue();
        assertThat(item.has("fim")).isTrue();
        assertThat(corpo).doesNotContain("solicitante").doesNotContain("s1@exemplo.test")
                .doesNotContain("reservaId").doesNotContain("titulo");
    }

    @Test
    void ct032_recursoDesativadoNaoApareceNasBuscas() throws Exception {
        long n1 = criarMaterial("Notebook N-001", "PAT-0001", false);
        criarMaterial("Notebook N-002", "PAT-0002", false);
        desativar(n1).andExpect(status().isOk());

        buscar(solicitante, "?tipo=MATERIAL")
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nome").value("Notebook N-002"));
    }
}
