package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * Documentação da API (RF-14, R-15). CT-114 a CT-116.
 *
 * <p>O contrato publicado fica em {@code docs/api/openapi.json}. Para regenerá-lo, rode com
 * {@code -Dgerar.openapi=true}. Sem a propriedade, o teste compara o arquivo com o contrato vivo.
 */
class DocumentacaoApiIT extends ApiIT {

    private static final Path ARQUIVO = Path.of("docs", "api", "openapi.json");
    private static final Set<String> METODOS = Set.of("get", "post", "put", "delete", "patch");

    @Autowired
    private RequestMappingHandlerMapping mapeamento;

    private String token;

    @BeforeEach
    void entra() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test");
        token = login("s1@exemplo.test");
    }

    private JsonNode contrato() throws Exception {
        String corpo = mvc.perform(get("/v3/api-docs").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(corpo);
    }

    @Test
    void ct114_toda_operacaoTemResumoPerfisParametrosERespostas() throws Exception {
        JsonNode docs = contrato();
        JsonNode caminhos = docs.get("paths");
        assertThat(caminhos).isNotNull();

        Iterator<Map.Entry<String, JsonNode>> itCaminhos = caminhos.fields();
        int operacoes = 0;
        while (itCaminhos.hasNext()) {
            Map.Entry<String, JsonNode> caminho = itCaminhos.next();
            Iterator<Map.Entry<String, JsonNode>> itMetodos = caminho.getValue().fields();
            while (itMetodos.hasNext()) {
                Map.Entry<String, JsonNode> metodo = itMetodos.next();
                if (!METODOS.contains(metodo.getKey())) {
                    continue;
                }
                operacoes++;
                String nome = metodo.getKey().toUpperCase() + " " + caminho.getKey();
                JsonNode op = metodo.getValue();
                assertThat(op.path("summary").asText()).as("resumo de %s", nome).isNotBlank();
                assertThat(op.has("x-perfis")).as("perfis permitidos de %s", nome).isTrue();
                assertThat(op.path("responses").has("401") || caminho.getKey().equals("/api/auth/login"))
                        .as("resposta 401 de %s", nome).isTrue();
                assertThat(op.path("responses").has("400") || op.path("responses").has("403")
                        || op.path("responses").has("404")).as("códigos de erro de %s", nome).isTrue();
                boolean temSucesso = false;
                Iterator<String> codigos = op.path("responses").fieldNames();
                while (codigos.hasNext()) {
                    temSucesso |= codigos.next().startsWith("2");
                }
                assertThat(temSucesso).as("resposta de sucesso de %s", nome).isTrue();
            }
        }
        assertThat(operacoes).isGreaterThanOrEqualTo(30);
    }

    @Test
    void ct115_contratoCorrespondeAoComportamento_semDivergenciaDeRotas() throws Exception {
        JsonNode docs = contrato();
        Set<String> documentadas = new TreeSet<>();
        docs.get("paths").fields().forEachRemaining(c -> c.getValue().fieldNames().forEachRemaining(m -> {
            if (METODOS.contains(m)) {
                documentadas.add(m.toUpperCase() + " " + c.getKey());
            }
        }));

        Set<String> implementadas = new TreeSet<>();
        for (Map.Entry<RequestMappingInfo, HandlerMethod> e : mapeamento.getHandlerMethods().entrySet()) {
            if (!e.getValue().getBeanType().getPackageName().equals("br.senac.recursos.controller")) {
                continue;
            }
            for (String caminho : e.getKey().getPathPatternsCondition().getPatternValues()) {
                e.getKey().getMethodsCondition().getMethods()
                        .forEach(m -> implementadas.add(m.name() + " " + caminho));
            }
        }

        assertThat(documentadas).as("rotas documentadas e implementadas coincidem").isEqualTo(implementadas);
    }

    @Test
    void ct115_arquivoPublicadoCorrespondeAoContratoVivo() throws Exception {
        JsonNode vivo = contrato();
        String formatado = json.writerWithDefaultPrettyPrinter().writeValueAsString(vivo) + "\n";

        if (Boolean.getBoolean("gerar.openapi")) {
            Files.createDirectories(ARQUIVO.getParent());
            Files.writeString(ARQUIVO, formatado, StandardCharsets.UTF_8);
        }

        assertThat(Files.exists(ARQUIVO)).as("docs/api/openapi.json existe").isTrue();
        JsonNode publicado = json.readTree(Files.readString(ARQUIVO, StandardCharsets.UTF_8));
        assertThat(publicado).as("contrato publicado igual ao contrato vivo (regenere com -Dgerar.openapi=true)")
                .isEqualTo(vivo);
    }

    @Test
    void ct116_documentacaoNaoContemSegredoNemDadoDeAmbiente() throws Exception {
        String texto = json.writeValueAsString(contrato());

        assertThat(texto)
                .doesNotContain("senha_hash")
                .doesNotContain(SENHA_DE_TESTE)
                .doesNotContain("jdbc:")
                .doesNotContain("s1@exemplo.test")
                .doesNotContain(token)
                .doesNotContain(POSTGRES.getPassword());
    }

    @Test
    void ct114_documentacaoExigeAutenticacao() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isUnauthorized());
    }
}
