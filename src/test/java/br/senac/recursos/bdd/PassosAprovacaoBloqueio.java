package br.senac.recursos.bdd;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import br.senac.recursos.suporte.ApiIT;
import br.senac.recursos.suporte.RelogioDeTesteConfig;
import io.cucumber.java.Before;
import io.cucumber.java.pt.Dado;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import io.cucumber.spring.CucumberContextConfiguration;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Passos das features de aprovação e bloqueio. Chama a API por MockMvc com o token de cada perfil, contra o
 * PostgreSQL real e o relógio controlado do {@link ApiIT}. Não contém regra: só monta o cenário, executa o
 * Quando e observa o Então.
 */
@CucumberContextConfiguration
public class PassosAprovacaoBloqueio extends ApiIT {

    private static final String DATA = "(\\d{2}/\\d{2}/\\d{4})";
    private static final String NOME = "\"([^\"]*)\"";

    private final Map<String, String> tokens = new HashMap<>();
    private final Map<String, Long> recursos = new HashMap<>();
    private long reservaAtual;
    private MvcResult resposta;

    @Before
    public void zerarEstado() {
        limparBanco();
        relogio.definir(RelogioDeTesteConfig.INICIAL);
        tokens.clear();
        recursos.clear();
        resposta = null;
    }

    // ---- Dado

    @Dado("o usuário {string} com perfil {word}")
    public void usuario(String nome, String perfil) throws Exception {
        String email = email(nome);
        criarUsuario(perfil, email);
        tokens.put(nome, login(email));
    }

    @Dado("a {string} sem restrição e o {string} restrito")
    public void recursos(String sala, String material) {
        recursos.put(sala, salaSql(sala, false));
        recursos.put(material, materialSql(material, "PAT-" + material.replaceAll("\\W", ""), true));
    }

    @Dado("^uma reserva SOLICITADA de " + NOME + " para a " + NOME + " e o " + NOME + " em " + DATA
            + " das (\\S+) às (\\S+)$")
    public void reservaSolicitada(String dono, String sala, String material, String data, String inicio, String fim)
            throws Exception {
        MvcResult criada = reservar(dono, data, inicio, fim, sala, material);
        assertThat(criada.getResponse().getStatus()).as("criação da reserva do Dado").isEqualTo(201);
        reservaAtual = idDe(criada);
        assertThat(estadoAtual()).isEqualTo("SOLICITADA");
    }

    @Dado("^uma reserva APROVADA de " + NOME + " para a " + NOME + " em " + DATA + " das (\\S+) às (\\S+)$")
    public void reservaAprovada(String dono, String sala, String data, String inicio, String fim) throws Exception {
        MvcResult criada = reservar(dono, data, inicio, fim, sala);
        assertThat(criada.getResponse().getStatus()).as("criação da reserva do Dado").isEqualTo(201);
        reservaAtual = idDe(criada);
        assertThat(estadoAtual()).isEqualTo("APROVADA");
    }

    @Dado("^um bloqueio da " + NOME + " em " + DATA + " das (\\S+) às (\\S+)$")
    public void bloqueioExistente(String sala, String data, String inicio, String fim) throws Exception {
        MvcResult criado = bloquear("administrador", sala, data, inicio, fim);
        assertThat(criado.getResponse().getStatus()).as("criação do bloqueio do Dado").isEqualTo(201);
    }

    // ---- Quando

    @Quando("{string} aprova a reserva")
    public void aprova(String ator) throws Exception {
        resposta = acao(ator, "aprovacao", Map.of());
    }

    @Quando("{string} rejeita a reserva sem informar o motivo")
    public void rejeitaSemMotivo(String ator) throws Exception {
        resposta = acao(ator, "rejeicao", Map.of());
    }

    @Quando("{string} rejeita a reserva com o motivo {string}")
    public void rejeitaComMotivo(String ator, String motivo) throws Exception {
        resposta = acao(ator, "rejeicao", Map.of("motivo", motivo));
    }

    @Quando("{string} conclui a reserva")
    public void conclui(String ator) throws Exception {
        resposta = acao(ator, "conclusao", Map.of());
    }

