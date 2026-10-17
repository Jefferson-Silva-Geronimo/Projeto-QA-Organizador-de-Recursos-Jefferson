package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Falha ao gravar a tentativa de conflito (RN-30, ADR-003, R-19). A decisão de 15/10/2026 aceita perder a
 * contagem, mas mantém a resposta 409 ao solicitante: "se essa gravação falhar, o 409 é mantido e a perda vai
 * para o log".
 */
@ExtendWith(OutputCaptureExtension.class)
class FalhaNaTentativaApiIT extends ApiIT {

    private String s1;
    private String s2;
    private long salaA;

    @BeforeEach
    void cenario() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("SOLICITANTE", "s2@exemplo.test");
        s1 = login("s1@exemplo.test");
        s2 = login("s2@exemplo.test");
        salaA = salaSql("Sala A", false);
    }

    private ResultActions reservar(String token, String inicio, String fim) throws Exception {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("titulo", "Aula de teste");
        corpo.put("inicio", local(inicio));
        corpo.put("fim", local(fim));
        corpo.put("recursoIds", List.of(salaA));
        return mvc.perform(post("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo)));
    }

    private void falharAGravacaoDaTentativa() {
        jdbc.execute("create function falha_de_tentativa_de_teste() returns trigger language plpgsql as "
                + "$$ begin raise exception 'falha injetada na tentativa'; end; $$");
        jdbc.execute("create trigger tentativa_falha_de_teste before insert on tentativas_conflito "
                + "for each row execute function falha_de_tentativa_de_teste()");
    }

    private void restaurarAGravacaoDaTentativa() {
        jdbc.execute("drop trigger tentativa_falha_de_teste on tentativas_conflito");
        jdbc.execute("drop function falha_de_tentativa_de_teste()");
    }

    @Test
    void bug009_seAGravacaoDaTentativaFalharOConflitoContinuaSendo409() throws Exception {
        reservar(s1, "2026-10-21T14:00", "2026-10-21T16:00").andExpect(status().isCreated());
        falharAGravacaoDaTentativa();
        try {
            reservar(s2, "2026-10-21T15:00", "2026-10-21T17:00")
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("CONFLITO_DE_ALOCACAO"));
        } finally {
            restaurarAGravacaoDaTentativa();
        }

        assertThat(contar("select count(*) from reservas")).isEqualTo(1);
        assertThat(contar("select count(*) from tentativas_conflito")).isZero();
    }

    @Test
    void bug009_aPerdaDaTentativaVaiParaOLogSemDadoPessoal(CapturedOutput saida) throws Exception {
        reservar(s1, "2026-10-21T14:00", "2026-10-21T16:00").andExpect(status().isCreated());
        falharAGravacaoDaTentativa();
        try {
            reservar(s2, "2026-10-21T15:00", "2026-10-21T17:00").andExpect(status().isConflict());
        } finally {
            restaurarAGravacaoDaTentativa();
        }

        assertThat(saida.getAll())
                .contains("Tentativa de conflito não gravada (recurso " + salaA + ", motivo SOBREPOSICAO)")
                .doesNotContain("s2@exemplo.test");
    }
}
