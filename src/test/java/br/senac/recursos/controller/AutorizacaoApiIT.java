package br.senac.recursos.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.senac.recursos.suporte.ApiIT;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Matriz perfil × operação, acesso a recurso de outro usuário, sessão inválida e entrada inválida
 * (RF-01, RNF-06, RNF-07, RN-06, RN-16, RN-17, RN-26, CEN-02). CT-117 a CT-121.
 *
 * <p>A matriz publicada em {@code docs/testes/matriz-autorizacao.md} é gerada da mesma lista de operações,
 * com {@code -Dgerar.matriz=true}.
 */
class AutorizacaoApiIT extends ApiIT {

    private static final Set<String> TODOS = Set.of("SOLICITANTE", "RESPONSAVEL", "ADMINISTRADOR");
    private static final Set<String> SOL_RESP = Set.of("SOLICITANTE", "RESPONSAVEL");
    private static final Set<String> RESP = Set.of("RESPONSAVEL");
    private static final Set<String> ADM = Set.of("ADMINISTRADOR");
    private static final Set<String> RESP_ADM = Set.of("RESPONSAVEL", "ADMINISTRADOR");

    private static final List<String> PERFIS = List.of("SOLICITANTE", "RESPONSAVEL", "ADMINISTRADOR");

    /** Operação da API, com os perfis que podem executá-la (a regra de autorização por perfil). */
    record Operacao(String nome, HttpMethod metodo, String caminho, Set<String> permitidos, boolean posse) {

        Operacao(String nome, HttpMethod metodo, String caminho, Set<String> permitidos) {
            this(nome, metodo, caminho, permitidos, false);
        }
    }

    /** Todas as operações públicas da API. Os identificadores {id} são trocados por um valor de teste. */
    static final List<Operacao> OPERACOES = List.of(
            new Operacao("Sair", HttpMethod.POST, "/api/auth/logout", TODOS),
            new Operacao("Quem sou eu", HttpMethod.GET, "/api/auth/eu", TODOS),
            new Operacao("Criar usuário", HttpMethod.POST, "/api/usuarios", ADM),
            new Operacao("Alterar perfil", HttpMethod.PUT, "/api/usuarios/{id}/perfil", ADM),
            new Operacao("Desativar usuário", HttpMethod.POST, "/api/usuarios/{id}/desativacao", ADM),
            new Operacao("Listar usuários", HttpMethod.GET, "/api/usuarios", ADM),
            new Operacao("Cadastrar sala", HttpMethod.POST, "/api/salas", ADM),
            new Operacao("Cadastrar professor", HttpMethod.POST, "/api/professores", ADM),
            new Operacao("Cadastrar material", HttpMethod.POST, "/api/materiais", ADM),
            new Operacao("Alterar restrito", HttpMethod.PUT, "/api/recursos/{id}/restrito", ADM),
            new Operacao("Desativar recurso", HttpMethod.POST, "/api/recursos/{id}/desativacao", ADM),
            new Operacao("Consultar recurso", HttpMethod.GET, "/api/recursos/{id}", TODOS),
            new Operacao("Pesquisar recursos", HttpMethod.GET, "/api/recursos", TODOS),
            new Operacao("Ocupações do recurso", HttpMethod.GET, "/api/recursos/{id}/ocupacoes", TODOS),
            new Operacao("Criar reserva", HttpMethod.POST, "/api/reservas", SOL_RESP),
            new Operacao("Alterar reserva", HttpMethod.PUT, "/api/reservas/{id}", SOL_RESP, true),
            new Operacao("Cancelar reserva", HttpMethod.POST, "/api/reservas/{id}/cancelamento", TODOS),
            new Operacao("Consultar reserva", HttpMethod.GET, "/api/reservas/{id}", TODOS),
            new Operacao("Listar reservas", HttpMethod.GET, "/api/reservas", TODOS),
            new Operacao("Aprovar reserva", HttpMethod.POST, "/api/reservas/{id}/aprovacao", RESP),
            new Operacao("Rejeitar reserva", HttpMethod.POST, "/api/reservas/{id}/rejeicao", RESP),
            new Operacao("Fila de aprovações", HttpMethod.GET, "/api/reservas/fila", RESP),
            new Operacao("Criar bloqueio", HttpMethod.POST, "/api/bloqueios", ADM),
            new Operacao("Levantar bloqueio", HttpMethod.POST, "/api/bloqueios/{id}/levantamento", ADM),
            new Operacao("Iniciar uso", HttpMethod.POST, "/api/reservas/{id}/inicio", RESP),
            new Operacao("Retirar material", HttpMethod.POST, "/api/reservas/{id}/retiradas", RESP),
            new Operacao("Devolver material", HttpMethod.POST, "/api/reservas/{id}/devolucoes", RESP),
            new Operacao("Concluir reserva", HttpMethod.POST, "/api/reservas/{id}/conclusao", RESP),
            new Operacao("Marcar não comparecimento", HttpMethod.POST, "/api/reservas/{id}/nao-comparecimento", RESP),
            new Operacao("Movimentações da reserva", HttpMethod.GET, "/api/reservas/{id}/movimentacoes", TODOS),
            new Operacao("Auditoria completa", HttpMethod.GET, "/api/auditoria", ADM),
            new Operacao("Histórico da reserva", HttpMethod.GET, "/api/reservas/{id}/historico", TODOS),
            new Operacao("Relatório de utilização", HttpMethod.GET, "/api/relatorios/utilizacao", RESP_ADM));

