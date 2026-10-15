package br.senac.recursos.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
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

/**
 * Reservas: criação, conflito, alteração e cancelamento (RF-04, RF-05, RN-01 a RN-04, RN-09 a RN-11,
 * RN-13 a RN-15, RN-17 a RN-19, RN-27, RN-30). CT-030, CT-035, CT-038, CT-040 a CT-050, CT-052 a CT-059, CT-065.
 * Data de referência: 21/10/2026 (quarta). Relógio de teste: 20/10/2026 às 14:00 locais.
 */
class ReservasApiIT extends ApiIT {

    private long idSolicitante1;
    private long idSolicitante2;
    private String s1;
    private String s2;
    private String r1;
    private String adm;
    private long salaA;
    private long salaB;
    private long projetor;
    private long notebook;

    @BeforeEach
    void cenario() throws Exception {
        idSolicitante1 = criarUsuario("SOLICITANTE", "s1@exemplo.test");
        idSolicitante2 = criarUsuario("SOLICITANTE", "s2@exemplo.test");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        s1 = login("s1@exemplo.test");
        s2 = login("s2@exemplo.test");
        r1 = login("r1@exemplo.test");
        adm = login("a1@exemplo.test");
        salaA = salaSql("Sala A", false);
        salaB = salaSql("Sala B", false);
        projetor = materialSql("Projetor P-001", "PAT-P001", true);
        notebook = materialSql("Notebook N-001", "PAT-N001", false);
    }

    // ---- apoio

