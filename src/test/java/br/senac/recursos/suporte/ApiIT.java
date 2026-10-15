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
        return jdbc.queryForObject(
                "insert into usuarios (nome, email, senha_hash, perfil, criado_em) "
                        + "values (?, ?, ?, cast(? as perfil_usuario), ?) returning id",
                Long.class, "Usuário de teste", email, codificador.encode(SENHA_DE_TESTE), perfil,
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