    static Stream<Arguments> combinacoes() {
        List<Arguments> lista = new ArrayList<>();
        for (Operacao op : OPERACOES) {
            for (String perfil : PERFIS) {
                lista.add(Arguments.of(op, perfil));
            }
        }
        return lista.stream();
    }

    static Stream<Operacao> protegidas() {
        return OPERACOES.stream();
    }

    private final Map<String, String> tokens = new LinkedHashMap<>();
    private long usuarioAlvo;
    private long reservaDoS2;

    @BeforeEach
    void cenario() throws Exception {
        usuarioAlvo = criarUsuario("SOLICITANTE", "s1@exemplo.test");
        criarUsuario("SOLICITANTE", "s2@exemplo.test");
        criarUsuario("RESPONSAVEL", "r1@exemplo.test");
        criarUsuario("ADMINISTRADOR", "a1@exemplo.test");
        tokens.put("SOLICITANTE", login("s2@exemplo.test"));
        tokens.put("RESPONSAVEL", login("r1@exemplo.test"));
        tokens.put("ADMINISTRADOR", login("a1@exemplo.test"));
        long sala = salaSql("Sala A", false);
        Map<String, Object> corpo = Map.of("titulo", "Aula", "inicio", local("2026-10-21T14:00"),
                "fim", local("2026-10-21T16:00"), "recursoIds", List.of(sala));
        String resposta = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(tokens.get("SOLICITANTE")))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        reservaDoS2 = json.readTree(resposta).get("id").asLong();
    }

    private MvcResult chamar(Operacao op, String token) throws Exception {
        String caminho = op.caminho().replace("{id}", String.valueOf(reservaDoS2));
        var req = request(op.metodo(), caminho).contentType(MediaType.APPLICATION_JSON).content("{}");
        if (token != null) {
            req.header(HttpHeaders.AUTHORIZATION, bearer(token));
        }
        return mvc.perform(req).andReturn();
    }

    private String instantaneo() {
        return String.join("|",
                String.valueOf(contar("select count(*) from usuarios")),
                String.valueOf(contar("select count(*) from recursos")),
                String.valueOf(contar("select count(*) from reservas where estado <> 'APROVADA'")),
                String.valueOf(contar("select count(*) from aprovacoes")),
                String.valueOf(contar("select count(*) from bloqueios_manutencao")),
                String.valueOf(contar("select count(*) from movimentacoes_material")),
                String.valueOf(contar("select count(*) from auditoria_eventos")));
    }

    // ---- CT-117: matriz perfil × operação

    @ParameterizedTest(name = "{0} por {1}")
    @MethodSource("combinacoes")
    void ct117_matrizPerfilXOperacao(Operacao op, String perfil) throws Exception {
        String antes = instantaneo();

        MvcResult r = chamar(op, tokens.get(perfil));

        int status = r.getResponse().getStatus();
        if (op.permitidos().contains(perfil)) {
            if (op.posse() && !perfil.equals("SOLICITANTE")) {
                // Só o dono altera a reserva (RN-19): o perfil passa, a posse recusa. Não é falha de perfil.
                assertThat(status).as("%s por %s", op.nome(), perfil).isNotEqualTo(401);
            } else {
                assertThat(status).as("%s por %s é permitida e não pode dar 401 nem 403", op.nome(), perfil)
                        .isNotIn(401, 403);
            }
        } else {
            assertThat(status).as("%s por %s é proibida", op.nome(), perfil).isEqualTo(403);
            assertThat(instantaneo()).as("operação proibida não muda nada").isEqualTo(antes);
        }
    }

    @Test
    void ct117_matrizPublicadaCorrespondeAAutorizacaoTestada() throws Exception {
        StringBuilder md = new StringBuilder();
        md.append("# Matriz de autorização\n\n")
                .append("Gerada por `AutorizacaoApiIT` com `-Dgerar.matriz=true`, da mesma lista de operações que o ")
                .append("teste executa. Cada célula foi verificada contra a API real: **permitido** significa que ")
                .append("a requisição passa pela autorização (o resultado final depende da regra de negócio); ")
                .append("**403** significa recusa sem mudança de estado. Sem sessão válida, toda operação ")
                .append("retorna **401**, exceto o login.\n\n")
                .append("Fonte dos requisitos: [especificação do projeto]")
                .append("(https://afonsolelis.github.io/aulas_senac/pages/qualidade2/especificacao-projeto.html). ")
                .append("Regras: RN-06, RN-16, RN-17, RN-26 e RF-01.\n\n")
                .append("| Operação | Método e caminho | Solicitante | Responsável | Administrador |\n")
                .append("| --- | --- | --- | --- | --- |\n");
        for (Operacao op : OPERACOES) {
            md.append("| ").append(op.nome()).append(" | `").append(op.metodo()).append(' ').append(op.caminho())
                    .append("` | ");
            for (String perfil : PERFIS) {
                md.append(op.permitidos().contains(perfil) ? "permitido" : "403").append(" | ");
            }
            md.append("\n");
        }
        md.append("\nOperação pública: `POST /api/auth/login`.\n\n")
                .append("## Regras de posse e estado que a matriz não mostra\n\n")
                .append("| Regra | Resultado | Regra de origem |\n")
                .append("| --- | --- | --- |\n")
                .append("| Solicitante lê, altera ou cancela reserva de outro usuário | 403 | RN-26, RN-18, RN-19 |\n")
                .append("| Responsável aprova ou rejeita a própria reserva | 403 | RN-16, RN-33 |\n")
                .append("| Administrador cria reserva | 403 | RN-17 |\n")
                .append("| Solicitante vê o histórico de reserva de outro usuário | 403 | RN-26 |\n");
        Path destino = Path.of("docs", "testes", "matriz-autorizacao.md");
        if (Boolean.getBoolean("gerar.matriz")) {
            Files.createDirectories(destino.getParent());
            Files.writeString(destino, md.toString(), StandardCharsets.UTF_8);
        }

        assertThat(Files.readString(destino, StandardCharsets.UTF_8).replace(System.lineSeparator(), "\n"))
                .as("docs/testes/matriz-autorizacao.md igual à lista de operações testada (regenere com -Dgerar.matriz=true)")
                .isEqualTo(md.toString());
    }

    // ---- CT-118: reserva de outro usuário

    @Test
    void ct118_solicitanteNaoLeNemAlteraNemCancelaReservaDeOutroUsuario() throws Exception {
        long id = reservaDoS2;
        // quem logou como "SOLICITANTE" no cenário é o s2, dono; o s1 é o outro usuário
        String tokenDoOutro = login("s1@exemplo.test");
        String antes = jdbc.queryForObject("select titulo || estado::text from reservas where id = ?", String.class, id);

        mvc.perform(get("/api/reservas/" + id).header(HttpHeaders.AUTHORIZATION, bearer(tokenDoOutro)))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACESSO_NEGADO"));
        mvc.perform(request(HttpMethod.PUT, "/api/reservas/" + id).header(HttpHeaders.AUTHORIZATION, bearer(tokenDoOutro))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"titulo\":\"Invasão\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(request(HttpMethod.POST, "/api/reservas/" + id + "/cancelamento")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenDoOutro))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Sem direito\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/reservas/" + id + "/historico").header(HttpHeaders.AUTHORIZATION, bearer(tokenDoOutro)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/reservas/" + id + "/movimentacoes")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenDoOutro)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(tokenDoOutro)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));

        assertThat(jdbc.queryForObject("select titulo || estado::text from reservas where id = ?", String.class, id))
                .isEqualTo(antes);
        assertThat(usuarioAlvo).isPositive();
    }

    // ---- CT-119: sessão inválida

    @ParameterizedTest(name = "{0}")
    @MethodSource("protegidas")
    void ct119_semTokenComTokenInvalidoRevogadoOuExpiradoRetorna401(Operacao op) throws Exception {
        String revogado = login("r1@exemplo.test");
        mvc.perform(request(HttpMethod.POST, "/api/auth/logout").header(HttpHeaders.AUTHORIZATION, bearer(revogado)))
                .andExpect(status().isNoContent());
        String expirado = login("a1@exemplo.test");
        agora("2026-10-20T19:00:00Z");   // uma hora e um segundo depois do login de teste (PT1H)

        assertThat(chamar(op, null).getResponse().getStatus()).as("sem token").isEqualTo(401);
        assertThat(chamar(op, "token-que-nunca-existiu").getResponse().getStatus()).as("inválido").isEqualTo(401);
        assertThat(chamar(op, revogado).getResponse().getStatus()).as("revogado").isEqualTo(401);
        assertThat(chamar(op, expirado).getResponse().getStatus()).as("expirado").isEqualTo(401);
    }

    // ---- CT-120: entrada inválida

    @Test
    void ct120_entradaInvalidaGeraErroDeValidacaoSemPilhaNemEfeito() throws Exception {
        String admin = tokens.get("ADMINISTRADOR");
        String antes = instantaneo();
        String[][] casos = {
                {"/api/salas", "{}"},
                {"/api/salas", "{\"nome\":\"" + "x".repeat(500) + "\",\"capacidade\":-1}"},
                {"/api/materiais", "{\"nome\":\"N\",\"codigoPatrimonio\":\"" + "p".repeat(500) + "\"}"},
                {"/api/usuarios", "{\"nome\":\"A\",\"email\":\"nao-e-email\",\"senha\":\"curta\",\"perfil\":\"X\"}"},
                {"/api/professores", "{\"nome\":\"P\",\"usuarioId\":\"texto\"}"},
                {"/api/reservas", "{\"titulo\":\"\",\"inicio\":\"ontem\",\"fim\":null,\"recursoIds\":[]}"},
        };

        for (String[] c : casos) {
            MvcResult r = mvc.perform(request(HttpMethod.POST, c[0])
                            .header(HttpHeaders.AUTHORIZATION, bearer(admin))
                            .contentType(MediaType.APPLICATION_JSON).content(c[1]))
                    .andReturn();
            int status = r.getResponse().getStatus();
            String corpo = r.getResponse().getContentAsString();
            assertThat(status).as(c[0]).isIn(400, 403);
            assertThat(corpo).doesNotContain("Exception").doesNotContain("at br.senac").doesNotContain("stackTrace");
        }
        assertThat(instantaneo()).isEqualTo(antes);
    }

    @Test
    void ct120_injecaoEmFiltrosDePesquisaNaoRetornaErroNemAlteraOBanco() throws Exception {
        String antes = instantaneo();
        String[] maliciosos = {"'; drop table usuarios; --", "' or '1'='1", "%27%20OR%201%3D1%20--"};

        for (String texto : maliciosos) {
            mvc.perform(get("/api/recursos").param("localizacao", texto).param("competencia", texto)
                            .header(HttpHeaders.AUTHORIZATION, bearer(tokens.get("SOLICITANTE"))))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        }

        assertThat(instantaneo()).isEqualTo(antes);
        assertThat(contar("select count(*) from information_schema.tables where table_name = 'usuarios'"))
                .isEqualTo(1);
    }

    // ---- CT-121: mensagens sem terceiros

    @Test
    void ct121_recusaPorConflitoNaoIdentificaQuemReservou() throws Exception {
        long sala = jdbc.queryForObject("select id from recursos where nome = 'Sala A'", Long.class);
        String tokenOutro = login("s1@exemplo.test");
        Map<String, Object> corpo = Map.of("titulo", "Concorrente", "inicio", local("2026-10-21T15:00"),
                "fim", local("2026-10-21T17:00"), "recursoIds", List.of(sala));

        String resposta = mvc.perform(request(HttpMethod.POST, "/api/reservas")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenOutro))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo)))
                .andExpect(status().isConflict()).andReturn().getResponse().getContentAsString();

        assertThat(resposta).doesNotContain("s2@exemplo.test").doesNotContain("Usuário de teste")
                .doesNotContain("solicitante").doesNotContain("Aula");
    }
}