    @Quando("^" + NOME + " reserva a " + NOME + " em " + DATA + " das (\\S+) às (\\S+)$")
    public void reserva(String ator, String sala, String data, String inicio, String fim) throws Exception {
        resposta = reservar(ator, data, inicio, fim, sala);
    }

    @Quando("^" + NOME + " cria um bloqueio da " + NOME + " em " + DATA + " das (\\S+) às (\\S+)$")
    public void criaBloqueio(String ator, String sala, String data, String inicio, String fim) throws Exception {
        resposta = bloquear(ator, sala, data, inicio, fim);
    }

    // ---- Então

    @Então("a reserva fica {word}")
    public void reservaFica(String estado) {
        assertThat(resposta.getResponse().getStatus()).isEqualTo(200);
        assertThat(estadoAtual()).isEqualTo(estado);
    }

    @Então("o pedido é recusado com {int} e a reserva permanece {word}")
    public void recusadoEReservaPermanece(int status, String estado) {
        assertThat(resposta.getResponse().getStatus()).isEqualTo(status);
        assertThat(estadoAtual()).isEqualTo(estado);
    }

    @Então("o pedido é recusado com {int} e o código {word}")
    public void recusadoComCodigo(int status, String codigo) throws Exception {
        assertThat(resposta.getResponse().getStatus()).isEqualTo(status);
        assertThat(codigoDoErro()).isEqualTo(codigo);
    }

    @Então("^o pedido é recusado com (\\d+) e o código (\\w+), e a reserva permanece (\\w+)$")
    public void recusadoComCodigoEReservaPermanece(int status, String codigo, String estado) throws Exception {
        recusadoComCodigo(status, codigo);
        assertThat(estadoAtual()).isEqualTo(estado);
    }

    @Então("o pedido é recusado com {int}")
    public void recusado(int status) {
        assertThat(resposta.getResponse().getStatus()).isEqualTo(status);
    }

    @Então("o pedido recebe o status {int}")
    public void recebeOStatus(int status) {
        assertThat(resposta.getResponse().getStatus()).isEqualTo(status);
    }

    // ---- apoio

    private MvcResult reservar(String ator, String data, String inicio, String fim, String... nomesDosRecursos)
            throws Exception {
        List<Long> ids = Arrays.stream(nomesDosRecursos).map(recursos::get).toList();
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("titulo", "Aula de teste");
        corpo.put("inicio", local(dataHora(data, inicio)));
        corpo.put("fim", local(dataHora(data, fim)));
        corpo.put("recursoIds", ids);
        return mvc.perform(post("/api/reservas").header(HttpHeaders.AUTHORIZATION, bearer(tokens.get(ator)))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo))).andReturn();
    }

    private MvcResult acao(String ator, String acao, Object corpo) throws Exception {
        return mvc.perform(post("/api/reservas/" + reservaAtual + "/" + acao)
                .header(HttpHeaders.AUTHORIZATION, bearer(tokens.get(ator)))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo))).andReturn();
    }

    private MvcResult bloquear(String ator, String sala, String data, String inicio, String fim) throws Exception {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("recursoId", recursos.get(sala));
        corpo.put("inicio", local(dataHora(data, inicio)));
        corpo.put("fim", local(dataHora(data, fim)));
        corpo.put("motivo", "Manutenção preventiva");
        return mvc.perform(post("/api/bloqueios").header(HttpHeaders.AUTHORIZATION, bearer(tokens.get(ator)))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo))).andReturn();
    }

    private long idDe(MvcResult resultado) throws Exception {
        return json.readTree(resultado.getResponse().getContentAsString()).get("id").asLong();
    }

    private String codigoDoErro() throws Exception {
        return json.readTree(resposta.getResponse().getContentAsString()).get("code").asText();
    }

    private String estadoAtual() {
        return jdbc.queryForObject("select estado::text from reservas where id = ?", String.class, reservaAtual);
    }

    /** "21/10/2026" e "08:00:01" viram "2026-10-21T08:00:01". */
    private static String dataHora(String data, String hora) {
        String[] p = data.split("/");
        return p[2] + "-" + p[1] + "-" + p[0] + "T" + hora;
    }

    /** "responsável 1" vira "responsavel.1@exemplo.test". */
    private static String email(String nome) {
        String semAcento = Normalizer.normalize(nome, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return semAcento.replace(' ', '.') + "@exemplo.test";
    }
}
