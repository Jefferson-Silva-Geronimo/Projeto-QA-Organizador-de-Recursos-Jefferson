package br.senac.recursos.controller;

import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import java.sql.Timestamp;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Relatório de utilização, carga horária e conflitos evitados (RF-12, RN-26, RN-30, RN-31, B4, C5, D5).
 * CT-107 a CT-113. O tamanho da página é a lacuna D4: o cliente informa, não há valor padrão.
 */
class RelatorioApiIT extends ApiIT {

    private static final String DIA_INICIO = "2026-10-20T00:00";
    private static final String DIA_FIM = "2026-10-21T00:00";

    private long idS1;
    private long idS2;
    private String s1;
    private String r1;
    private String adm;
    private long salaA;
    private long salaB;
    private long notebook;
    private long professor;

    @BeforeEach
    void cenario() throws Exception {
        idS1 = criarUsuario("SOLICITANTE", "s1@exemplo.test");
        idS2 = criarUsuario("SOLICITANTE", "s2@exemplo.test");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        s1 = login("s1@exemplo.test");
        r1 = login("r1@exemplo.test");
        adm = login("a1@exemplo.test");
        salaA = salaSql("Sala A", false);
        salaB = salaSql("Sala B", false);
        notebook = materialSql("Notebook N-001", "PAT-N001", false);
        professor = professorSql("Professor 1", null);
    }

    // ---- apoio

    private void reserva(long recurso, String estado, String inicioLocal, String fimLocal) {
        Timestamp inicio = Timestamp.from(Instant.parse(local(inicioLocal)));
        Timestamp fim = Timestamp.from(Instant.parse(local(fimLocal)));
        boolean ativa = estado.equals("SOLICITADA") || estado.equals("APROVADA") || estado.equals("EM_USO");
        long id = jdbc.queryForObject(
                "insert into reservas (solicitante_id, titulo, inicio, fim, estado, exige_aprovacao, criada_em, atualizada_em) "
                        + "values (?, 'Aula de teste', ?, ?, cast(? as estado_reserva), false, now(), now()) returning id",
                Long.class, idS1, inicio, fim, estado);
        jdbc.update("insert into ocupacoes (recurso_id, periodo, reserva_id, ativa) "
                + "values (?, tstzrange(?, ?, '[)'), ?, ?)", recurso, inicio, fim, id, ativa);
    }

    private void tentativa(long recurso, long solicitante, String motivo, String inicioLocal, String fimLocal) {
        jdbc.update("insert into tentativas_conflito (recurso_id, periodo, solicitante_id, motivo, ocorrida_em) "
                        + "values (?, tstzrange(?, ?, '[)'), ?, cast(? as motivo_conflito), now())",
                recurso, Timestamp.from(Instant.parse(local(inicioLocal))),
                Timestamp.from(Instant.parse(local(fimLocal))), solicitante, motivo);
    }

