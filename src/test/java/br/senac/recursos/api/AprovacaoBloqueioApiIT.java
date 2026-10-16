package br.senac.recursos.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.aplicacao.TransicoesAutomaticasServico;
import br.senac.recursos.suporte.ApiIT;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Aprovação, rejeição, SEM_DECISAO e bloqueio de manutenção (RF-07, RF-08, RN-04, RN-06, RN-16, RN-22,
 * RN-24, RN-25, RN-33, D2, D7, D15). CT-066 a CT-074 e CT-076 a CT-083.
 */
class AprovacaoBloqueioApiIT extends ApiIT {

    @Autowired
    private TransicoesAutomaticasServico automaticas;

    private long idR1;
    private String s1;
    private String s2;
    private String r1;
    private String r2;
    private String adm;
    private long salaA;
    private long salaB;
    private long projetor;
    private long notebook;

    @BeforeEach
    void cenario() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("SOLICITANTE", "s2@exemplo.test");
        idR1 = criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r2@exemplo.test");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        s1 = login("s1@exemplo.test");
        s2 = login("s2@exemplo.test");
        r1 = login("r1@exemplo.test");
        r2 = login("r2@exemplo.test");
        adm = login("a1@exemplo.test");
        salaA = salaSql("Sala A", false);
        salaB = salaSql("Sala B", false);
        projetor = materialSql("Projetor P-001", "PAT-P001", true);
        notebook = materialSql("Notebook N-001", "PAT-N001", false);
    }

    // ---- apoio

    private long reservar(String token, String inicio, String fim, long... recursos) throws Exception {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("titulo", "Aula de teste");
        c.put("inicio", local(inicio));
        c.put("fim", local(fim));
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

    private ResultActions bloquear(String token, long recurso, String inicio, String fim, List<Long> confirmadas)
            throws Exception {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("recursoId", recurso);
        c.put("inicio", local(inicio));
        c.put("fim", local(fim));
        c.put("motivo", "Manutenção preventiva");
        if (confirmadas != null) {
            c.put("reservasConfirmadas", confirmadas);
        }
        return mvc.perform(post("/api/bloqueios").header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(c)));
    }

    private String estado(long id) {
        return jdbc.queryForObject("select estado::text from reservas where id = ?", String.class, id);
    }

    private void forcarEstado(long id, String estado) {
        jdbc.update("update reservas set estado = cast(? as estado_reserva) where id = ?", estado, id);
    }

    // ---- aprovação e rejeição

    @Test
    void ct066_responsavelAprovaReservaDeOutroUsuario() throws Exception {
        long id = reservar(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);

        acao(r1, id, "aprovacao", Map.of()).andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("APROVADA"));

        assertThat(estado(id)).isEqualTo("APROVADA");
        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? and acao = 'RESERVA_APROVADA' "
                + "and ator_tipo = 'USUARIO' and ator_id = ? and estado_anterior = 'SOLICITADA'", id, idR1))
                .isEqualTo(1);
        assertThat(contar("select count(*) from aprovacoes where reserva_id = ? and decisao = 'APROVADA' "
                + "and responsavel_id = ?", id, idR1)).isEqualTo(1);
    }

    @Test
    void ct067_solicitanteAdministradorEDonoResponsavelNaoAprovam() throws Exception {
        long doS1 = reservar(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);
        long doR1 = reservar(r1, "2026-10-22T14:00", "2026-10-22T16:00", salaA, projetor);

        acao(s1, doS1, "aprovacao", Map.of()).andExpect(status().isForbidden());
        acao(adm, doS1, "aprovacao", Map.of()).andExpect(status().isForbidden());
        acao(r1, doR1, "aprovacao", Map.of()).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));

        assertThat(estado(doS1)).isEqualTo("SOLICITADA");
        assertThat(estado(doR1)).isEqualTo("SOLICITADA");
        assertThat(contar("select count(*) from aprovacoes")).isZero();
    }

    @Test
    void ct068_rejeicaoExigeMotivo() throws Exception {
        long id = reservar(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);

        acao(r2, id, "rejeicao", Map.of()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MOTIVO_OBRIGATORIO"));
        assertThat(estado(id)).isEqualTo("SOLICITADA");

        acao(r2, id, "rejeicao", Map.of("motivo", "Projetor indisponível nesta data")).andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("REJEITADA"));

        assertThat(estado(id)).isEqualTo("REJEITADA");
        assertThat(contar("select count(*) from ocupacoes where reserva_id = ? and ativa", id)).isZero();
        assertThat(contar("select count(*) from aprovacoes where reserva_id = ? and decisao = 'REJEITADA' "
                + "and motivo is not null", id)).isEqualTo(1);
        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? and acao = 'RESERVA_REJEITADA'",
                id)).isEqualTo(1);
    }

    @Test
    void ct069_soOResponsavelQueNaoEDonoRejeitaEODonoCancela() throws Exception {
        long doR1 = reservar(r1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);
        long doS1 = reservar(s1, "2026-10-22T14:00", "2026-10-22T16:00", salaA, projetor);

        acao(r1, doR1, "rejeicao", Map.of("motivo", "Quero desistir")).andExpect(status().isForbidden());
        acao(s1, doS1, "rejeicao", Map.of("motivo", "Quero desistir")).andExpect(status().isForbidden());
        acao(adm, doS1, "rejeicao", Map.of("motivo", "Quero desistir")).andExpect(status().isForbidden());
        acao(r1, doR1, "cancelamento", Map.of()).andExpect(status().isOk());

        assertThat(estado(doR1)).isEqualTo("CANCELADA");
        assertThat(estado(doS1)).isEqualTo("SOLICITADA");
    }

    @Test
    void ct070_filaListaSoReservasQueExigemAprovacao() throws Exception {
        long comRestrito = reservar(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);
        reservar(s2, "2026-10-21T14:00", "2026-10-21T16:00", salaB, notebook);

        mvc.perform(get("/api/reservas/fila").header(HttpHeaders.AUTHORIZATION, bearer(r1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(comRestrito));
        mvc.perform(get("/api/reservas/fila").header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void ct071_aprovacaoNoInstanteDeInicioEhRecusada() throws Exception {
        long id = reservar(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);   // início 17:00Z

        agora("2026-10-21T17:00:00Z");
        acao(r1, id, "aprovacao", Map.of()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("APROVACAO_APOS_INICIO"));
        assertThat(estado(id)).isEqualTo("SOLICITADA");

        agora("2026-10-21T16:59:59.999Z");
        acao(r1, id, "aprovacao", Map.of()).andExpect(status().isOk());
    }

    // ---- SEM_DECISAO

    @Test
    void ct072_semDecisaoNoInstanteDeInicioCancelaPeloSistema() throws Exception {
        long id = reservar(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);

        agora("2026-10-21T16:59:59.999Z");
        assertThat(automaticas.cancelarSemDecisao()).isZero();
        assertThat(estado(id)).isEqualTo("SOLICITADA");

        agora("2026-10-21T17:00:00Z");
        assertThat(automaticas.cancelarSemDecisao()).isEqualTo(1);

        assertThat(estado(id)).isEqualTo("CANCELADA");
        assertThat(contar("select count(*) from reservas where id = ? and motivo_sistema = 'SEM_DECISAO'", id))
                .isEqualTo(1);
        assertThat(contar("select count(*) from ocupacoes where reserva_id = ? and ativa", id)).isZero();
        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? and acao = 'RESERVA_CANCELADA' "
                + "and ator_tipo = 'SISTEMA' and ator_id is null and motivo = 'SEM_DECISAO'", id)).isEqualTo(1);
    }

    @Test
    void ct073_jobEhIdempotenteEmExecucoesSeguidasESimultaneas() throws Exception {
        long id = reservar(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA, projetor);
        agora("2026-10-21T17:00:00Z");

        ExecutorService pool = Executors.newFixedThreadPool(4);
        CountDownLatch largada = new CountDownLatch(1);
        List<Future<Integer>> execucoes = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            Callable<Integer> tarefa = () -> {
                largada.await();
                return automaticas.cancelarSemDecisao();
            };
            execucoes.add(pool.submit(tarefa));
        }
        largada.countDown();
        int total = 0;
        for (Future<Integer> f : execucoes) {
            total += f.get();
        }
        pool.shutdown();
        total += automaticas.cancelarSemDecisao();

        assertThat(total).isEqualTo(1);
        assertThat(contar("select count(*) from auditoria_eventos where entidade_id = ? and acao = 'RESERVA_CANCELADA'",
                id)).isEqualTo(1);
    }

    @Test
    void ct074_jobNaoTocaReservaAprovada() throws Exception {
        long aprovada = reservar(s1, "2026-10-21T14:00", "2026-10-21T16:00", salaA);   // sem restrito: APROVADA
        agora("2026-10-21T18:00:00Z");

        assertThat(automaticas.cancelarSemDecisao()).isZero();

        assertThat(estado(aprovada)).isEqualTo("APROVADA");
    }

    // ---- bloqueio de manutenção

    @Test
    void ct076_bloqueioSemReservasEhGravado() throws Exception {
        bloquear(adm, salaA, "2026-10-21T08:00", "2026-10-21T12:00", null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ativo").value(true));

        assertThat(contar("select count(*) from bloqueios_manutencao where recurso_id = ?", salaA)).isEqualTo(1);
        assertThat(contar("select count(*) from ocupacoes where recurso_id = ? and bloqueio_id is not null and ativa",
                salaA)).isEqualTo(1);
        assertThat(contar("select count(*) from auditoria_eventos where entidade = 'BLOQUEIO' "
                + "and acao = 'BLOQUEIO_CRIADO'")).isEqualTo(1);
    }

    @Test
    void ct077_bloqueioSobreReservasPedeConfirmacaoEntregandoALista() throws Exception {
        long r1id = reservar(s1, "2026-10-21T09:00", "2026-10-21T11:00", salaA, notebook);
        long r2id = reservar(s2, "2026-10-21T10:00", "2026-10-21T12:00", salaB);   // outra sala: fora
        long r3id = reservar(s2, "2026-10-21T11:00", "2026-10-21T12:00", salaA);

        bloquear(adm, salaA, "2026-10-21T08:00", "2026-10-21T12:00", null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BLOQUEIO_PENDE_CONFIRMACAO"))
                .andExpect(jsonPath("$.itens", hasSize(2)))
                .andExpect(jsonPath("$.itens[0]").value(String.valueOf(r1id)))
                .andExpect(jsonPath("$.itens[1]").value(String.valueOf(r3id)));

        assertThat(contar("select count(*) from bloqueios_manutencao")).isZero();
        assertThat(estado(r1id)).isEqualTo("APROVADA");
        assertThat(estado(r2id)).isEqualTo("APROVADA");
        assertThat(estado(r3id)).isEqualTo("APROVADA");
    }

    @Test
    void ct078_confirmacaoCancelaPorInteiroELiberaOsOutrosRecursos() throws Exception {
        long r1id = reservar(s1, "2026-10-21T09:00", "2026-10-21T11:00", salaA, notebook);
        long r3id = reservar(s2, "2026-10-21T11:00", "2026-10-21T12:00", salaA);

        bloquear(adm, salaA, "2026-10-21T08:00", "2026-10-21T12:00", List.of(r1id, r3id))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reservasCanceladas", hasSize(2)));

        assertThat(estado(r1id)).isEqualTo("CANCELADA");
        assertThat(estado(r3id)).isEqualTo("CANCELADA");
        assertThat(contar("select count(*) from reservas where motivo_sistema = 'MANUTENCAO'")).isEqualTo(2);
        assertThat(contar("select count(*) from ocupacoes where recurso_id = ? and reserva_id is not null and ativa",
                notebook)).as("o notebook da reserva cancelada volta a ficar livre").isZero();
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'RESERVA_CANCELADA' "
                + "and ator_tipo = 'SISTEMA' and motivo = 'MANUTENCAO'")).isEqualTo(2);
        reservar(s2, "2026-10-21T09:00", "2026-10-21T11:00", notebook);   // volta a poder ser reservado
    }

    @Test
    void ct078_confirmacaoComListaDiferenteDaAtualEhRecusada() throws Exception {
        long r1id = reservar(s1, "2026-10-21T09:00", "2026-10-21T11:00", salaA);
        long outra = reservar(s2, "2026-10-21T11:00", "2026-10-21T12:00", salaA);

        bloquear(adm, salaA, "2026-10-21T08:00", "2026-10-21T12:00", List.of(r1id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BLOQUEIO_LISTA_DESATUALIZADA"));

        assertThat(contar("select count(*) from bloqueios_manutencao")).isZero();
        assertThat(estado(outra)).isEqualTo("APROVADA");
    }

    @Test
    void ct079_reservaEmUsoImpedeOBloqueioSemOpcaoDeForcar() throws Exception {
        long emUso = reservar(s1, "2026-10-21T09:00", "2026-10-21T11:00", salaA);
        forcarEstado(emUso, "EM_USO");

        bloquear(adm, salaA, "2026-10-21T08:00", "2026-10-21T12:00", List.of(emUso))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BLOQUEIO_COM_RESERVA_EM_USO"));

        assertThat(contar("select count(*) from bloqueios_manutencao")).isZero();
        assertThat(estado(emUso)).isEqualTo("EM_USO");
    }

    @Test
    void ct080_bordasDoBloqueioNaoEntramNaLista() throws Exception {
        reservar(s1, "2026-10-21T07:00", "2026-10-21T08:00", salaA);          // termina na abertura do bloqueio
        reservar(s1, "2026-10-21T12:00", "2026-10-21T14:00", salaA);          // começa no fim do bloqueio
        long cruza = reservar(s2, "2026-10-21T11:00", "2026-10-21T13:00", salaB, notebook);
        long naSala = reservar(s2, "2026-10-21T11:00", "2026-10-21T13:00", salaA);

        bloquear(adm, salaA, "2026-10-21T08:00", "2026-10-21T12:00", null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.itens", hasSize(1)))
                .andExpect(jsonPath("$.itens[0]").value(String.valueOf(naSala)));
        assertThat(estado(cruza)).isEqualTo("APROVADA");
    }

    @Test
    void ct082_levantarOBloqueioLiberaOPeriodoEMantemAsReservasCanceladas() throws Exception {
        long reserva = reservar(s1, "2026-10-21T09:00", "2026-10-21T11:00", salaA);
        String corpo = bloquear(adm, salaA, "2026-10-21T08:00", "2026-10-21T12:00", List.of(reserva))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long bloqueio = json.readTree(corpo).get("id").asLong();

        mvc.perform(post("/api/bloqueios/" + bloqueio + "/levantamento")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adm))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("MOTIVO_OBRIGATORIO"));
        mvc.perform(post("/api/bloqueios/" + bloqueio + "/levantamento")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adm))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Manutenção concluída\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.ativo").value(false));

        assertThat(estado(reserva)).isEqualTo("CANCELADA");
        assertThat(contar("select count(*) from auditoria_eventos where acao = 'BLOQUEIO_LEVANTADO' "
                + "and motivo = 'Manutenção concluída'")).isEqualTo(1);
        reservar(s2, "2026-10-21T09:00", "2026-10-21T11:00", salaA);
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {"SOLICITANTE", "RESPONSAVEL"})
    void ct083_soOAdministradorGereBloqueios(String perfil) throws Exception {
        String token = perfil.equals("SOLICITANTE") ? s1 : r1;

        bloquear(token, salaA, "2026-10-21T08:00", "2026-10-21T12:00", null)
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));

        assertThat(contar("select count(*) from bloqueios_manutencao")).isZero();
    }
}
