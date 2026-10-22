package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/**
 * Campos obrigatórios das respostas no contrato (RF-14, R-15, F6-10). CT-134 e CT-135.
 *
 * <p>Um campo só é obrigatório se toda resposta real o traz. O Jackson omite campo nulo
 * ({@code default-property-inclusion: non_null}), então "obrigatório" quer dizer "sempre presente". Na dúvida o
 * campo fica de fora. A tabela {@link #OBRIGATORIOS} é a decisão; as amostras reais a confirmam.
 */
class ContratoObrigatoriosApiIT extends ApiIT {

    /** Campos que nunca faltam, por esquema de resposta. Os demais podem faltar e ficam opcionais. */
    private static final Map<String, Set<String>> OBRIGATORIOS = Map.ofEntries(
            Map.entry("LoginResposta", Set.of("token", "perfil", "expiraEm")),
            Map.entry("UsuarioAtualResposta", Set.of("id", "email", "perfil")),
            Map.entry("UsuarioResposta", Set.of("id", "nome", "email", "perfil", "ativo")),
            Map.entry("RecursoResposta", Set.of("id", "tipo", "nome", "restrito", "ativo")),
            Map.entry("ReservaResposta", Set.of("id", "solicitanteId", "titulo", "inicio", "fim", "estado",
                    "exigeAprovacao", "recursoIds", "podeAlterar", "podeCancelar", "podeIniciar", "podeConcluir",
                    "podeMarcarNaoComparecimento")),
            Map.entry("ReservaDaFilaResposta", Set.of("id", "solicitanteId", "solicitanteNome", "titulo", "inicio",
                    "fim", "estado", "exigeAprovacao", "recursoIds", "podeAprovar", "podeRejeitar")),
            Map.entry("BloqueioResposta", Set.of("id", "recursoId", "inicio", "fim", "motivo", "ativo",
                    "reservasCanceladas")),
            Map.entry("MovimentacaoResposta", Set.of("id", "materialId", "tipo", "atual", "registradoPorId", "registradoPorNome",
                    "registradoEm")),
            Map.entry("EventoAuditoriaResposta", Set.of("id", "ocorridoEm", "atorTipo", "entidade", "entidadeId",
                    "acao")),
            Map.entry("ItemRelatorioResposta", Set.of("recursoId", "nome", "tipo", "horasAlocadas",
                    "conflitosEvitados", "solicitantesDistintos")),
            Map.entry("RelatorioResposta", Set.of("itens", "pagina", "tamanho", "total")),
            Map.entry("IntervaloResposta", Set.of("inicio", "fim")));

    /** Campos que ficaram de fora e uma amostra real em que o campo realmente falta (justifica a exclusão). */
    private static final Map<String, Set<String>> COM_AMOSTRA_SEM_O_CAMPO = Map.of(
            "ReservaResposta", Set.of("descricao", "motivo"),
            "RecursoResposta", Set.of("capacidade", "codigoPatrimonio", "usuarioId"),
            "EventoAuditoriaResposta", Set.of("atorId", "estadoAnterior", "estadoNovo", "motivo"),
            "ItemRelatorioResposta", Set.of("utilizacao"));

    private final Map<String, List<JsonNode>> amostras = new LinkedHashMap<>();
    private String s1;
    private String r1;
    private String adm;

    @BeforeEach
    void cenarioReal() throws Exception {
        criarUsuario("SOLICITANTE", "s1@exemplo.test", "Maria Souza");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("RESPONSAVEL", "r2@exemplo.test");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        s1 = entrar("s1@exemplo.test");
        r1 = entrar("r1@exemplo.test");
        adm = entrar("a1@exemplo.test");
        long salaA = salaSql("Sala A", false);
        long salaB = salaSql("Sala B", false);
        long salaC = salaSql("Sala C", false);
        long projetor = materialSql("Projetor P-001", "PAT-P001", true);
        long notebook = materialSql("Notebook N-001", "PAT-N001", false);
        professorSql("Professor de teste", null);

        coletar("UsuarioAtualResposta", chamar(get("/api/auth/eu"), s1, 200));

        long comDescricao = reservar(s1, "Com descrição", "Aula com descrição", "2026-10-21T08:00", "2026-10-21T10:00",
                salaA, notebook);
        long semDescricao = reservar(s1, "Sem descrição", null, "2026-10-22T08:00", "2026-10-22T10:00", salaB);
        long rejeitada = reservar(s1, "Será rejeitada", null, "2026-10-23T08:00", "2026-10-23T10:00", projetor);
        reservar(s1, "Fica na fila", null, "2026-10-27T08:00", "2026-10-27T10:00", projetor, salaA);

        coletar("ReservaResposta", chamar(post("/api/reservas/" + rejeitada + "/rejeicao")
                .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Professor indisponível\"}"), r1, 200));
        coletar("ReservaResposta", chamar(get("/api/reservas"), s1, 200));
        coletar("ReservaResposta", chamar(get("/api/reservas/" + comDescricao), s1, 200));
        coletar("ReservaDaFilaResposta", chamar(get("/api/reservas/fila"), r1, 200));
        coletar("EventoAuditoriaResposta", chamar(get("/api/reservas/" + semDescricao + "/historico"), r1, 200));

        coletar("ReservaResposta", chamar(post("/api/reservas/" + comDescricao + "/retiradas")
                .contentType(MediaType.APPLICATION_JSON).content("{\"materialId\":" + notebook + "}"), r1, 200));
        coletar("MovimentacaoResposta", chamar(get("/api/reservas/" + comDescricao + "/movimentacoes"), r1, 200));

