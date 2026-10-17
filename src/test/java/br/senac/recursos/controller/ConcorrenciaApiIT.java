package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import br.senac.recursos.suporte.ApiIT;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/**
 * Proteção contra dupla reserva sob concorrência, com PostgreSQL real (RF-06, RN-03, RN-30, ADR-003).
 * CT-060 a CT-065. A quantidade de solicitações (20) e de repetições (5) são hipóteses da Aula 10,
 * com validação pendente.
 */
class ConcorrenciaApiIT extends ApiIT {

    /** Hipótese: valor de exemplo da Aula 10, validação pendente. */
    private static final int SOLICITACOES = 20;

    /** Hipótese: valor de exemplo da Aula 10, validação pendente. */
    private static final int REPETICOES = 5;

    private record Resposta(int status, String corpo) {
    }

    private List<String> tokens;
    private List<Long> usuarios;

    @BeforeEach
    void solicitantes() throws Exception {
        tokens = new ArrayList<>();
        usuarios = new ArrayList<>();
        for (int i = 1; i <= SOLICITACOES; i++) {
            String email = "s" + i + "@exemplo.test";
            usuarios.add(criarUsuario("SOLICITANTE", email));
            tokens.add(login(email));
        }
    }

    // ---- apoio

    private List<Resposta> dispararJuntas(List<Callable<Resposta>> tarefas) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tarefas.size());
        CountDownLatch prontas = new CountDownLatch(tarefas.size());
        CountDownLatch largada = new CountDownLatch(1);
        try {
            List<Future<Resposta>> futuros = new ArrayList<>();
            for (Callable<Resposta> tarefa : tarefas) {
                futuros.add(pool.submit(() -> {
                    prontas.countDown();
                    largada.await();
                    return tarefa.call();
                }));
            }
            assertThat(prontas.await(30, TimeUnit.SECONDS)).isTrue();
            largada.countDown();
            List<Resposta> respostas = new ArrayList<>();
            for (Future<Resposta> f : futuros) {
                respostas.add(f.get(60, TimeUnit.SECONDS));
            }
            return respostas;
        } finally {
            pool.shutdownNow();
        }
    }

    private Callable<Resposta> reservar(String token, String inicio, String fim, long... recursos) {
        return () -> {
            var resultado = mvc.perform(post("/api/reservas")
                            .header(HttpHeaders.AUTHORIZATION, bearer(token))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(Map.of(
                                    "titulo", "Aula concorrente",
                                    "inicio", local(inicio),
                                    "fim", local(fim),
                                    "recursoIds", java.util.Arrays.stream(recursos).boxed().toList()))))
                    .andReturn().getResponse();
            return new Resposta(resultado.getStatus(), resultado.getContentAsString());
        };
    }

    private static long contarStatus(List<Resposta> respostas, int status) {
        return respostas.stream().filter(r -> r.status() == status).count();
    }

    private static void exigirSoAceitasOuConflitos(List<Resposta> respostas) {
        assertThat(respostas).as("nenhuma resposta 5xx nem outro status").allMatch(
                r -> r.status() == 201 || r.status() == 409);
    }

    // ---- casos

    @Test
    void ct060_vinteSolicitacoesParaAMesmaSalaGeramUmaReservaAceita() throws Exception {
        long sala = salaSql("Sala A", false);
        List<Callable<Resposta>> tarefas = new ArrayList<>();
        for (String token : tokens) {
            tarefas.add(reservar(token, "2026-10-21T14:00", "2026-10-21T16:00", sala));
        }

        List<Resposta> respostas = dispararJuntas(tarefas);

        exigirSoAceitasOuConflitos(respostas);
        assertThat(contarStatus(respostas, 201)).isEqualTo(1);
        assertThat(contarStatus(respostas, 409)).isEqualTo(SOLICITACOES - 1);
        assertThat(contar("select count(*) from reservas")).isEqualTo(1);
        assertThat(contar("select count(*) from ocupacoes where recurso_id = ? and ativa", sala)).isEqualTo(1);
        assertThat(contar("select count(*) from tentativas_conflito where recurso_id = ? "
                + "and motivo in ('SOBREPOSICAO', 'CONCORRENCIA')", sala)).isEqualTo(SOLICITACOES - 1);
    }

    @Test
    void ct061_vinteSolicitacoesParaOMesmoProfessorEmSalasDiferentesGeramUmaAceita() throws Exception {
        long professor = professorSql("Professor 1", null);
        List<Callable<Resposta>> tarefas = new ArrayList<>();
        for (int i = 0; i < SOLICITACOES; i++) {
            long sala = salaSql("Sala " + i, false);
            tarefas.add(reservar(tokens.get(i), "2026-10-21T14:00", "2026-10-21T16:00", sala, professor));
        }

        List<Resposta> respostas = dispararJuntas(tarefas);

        exigirSoAceitasOuConflitos(respostas);
        assertThat(contarStatus(respostas, 201)).isEqualTo(1);
        assertThat(contarStatus(respostas, 409)).isEqualTo(SOLICITACOES - 1);
        assertThat(contar("select count(*) from ocupacoes where recurso_id = ? and ativa", professor)).isEqualTo(1);
        assertThat(contar("select count(*) from reservas")).isEqualTo(1);
        assertThat(contar("select count(*) from ocupacoes where ativa")).as("sala e professor da única reserva")
                .isEqualTo(2);
    }

    @Test
    void ct062_oResultadoSeRepeteEmExecucoesSucessivas() throws Exception {
        long sala = salaSql("Sala A", false);
        String[] dias = {"2026-10-21", "2026-10-22", "2026-10-23", "2026-10-26", "2026-10-27"};
        for (int rodada = 0; rodada < REPETICOES; rodada++) {
            List<Callable<Resposta>> tarefas = new ArrayList<>();
            for (String token : tokens) {
                tarefas.add(reservar(token, dias[rodada] + "T14:00", dias[rodada] + "T16:00", sala));
            }

            List<Resposta> respostas = dispararJuntas(tarefas);

            exigirSoAceitasOuConflitos(respostas);
            assertThat(contarStatus(respostas, 201)).as("rodada %d", rodada + 1).isEqualTo(1);
        }
        assertThat(contar("select count(*) from ocupacoes where recurso_id = ? and ativa", sala))
                .isEqualTo(REPETICOES);
        assertThat(contar("select count(*) from ocupacoes a join ocupacoes b on a.recurso_id = b.recurso_id "
                + "and a.id < b.id and a.ativa and b.ativa and a.periodo && b.periodo"))
                .as("nenhum par de ocupações ativas sobrepostas")
                .isZero();
    }

    @Test
    void ct064_reservaComVariosRecursosEmOrdensOpostasNaoCausaImpasseNemDuplicidade() throws Exception {
        long sala = salaSql("Sala A", false);
        long projetor = materialSql("Projetor P-001", "PAT-P001", false);
        List<Callable<Resposta>> tarefas = new ArrayList<>();
        for (int i = 0; i < SOLICITACOES; i++) {
            long[] ordem = i % 2 == 0 ? new long[] {sala, projetor} : new long[] {projetor, sala};
            tarefas.add(reservar(tokens.get(i), "2026-10-21T14:00", "2026-10-21T16:00", ordem));
        }

        List<Resposta> respostas = dispararJuntas(tarefas);

        exigirSoAceitasOuConflitos(respostas);
        assertThat(contarStatus(respostas, 201)).isEqualTo(1);
        assertThat(contar("select count(*) from ocupacoes where ativa")).isEqualTo(2);
    }

    @Test
    void ct064_conjuntosQueSoSeCruzamNoProjetorAceitamUmaUnicaReserva() throws Exception {
        long salaA = salaSql("Sala A", false);
        long salaB = salaSql("Sala B", false);
        long projetor = materialSql("Projetor P-001", "PAT-P001", false);
        List<Callable<Resposta>> tarefas = new ArrayList<>();
        for (int i = 0; i < SOLICITACOES; i++) {
            long[] conjunto = i % 2 == 0 ? new long[] {salaA, projetor} : new long[] {projetor, salaB};
            tarefas.add(reservar(tokens.get(i), "2026-10-21T14:00", "2026-10-21T16:00", conjunto));
        }

        List<Resposta> respostas = dispararJuntas(tarefas);

        exigirSoAceitasOuConflitos(respostas);
        assertThat(contarStatus(respostas, 201)).isEqualTo(1);
        assertThat(contar("select count(*) from ocupacoes where recurso_id = ? and ativa", projetor)).isEqualTo(1);
    }

    @Test
    void ct065_aTentativaPersisteMesmoQuandoAReservaEhDesfeita() throws Exception {
        long sala = salaSql("Sala A", false);
        List<Callable<Resposta>> tarefas = List.of(
                reservar(tokens.get(0), "2026-10-21T14:00", "2026-10-21T16:00", sala),
                reservar(tokens.get(1), "2026-10-21T14:00", "2026-10-21T16:00", sala));

        List<Resposta> respostas = dispararJuntas(tarefas);

        assertThat(contarStatus(respostas, 201)).isEqualTo(1);
        assertThat(contar("select count(*) from reservas")).isEqualTo(1);
        assertThat(contar("select count(*) from tentativas_conflito")).isEqualTo(1);
    }

    /**
     * Prova de que o teste protege (CT-063): sem a constraint de exclusão, a verificação prévia em código
     * deixa passar mais de uma reserva sob concorrência. O teste remove a constraint, mostra a duplicidade
     * e a restaura. Isso confirma que o verde de CT-060 se deve ao banco, não ao acaso.
     */
    @Test
    void ct063_semAConstraintAReservaDuplicaEOTesteDetecta() throws Exception {
        long sala = salaSql("Sala A", false);
        jdbc.execute("alter table ocupacoes drop constraint ocupacoes_sem_sobreposicao");
        try {
            boolean duplicou = false;
            for (int rodada = 0; rodada < 5 && !duplicou; rodada++) {
                limparOcupacoes();
                List<Callable<Resposta>> tarefas = new ArrayList<>();
                for (String token : tokens) {
                    tarefas.add(reservar(token, "2026-10-21T14:00", "2026-10-21T16:00", sala));
                }
                List<Resposta> respostas = dispararJuntas(tarefas);
                duplicou = contarStatus(respostas, 201) > 1;
            }
            assertThat(duplicou).as("sem a constraint, mais de uma reserva é aceita").isTrue();
        } finally {
            try {
                limparOcupacoes();
            } finally {
                // A constraint é sempre restaurada, mesmo se a limpeza falhar: os outros testes dependem dela.
                jdbc.execute("alter table ocupacoes add constraint ocupacoes_sem_sobreposicao "
                        + "exclude using gist (recurso_id with =, periodo with &&) where (ativa)");
            }
        }
        assertThat(contar("select count(*) from pg_constraint where conname = 'ocupacoes_sem_sobreposicao'"))
                .isEqualTo(1);
    }

    private void limparOcupacoes() {
        jdbc.execute("delete from notificacoes");
        jdbc.execute("delete from aprovacoes");
        jdbc.execute("delete from movimentacoes_material");
        jdbc.execute("delete from ocupacoes");
        jdbc.execute("delete from tentativas_conflito");
        jdbc.execute("alter table auditoria_eventos disable trigger user");
        jdbc.execute("delete from auditoria_eventos");
        jdbc.execute("alter table auditoria_eventos enable trigger user");
        jdbc.execute("delete from reservas");
    }
}