    private Map<String, Object> corpo(String inicioLocal, String fimLocal, long... recursos) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("titulo", "Aula de teste");
        m.put("inicio", local(inicioLocal));
        m.put("fim", local(fimLocal));
        m.put("recursoIds", java.util.Arrays.stream(recursos).boxed().toList());
        return m;
    }

    private ResultActions criar(String token, Map<String, Object> corpo) throws Exception {
        return mvc.perform(post("/api/reservas")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(corpo)));
    }

    private long criarOk(String token, String inicio, String fim, long... recursos) throws Exception {
        String resposta = criar(token, corpo(inicio, fim, recursos)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("id").asLong();
    }

    private ResultActions alterar(String token, long id, Map<String, Object> corpo) throws Exception {
        return mvc.perform(put("/api/reservas/" + id)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(corpo)));
    }

    private ResultActions cancelar(String token, long id, String motivo) throws Exception {
        String conteudo = motivo == null ? "{}" : json.writeValueAsString(Map.of("motivo", motivo));
        return mvc.perform(post("/api/reservas/" + id + "/cancelamento")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(conteudo));
    }

    private String estado(long id) {
        return jdbc.queryForObject("select estado::text from reservas where id = ?", String.class, id);
    }

    private void forcarEstado(long id, String estado) {
        jdbc.update("update reservas set estado = cast(? as estado_reserva) where id = ?", estado, id);
    }

    private void bloqueio(long recurso, String inicioLocal, String fimLocal) {
        long adm = jdbc.queryForObject("select id from usuarios where email = 'a1@exemplo.test'", Long.class);
        long b = jdbc.queryForObject(
                "insert into bloqueios_manutencao (recurso_id, inicio, fim, motivo, criado_por_id, criado_em) "
                        + "values (?, ?, ?, 'Manutenção de teste', ?, now()) returning id",
                Long.class, recurso, java.sql.Timestamp.from(Instant.parse(local(inicioLocal))),
                java.sql.Timestamp.from(Instant.parse(local(fimLocal))), adm);
        jdbc.update("insert into ocupacoes (recurso_id, periodo, bloqueio_id, ativa) values (?, tstzrange(?, ?, '[)'), ?, true)",
                recurso, java.sql.Timestamp.from(Instant.parse(local(inicioLocal))),
                java.sql.Timestamp.from(Instant.parse(local(fimLocal))), b);
    }

    // ---- criação

    @Test
    void ct038_armazenaEmUtcEDevolveOMesmoInstante() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA);

        String inicioNoBanco = jdbc.queryForObject(
                "select to_char(inicio at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') from reservas where id = ?",
                String.class, id);
        assertThat(inicioNoBanco).isEqualTo("2026-10-21T17:00:00Z");
        mvc.perform(get("/api/reservas/" + id).header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inicio").value("2026-10-21T17:00:00Z"));
    }

    @Test
    void ct040_semRecursoRestritoVaiASolicitadaEDepoisAAprovadaPeloSistema() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, notebook);

        assertThat(estado(id)).isEqualTo("APROVADA");
        assertThat(contar("select count(*) from auditoria_eventos where entidade = 'RESERVA' and entidade_id = ?", id))
                .isEqualTo(2);
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'RESERVA_CRIADA' and ator_tipo = 'USUARIO' "
                + "and ator_id = ? and estado_novo = 'SOLICITADA'", idSolicitante1)).isEqualTo(1);
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'RESERVA_APROVADA' and ator_tipo = 'SISTEMA' "
                + "and ator_id is null and estado_anterior = 'SOLICITADA' and estado_novo = 'APROVADA'")).isEqualTo(1);
        assertThat(contar("select count(*) from ocupacoes where reserva_id = ? and ativa", id)).isEqualTo(2);
    }

    @Test
    void ct041_comRecursoRestritoPermaneceSolicitada() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);

        assertThat(estado(id)).isEqualTo("SOLICITADA");
        assertThat(contar("select count(*) from reservas where id = ? and exige_aprovacao", id)).isEqualTo(1);
    }

    @Test
    void ct042_valorEnviadoPeloClienteParaExigeAprovacaoEhIgnorado() throws Exception {
        Map<String, Object> c = corpo("2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);
        c.put("exigeAprovacao", false);
        c.put("estado", "APROVADA");

        String resposta = criar(s1, c).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long id = json.readTree(resposta).get("id").asLong();
        assertThat(contar("select count(*) from reservas where id = ? and exige_aprovacao and estado = 'SOLICITADA'", id))
                .isEqualTo(1);
    }

    @Test
    void ct043_administradorNaoCriaReserva() throws Exception {
        criar(adm, corpo("2026-10-21T14:00", "2026-10-21T16:00", salaA))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));

        assertThat(contar("select count(*) from reservas")).isZero();
    }

    @Test
    void ct044_responsavelTambemCriaReserva() throws Exception {
        long id = criarOk(r1, "2026-10-21T14:00", "2026-10-21T16:00", salaA);

        assertThat(contar("select count(*) from reservas where id = ? and solicitante_id = "
                + "(select id from usuarios where email = 'r1@exemplo.test')", id)).isEqualTo(1);
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"SALA", "PROFESSOR", "MATERIAL"})
    void ct035_conflitoEFronteiraValemParaOsTresTipos(String tipo) throws Exception {
        long recurso = switch (tipo) {
            case "SALA" -> salaA;
            case "PROFESSOR" -> professorSql("Professor X", null);
            default -> notebook;
        };
        criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", recurso);

        criar(s2, corpo("2026-10-21T15:00", "2026-10-21T17:00", recurso))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLITO_DE_ALOCACAO"));
        criar(s2, corpo("2026-10-21T15:59", "2026-10-21T18:00", recurso)).andExpect(status().isConflict());
        criar(s2, corpo("2026-10-21T16:00", "2026-10-21T18:00", recurso)).andExpect(status().isCreated());
        criar(s2, corpo("2026-10-21T12:00", "2026-10-21T14:00", recurso)).andExpect(status().isCreated());
    }

    @Test
    void ct036_reservaForaDaJanelaOuEmDiaSemFuncionamentoEhRecusada() throws Exception {
        criar(s1, corpo("2026-10-21T06:00", "2026-10-21T08:00", salaA))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("FORA_DA_JANELA"));
        criar(s1, corpo("2026-10-21T21:00", "2026-10-21T23:00", salaA))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("FORA_DA_JANELA"));
        criar(s1, corpo("2026-10-24T10:00", "2026-10-24T12:00", salaA))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("DIA_SEM_FUNCIONAMENTO"));
        criar(s1, corpo("2026-10-21T23:00", "2026-10-22T01:00", salaA))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("CRUZA_MEIA_NOITE"));
        criar(s1, corpo("2026-10-21T07:00", "2026-10-21T22:00", salaA)).andExpect(status().isCreated());

        assertThat(contar("select count(*) from reservas")).isEqualTo(1);
    }

    @Test
    void ct036_professorEMaterialNaoTemJanela() throws Exception {
        criar(s1, corpo("2026-10-24T22:00", "2026-10-25T02:00", notebook)).andExpect(status().isCreated());
    }

    @Test
    void ct030_disponibilidadeRespeitaJanelaEDiaDeFuncionamento() throws Exception {
        mvc.perform(get("/api/recursos").header(HttpHeaders.AUTHORIZATION, bearer(s1))
                        .param("tipo", "SALA").param("inicio", local("2026-10-21T06:00")).param("fim", local("2026-10-21T08:00")))
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/recursos").header(HttpHeaders.AUTHORIZATION, bearer(s1))
                        .param("tipo", "SALA").param("inicio", local("2026-10-24T10:00")).param("fim", local("2026-10-24T12:00")))
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/recursos").header(HttpHeaders.AUTHORIZATION, bearer(s1))
                        .param("tipo", "SALA").param("inicio", local("2026-10-21T14:00")).param("fim", local("2026-10-21T16:00")))
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void ct057_professorOcupadoRecusaAReservaDeOutraSalaEIdentificaOProfessor() throws Exception {
        long professor = professorSql("Professor 1", null);
        criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, professor);

        criar(s2, corpo("2026-10-21T15:00", "2026-10-21T17:00", salaB, professor))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLITO_DE_ALOCACAO"))
                .andExpect(jsonPath("$.itens[0]").value(String.valueOf(professor)));

        assertThat(contar("select count(*) from reservas")).isEqualTo(1);
        assertThat(contar("select count(*) from tentativas_conflito where recurso_id = ? and motivo = 'SOBREPOSICAO'",
                professor)).isEqualTo(1);
    }

    @Test
    void ct058_professorVinculadoPodeSerAlocadoPeloProprioSolicitanteEAAgendaContinuaSobRn02() throws Exception {
        long professor2 = professorSql("Professor 2", idSolicitante1);

        criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, professor2);
        criar(s1, corpo("2026-10-21T14:00", "2026-10-21T16:00", salaB, professor2))
                .andExpect(status().isConflict());
    }

    @Test
    void ct059ECt065_cadaRecusaPorConflitoGravaUmaTentativaMesmoSemReserva() throws Exception {
        criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA);

        criar(s2, corpo("2026-10-21T15:00", "2026-10-21T17:00", salaA)).andExpect(status().isConflict());

        assertThat(contar("select count(*) from reservas")).isEqualTo(1);
        assertThat(contar("select count(*) from tentativas_conflito where recurso_id = ? and solicitante_id = ? "
                + "and motivo = 'SOBREPOSICAO'", salaA, idSolicitante2)).isEqualTo(1);
    }

    @Test
    void ct081_reservaEmRecursoEmManutencaoEhRecusadaComMotivoMANUTENCAO() throws Exception {
        bloqueio(salaA, "2026-10-21T08:00", "2026-10-21T12:00");

        criar(s1, corpo("2026-10-21T11:00", "2026-10-21T13:00", salaA))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RECURSO_EM_MANUTENCAO"));
        criar(s1, corpo("2026-10-21T12:00", "2026-10-21T14:00", salaA)).andExpect(status().isCreated());

        assertThat(contar("select count(*) from tentativas_conflito where recurso_id = ? and motivo = 'MANUTENCAO'",
                salaA)).isEqualTo(1);
    }

    @Test
    void ct033_terminoIgualAoInicioEhRecusadoESemGravacao() throws Exception {
        criar(s1, corpo("2026-10-21T14:00", "2026-10-21T14:00", salaA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PERIODO_INVALIDO"));

        assertThat(contar("select count(*) from reservas")).isZero();
    }

    @Test
    void ct039_inicioNoPassadoEhRecusado() throws Exception {
        criar(s1, corpo("2026-10-20T13:00", "2026-10-20T15:00", salaA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INICIO_NO_PASSADO"));
        criar(s1, corpo("2026-10-20T14:00", "2026-10-20T16:00", salaA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INICIO_NO_PASSADO"));
    }

    // ---- alteração

    @Test
    void ct045_alterarSoOTituloNaoReaprovaEGeraUmEvento() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA);
        long antes = contar("select count(*) from auditoria_eventos where acao = 'RESERVA_ALTERADA'");

        alterar(s1, id, Map.of("titulo", "Aula de revisão")).andExpect(status().isOk());

        assertThat(estado(id)).isEqualTo("APROVADA");
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'RESERVA_ALTERADA' and entidade_id = ?", id))
                .isEqualTo(antes + 1);
    }

    @Test
    void ct046_alterarPeriodoDeReservaQueExigiaAprovacaoVoltaASolicitada() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);
        forcarEstado(id, "APROVADA");

        alterar(s1, id, Map.of("inicio", local("2026-10-21T15:00"), "fim", local("2026-10-21T17:00")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("SOLICITADA"));

        assertThat(estado(id)).isEqualTo("SOLICITADA");
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'RESERVA_ALTERADA' and entidade_id = ? "
                + "and estado_anterior = 'APROVADA' and estado_novo = 'SOLICITADA'", id)).isEqualTo(1);
    }

    @Test
    void ct047_alteracaoComConflitoNaoMudaNada() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaB);
        criarOk(s2, "2026-10-21T15:00", "2026-10-21T17:00", salaA);
        String inicioAntes = jdbc.queryForObject("select inicio::text from reservas where id = ?", String.class, id);

        alterar(s1, id, Map.of("recursoIds", List.of(salaA), "inicio", local("2026-10-21T15:00"),
                "fim", local("2026-10-21T17:00")))
                .andExpect(status().isConflict());

        assertThat(jdbc.queryForObject("select inicio::text from reservas where id = ?", String.class, id))
                .isEqualTo(inicioAntes);
        assertThat(contar("select count(*) from ocupacoes where reserva_id = ? and recurso_id = ? and ativa", id, salaB))
                .isEqualTo(1);
        assertThat(contar("select count(*) from ocupacoes where reserva_id = ?", id)).isEqualTo(1);
    }

    @Test
    void ct048_acrescentarRecursoRestritoRecalculaEReaprova() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA);
        assertThat(estado(id)).isEqualTo("APROVADA");

        Map<String, Object> c = new LinkedHashMap<>();
        c.put("recursoIds", List.of(salaA, projetor));
        c.put("exigeAprovacao", false);
        alterar(s1, id, c).andExpect(status().isOk());

        assertThat(estado(id)).isEqualTo("SOLICITADA");
        assertThat(contar("select count(*) from reservas where id = ? and exige_aprovacao", id)).isEqualTo(1);
    }

    @Test
    void ct049_removerOUltimoRecursoRestritoAprovaPeloSistema() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);
        assertThat(estado(id)).isEqualTo("SOLICITADA");

        alterar(s1, id, Map.of("recursoIds", List.of(salaA))).andExpect(status().isOk());

        assertThat(estado(id)).isEqualTo("APROVADA");
        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? and acao = 'RESERVA_APROVADA' "
                + "and ator_tipo = 'SISTEMA'", id)).isEqualTo(2);
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"EM_USO", "CONCLUIDA", "CANCELADA"})
    void ct050_alteracaoEmUsoOuTerminalEhRecusada(String estadoForcado) throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA);
        forcarEstado(id, estadoForcado);

        alterar(s1, id, Map.of("titulo", "Outro título"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSICAO_PROIBIDA"));

        assertThat(jdbc.queryForObject("select titulo from reservas where id = ?", String.class, id))
                .isEqualTo("Aula de teste");
    }

    @Test
    void alteracaoSoPeloDono() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA);

        alterar(s2, id, Map.of("titulo", "Invasão")).andExpect(status().isForbidden());
    }

    // ---- cancelamento

    @Test
    void ct052_donoCancelaSolicitadaSemMotivo() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);

        cancelar(s1, id, null).andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("CANCELADA"));

        assertThat(estado(id)).isEqualTo("CANCELADA");
        assertThat(contar("select count(*) from ocupacoes where reserva_id = ? and ativa", id)).isZero();
    }

    @Test
    void ct054_administradorCancelaComMotivoObrigatorio() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);

        cancelar(adm, id, null).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MOTIVO_OBRIGATORIO"));
        assertThat(estado(id)).isEqualTo("SOLICITADA");

        cancelar(adm, id, "Evento institucional").andExpect(status().isOk());
        assertThat(estado(id)).isEqualTo("CANCELADA");
    }

    @Test
    void ct052_responsavelNaoCancelaSolicitadaDeOutroUsuario() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);

        cancelar(r1, id, "Sem autoridade").andExpect(status().isForbidden());

        assertThat(estado(id)).isEqualTo("SOLICITADA");
    }

    @Test
    void ct052_emUsoNaoEhCancelada() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA);
        forcarEstado(id, "EM_USO");

        cancelar(adm, id, "Tentativa").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSICAO_PROIBIDA"));
    }

    @Test
    void ct055_reservaCanceladaContinuaConsultavelComEstadoEMotivo() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);
        cancelar(adm, id, "Manutenção do prédio").andExpect(status().isOk());

        mvc.perform(get("/api/reservas/" + id).header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CANCELADA"))
                .andExpect(jsonPath("$.motivo").value("Manutenção do prédio"));
        assertThat(contar("select count(*) from reservas where id = ?", id)).isEqualTo(1);
    }

    @Test
    void ct056_naoExisteOperacaoDeExclusao() throws Exception {
        long id = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA);

        mvc.perform(delete("/api/reservas/" + id).header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isMethodNotAllowed());

        assertThat(contar("select count(*) from reservas where id = ?", id)).isEqualTo(1);
    }

    // ---- visibilidade

    @Test
    void solicitanteVeSoAsProprias_ResponsavelEAdministradorVeemTodas() throws Exception {
        long doS1 = criarOk(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA);
        criarOk(s2, "2026-10-21T14:00", "2026-10-21T16:00", salaB);

        mvc.perform(get("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(r1)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(adm)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/reservas/" + doS1).header(HttpHeaders.AUTHORIZATION, bearer(s2)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
    }
}
