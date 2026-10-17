package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.model.Notificacao;
import br.senac.recursos.service.DespachoDeNotificacoesService;
import br.senac.recursos.service.NotificadorExterno;
import br.senac.recursos.suporte.ApiIT;
import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/**
 * Troca do provedor de notificação no contexto real (CT-106, CEN-08): com um adaptador diferente do webhook no
 * lugar da porta, o contrato publicado da API é o mesmo e o despacho funciona sem alterar o serviço.
 */
@Import(TrocaDeProvedorApiIT.ProvedorAlternativo.class)
class TrocaDeProvedorApiIT extends ApiIT {

    /** Adaptador alternativo: não faz chamada HTTP; guarda a chave de idempotência e aceita. */
    static class AdaptadorEmMemoria implements NotificadorExterno {
        final List<String> chaves = new CopyOnWriteArrayList<>();

        @Override
        public boolean disponivel() {
            return true;
        }

        @Override
        public Resultado enviar(Notificacao notificacao, Instant instante) {
            chaves.add(notificacao.chaveIdempotencia());
            return Resultado.ENVIADA;
        }
    }

    @TestConfiguration
    static class ProvedorAlternativo {
        @Bean
        @Primary
        AdaptadorEmMemoria adaptadorEmMemoria() {
            return new AdaptadorEmMemoria();
        }
    }

    @Autowired
    private AdaptadorEmMemoria alternativo;

    @Autowired
    private DespachoDeNotificacoesService despacho;

    private String s1;
    private long salaA;
    private long projetor;

    @BeforeEach
    void cenario() throws Exception {
        alternativo.chaves.clear();
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r2@exemplo.test");
        s1 = login("s1@exemplo.test");
        salaA = salaSql("Sala A", false);
        projetor = materialSql("Projetor P-001", "PAT-P001", true);
    }

    @Test
    void ct106_comOutroAdaptadorOContratoPublicadoNaoMuda() throws Exception {
        String corpo = mvc.perform(get("/v3/api-docs").header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        JsonNode publicado = json.readTree(Files.readString(Path.of("docs", "api", "openapi.json"),
                StandardCharsets.UTF_8));
        assertThat(json.readTree(corpo)).isEqualTo(publicado);
    }

    @Test
    void ct106_comOutroAdaptadorODespachoEnviaPelaPortaSemMudarOServico() throws Exception {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("titulo", "Aula de teste");
        c.put("inicio", local("2026-10-21T14:00"));
        c.put("fim", local("2026-10-21T16:00"));
        c.put("recursoIds", List.of(salaA, projetor));
        mvc.perform(post("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(s1))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(c)))
                .andExpect(status().isCreated());

        int enviadas = despacho.despachar();

        assertThat(enviadas).isEqualTo(2);                     // um Responsável por notificação
        assertThat(alternativo.chaves).hasSize(2).doesNotHaveDuplicates();
        assertThat(contar("select count(*) from notificacoes where status = 'ENVIADA' and enviada_em is not null"))
                .isEqualTo(2);
    }
}