    private ResultActions relatorio(String token, String inicio, String fim, String extra) throws Exception {
        return mvc.perform(get("/api/relatorios/utilizacao?inicio=" + local(inicio) + "&fim=" + local(fim)
                + "&tamanho=50" + extra).header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }

    // ---- carga horária

    @Test
    void ct107_cargaHorariaSomaADuracaoDaReservaAprovada() throws Exception {
        reserva(salaA, "APROVADA", "2026-10-20T14:00", "2026-10-20T16:00");

        relatorio(r1, DIA_INICIO, DIA_FIM, "&recursoId=" + salaA)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens", hasSize(1)))
                .andExpect(jsonPath("$.itens[0].horasAlocadas").value(closeTo(2.0, 0.0001)));
    }

    @Test
    void ct108_soAprovadaEmUsoEConcluidaContam() throws Exception {
        reserva(salaA, "SOLICITADA", "2026-10-20T08:00", "2026-10-20T09:00");
        reserva(salaA, "APROVADA", "2026-10-20T09:00", "2026-10-20T10:00");
        reserva(salaA, "EM_USO", "2026-10-20T10:00", "2026-10-20T11:00");
        reserva(salaA, "CONCLUIDA", "2026-10-20T11:00", "2026-10-20T12:00");
        reserva(salaA, "CANCELADA", "2026-10-20T12:00", "2026-10-20T13:00");
        reserva(salaA, "NAO_COMPARECEU", "2026-10-20T13:00", "2026-10-20T14:00");

        relatorio(r1, DIA_INICIO, DIA_FIM, "&recursoId=" + salaA)
                .andExpect(jsonPath("$.itens[0].horasAlocadas").value(closeTo(3.0, 0.0001)));
    }

    @Test
    void ct109_contaSoAParteInternaDoPeriodo() throws Exception {
        reserva(salaA, "APROVADA", "2026-10-20T14:00", "2026-10-20T16:00");

        relatorio(r1, "2026-10-20T15:00", "2026-10-20T18:00", "&recursoId=" + salaA)
                .andExpect(jsonPath("$.itens[0].horasAlocadas").value(closeTo(1.0, 0.0001)));
    }

    // ---- utilização

    @Test
    void ct110_utilizacaoSoParaSalasEUsaHorasDeFuncionamento() throws Exception {
        reserva(salaA, "APROVADA", "2026-10-20T09:00", "2026-10-20T16:00");   // 7 h de 15 h (07:00 às 22:00)
        reserva(notebook, "APROVADA", "2026-10-20T09:00", "2026-10-20T16:00");
        reserva(professor, "APROVADA", "2026-10-20T09:00", "2026-10-20T16:00");

        relatorio(r1, DIA_INICIO, DIA_FIM, "")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[?(@.recursoId == " + salaA + ")].utilizacao",
                        contains(closeTo(7.0 / 15.0, 0.001))))
                .andExpect(jsonPath("$.itens[?(@.recursoId == " + notebook + ")].utilizacao",
                        everyItem(nullValue())))
                .andExpect(jsonPath("$.itens[?(@.recursoId == " + professor + ")].utilizacao",
                        everyItem(nullValue())));
    }

    @Test
    void ct110_diaSemFuncionamentoNaoEntraNoDenominador() throws Exception {
        // Semana de segunda 19/10 a domingo 25/10: cinco dias úteis de 15 h = 75 h de funcionamento.
        reserva(salaA, "APROVADA", "2026-10-20T09:00", "2026-10-20T16:00");

        relatorio(r1, "2026-10-19T00:00", "2026-10-26T00:00", "&recursoId=" + salaA)
                .andExpect(jsonPath("$.itens[0].utilizacao").value(closeTo(7.0 / 75.0, 0.001)));
    }

    // ---- conflitos evitados

    @Test
    void ct111_conflitosEvitadosTotalEDistintosPorSolicitante() throws Exception {
        tentativa(salaA, idS1, "SOBREPOSICAO", "2026-10-20T14:00", "2026-10-20T16:00");
        tentativa(salaA, idS1, "CONCORRENCIA", "2026-10-20T14:00", "2026-10-20T16:00");
        tentativa(salaA, idS2, "MANUTENCAO", "2026-10-20T10:00", "2026-10-20T11:00");
        tentativa(salaA, idS2, "SOBREPOSICAO", "2026-10-25T10:00", "2026-10-25T11:00");   // fora do período

        relatorio(r1, DIA_INICIO, DIA_FIM, "&recursoId=" + salaA)
                .andExpect(jsonPath("$.itens[0].conflitosEvitados").value(3))
                .andExpect(jsonPath("$.itens[0].solicitantesDistintos").value(2));
    }

    // ---- filtros, paginação e acesso

    @Test
    void ct112_filtrosPorTipoERecursoEPaginacaoSemRepeticao() throws Exception {
        relatorio(r1, DIA_INICIO, DIA_FIM, "&tipo=SALA")
                .andExpect(jsonPath("$.itens", hasSize(2)))
                .andExpect(jsonPath("$.total").value(2));
        relatorio(r1, DIA_INICIO, DIA_FIM, "&tipo=MATERIAL")
                .andExpect(jsonPath("$.itens", hasSize(1)));
        relatorio(r1, DIA_INICIO, DIA_FIM, "&recursoId=" + salaB)
                .andExpect(jsonPath("$.itens", hasSize(1)))
                .andExpect(jsonPath("$.itens[0].recursoId").value(salaB));

        mvc.perform(get("/api/relatorios/utilizacao?inicio=" + local(DIA_INICIO) + "&fim=" + local(DIA_FIM)
                        + "&tamanho=2&pagina=0").header(HttpHeaders.AUTHORIZATION, bearer(r1)))
                .andExpect(jsonPath("$.itens", hasSize(2)))
                .andExpect(jsonPath("$.total").value(4));
        mvc.perform(get("/api/relatorios/utilizacao?inicio=" + local(DIA_INICIO) + "&fim=" + local(DIA_FIM)
                        + "&tamanho=2&pagina=1").header(HttpHeaders.AUTHORIZATION, bearer(r1)))
                .andExpect(jsonPath("$.itens", hasSize(2)))
                .andExpect(jsonPath("$.pagina").value(1));
    }

    @Test
    void ct112_semTamanhoDePaginaOuComPeriodoInvalidoEhRecusado() throws Exception {
        mvc.perform(get("/api/relatorios/utilizacao?inicio=" + local(DIA_INICIO) + "&fim=" + local(DIA_FIM))
                        .header(HttpHeaders.AUTHORIZATION, bearer(r1)))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/relatorios/utilizacao?inicio=" + local(DIA_FIM) + "&fim=" + local(DIA_INICIO)
                        + "&tamanho=10").header(HttpHeaders.AUTHORIZATION, bearer(r1)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void ct113_responsavelEAdministradorLeemESolicitanteNaoAcessa() throws Exception {
        relatorio(r1, DIA_INICIO, DIA_FIM, "").andExpect(status().isOk());
        relatorio(adm, DIA_INICIO, DIA_FIM, "").andExpect(status().isOk());
        relatorio(s1, DIA_INICIO, DIA_FIM, "").andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
    }
}