        coletar("RecursoResposta", chamar(get("/api/recursos"), s1, 200));
        coletar("RecursoResposta", chamar(get("/api/recursos/" + salaA), s1, 200));
        coletar("IntervaloResposta", chamar(get("/api/recursos/" + salaA + "/ocupacoes")
                .param("inicio", local("2026-10-01T00:00")).param("fim", local("2026-11-30T00:00")), s1, 200));

        coletar("RelatorioResposta", chamar(get("/api/relatorios/utilizacao")
                .param("inicio", local("2026-10-01T00:00")).param("fim", local("2026-11-30T00:00"))
                .param("tamanho", "50"), r1, 200));

        Map<String, Object> bloqueio = new LinkedHashMap<>();
        bloqueio.put("recursoId", salaC);
        bloqueio.put("inicio", local("2026-10-26T08:00"));
        bloqueio.put("fim", local("2026-10-26T10:00"));
        bloqueio.put("motivo", "Pintura");
        JsonNode criado = chamar(post("/api/bloqueios").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(bloqueio)), adm, 201);
        coletar("BloqueioResposta", criado);
        coletar("BloqueioResposta", chamar(get("/api/bloqueios"), adm, 200));
        coletar("BloqueioResposta", chamar(post("/api/bloqueios/" + criado.get("id").asLong() + "/levantamento")
                .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Concluído\"}"), adm, 200));

        Map<String, Object> novo = new LinkedHashMap<>();
        novo.put("nome", "Novo usuário");
        novo.put("email", "novo@exemplo.test");
        novo.put("senha", SENHA_DE_TESTE);
        novo.put("perfil", "SOLICITANTE");
        coletar("UsuarioResposta", chamar(post("/api/usuarios").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(novo)), adm, 201));
        coletar("UsuarioResposta", chamar(get("/api/usuarios"), adm, 200));

        // A auditoria completa vem por último: precisa conter os eventos de criação de bloqueio e de usuário,
        // que não têm estado anterior nem novo.
        coletar("EventoAuditoriaResposta", chamar(get("/api/auditoria"), adm, 200));
    }

    // ---- apoio

    private String entrar(String email) throws Exception {
        JsonNode resposta = chamar(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"senha\":\"" + SENHA_DE_TESTE + "\"}"), null, 200);
        coletar("LoginResposta", resposta);
        return resposta.get("token").asText();
    }

    private long reservar(String token, String titulo, String descricao, String inicio, String fim, long... recursos)
            throws Exception {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("titulo", titulo);
        if (descricao != null) {
            corpo.put("descricao", descricao);
        }
        corpo.put("inicio", local(inicio));
        corpo.put("fim", local(fim));
        corpo.put("recursoIds", java.util.Arrays.stream(recursos).boxed().toList());
        JsonNode criada = chamar(post("/api/reservas").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(corpo)), token, 201);
        coletar("ReservaResposta", criada);
        return criada.get("id").asLong();
    }

    private JsonNode chamar(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder pedido,
                            String token, int esperado) throws Exception {
        if (token != null) {
            pedido.header(HttpHeaders.AUTHORIZATION, bearer(token));
        }
        String corpo = mvc.perform(pedido).andExpect(status().is(esperado)).andReturn().getResponse()
                .getContentAsString();
        return json.readTree(corpo);
    }

    /** Guarda cada objeto da resposta como amostra do esquema. Uma lista vira uma amostra por item. */
    private void coletar(String esquema, JsonNode resposta) {
        List<JsonNode> lista = amostras.computeIfAbsent(esquema, k -> new ArrayList<>());
        if (resposta.isArray()) {
            resposta.forEach(lista::add);
        } else {
            lista.add(resposta);
        }
        if (esquema.equals("RelatorioResposta")) {
            resposta.get("itens").forEach(i -> amostras.computeIfAbsent("ItemRelatorioResposta",
                    k -> new ArrayList<>()).add(i));
        }
    }

    private Set<String> obrigatoriosNoContrato(String esquema) throws Exception {
        JsonNode contrato = json.readTree(mvc.perform(get("/v3/api-docs").header(HttpHeaders.AUTHORIZATION, bearer(s1)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        Set<String> campos = new TreeSet<>();
        contrato.path("components").path("schemas").path(esquema).path("required").forEach(n -> campos.add(n.asText()));
        return campos;
    }

    // ---- CT-134

    @Test
    void ct134_requiredDoContratoConfereComRespostasReais() throws Exception {
        for (var entrada : OBRIGATORIOS.entrySet()) {
            String esquema = entrada.getKey();
            List<JsonNode> reais = amostras.getOrDefault(esquema, List.of());

            assertThat(reais).as("há resposta real de %s para conferir", esquema).isNotEmpty();
            assertThat(obrigatoriosNoContrato(esquema)).as("required de %s no contrato", esquema)
                    .containsExactlyInAnyOrderElementsOf(entrada.getValue());
            for (JsonNode amostra : reais) {
                for (String campo : obrigatoriosNoContrato(esquema)) {
                    assertThat(amostra.hasNonNull(campo)).as("%s traz %s em %s", esquema, campo, amostra).isTrue();
                }
            }
        }
    }

    // ---- CT-135

    @Test
    void ct135_osCamposQueFicaramDeForaRealmenteFaltamEmAlgumaRespostaReal() {
        for (var entrada : COM_AMOSTRA_SEM_O_CAMPO.entrySet()) {
            for (String campo : entrada.getValue()) {
                boolean algumaSem = amostras.get(entrada.getKey()).stream().anyMatch(a -> !a.hasNonNull(campo));
                assertThat(algumaSem).as("%s.%s tem uma resposta real sem o campo", entrada.getKey(), campo).isTrue();
            }
        }
    }
}
