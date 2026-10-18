package br.senac.recursos.suporte;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Base dos testes de API em caixa-preta: contexto completo, MockMvc, relógio controlado e banco real.
 */
@AutoConfigureMockMvc
@Import(RelogioDeTesteConfig.class)
public abstract class ApiIT extends BancoRealIT {

    protected static final String SENHA_DE_TESTE = "senha-de-teste-1";

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    @Autowired
    protected RelogioDeTeste relogio;

    private final BCryptPasswordEncoder codificador = new BCryptPasswordEncoder();

    @BeforeEach
    void zeraEstado() {
        limparBanco();
        relogio.definir(RelogioDeTesteConfig.INICIAL);
    }

    protected long criarUsuario(String perfil, String email) {
        return criarUsuario(perfil, email, "Usuário de teste");
    }

    protected long criarUsuario(String perfil, String email, String nome) {
        return jdbc.queryForObject(
                "insert into usuarios (nome, email, senha_hash, perfil, criado_em) "
                        + "values (?, ?, ?, cast(? as perfil_usuario), ?) returning id",
                Long.class, nome, email, codificador.encode(SENHA_DE_TESTE), perfil,
                java.sql.Timestamp.from(RelogioDeTesteConfig.INICIAL));
    }

    protected String login(String email) throws Exception {
        String corpo = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"" + SENHA_DE_TESTE + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode no = json.readTree(corpo);
        return no.get("token").asText();
    }

    protected long salaSql(String nome, boolean restrito) {
        long id = jdbc.queryForObject(
                "insert into recursos (tipo, nome, restrito, criado_em) values ('SALA', ?, ?, now()) returning id",
                Long.class, nome, restrito);
        jdbc.update("insert into salas (recurso_id, tipo, capacidade, localizacao, tipo_sala, hora_abertura, hora_fechamento) "
                + "values (?, 'SALA', 30, 'Bloco A', 'AULA', '07:00', '22:00')", id);
        for (int dia = 1; dia <= 5; dia++) {
            jdbc.update("insert into sala_dias_funcionamento (sala_id, dia_semana) values (?, ?)", id, (short) dia);
        }
        return id;
    }

    protected long materialSql(String nome, String patrimonio, boolean restrito) {
        long id = jdbc.queryForObject(
                "insert into recursos (tipo, nome, restrito, criado_em) values ('MATERIAL', ?, ?, now()) returning id",
                Long.class, nome, restrito);
        jdbc.update("insert into materiais (recurso_id, tipo, codigo_patrimonio) values (?, 'MATERIAL', ?)",
                id, patrimonio);
        return id;
    }

    protected long professorSql(String nome, Long usuarioId) {
        long id = jdbc.queryForObject(
                "insert into recursos (tipo, nome, criado_em) values ('PROFESSOR', ?, now()) returning id",
                Long.class, nome);
        jdbc.update("insert into professores (recurso_id, tipo, usuario_id) values (?, 'PROFESSOR', ?)", id, usuarioId);
        return id;
    }

    /** Instante UTC de um horário local de America/Sao_Paulo, em ISO-8601. */
    protected static String local(String dataHoraLocal) {
        return java.time.LocalDateTime.parse(dataHoraLocal)
                .atZone(java.time.ZoneId.of("America/Sao_Paulo")).toInstant().toString();
    }

    protected static String bearer(String token) {
        return "Bearer " + token;
    }

    protected int contar(String sql, Object... argumentos) {
        Integer n = jdbc.queryForObject(sql, Integer.class, argumentos);
        return n == null ? 0 : n;
    }

    protected void agora(String instanteIso) {
        relogio.definir(Instant.parse(instanteIso));
    }
}
