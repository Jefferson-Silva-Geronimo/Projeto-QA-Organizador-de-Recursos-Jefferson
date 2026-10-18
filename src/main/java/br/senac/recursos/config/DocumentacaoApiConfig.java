package br.senac.recursos.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.method.HandlerMethod;

/**
 * Contrato OpenAPI (RF-14, ADR-010). Cada operação recebe resumo, perfis permitidos e as respostas de erro
 * comuns. Os perfis vêm de {@code @PreAuthorize}, a mesma fonte que a autorização usa, para a documentação
 * não divergir da regra. A interface Swagger UI fica desligada: o contrato é o JSON, que exige autenticação.
 */
@Configuration
class DocumentacaoApiConfig {

    private static final Pattern PERFIL = Pattern.compile("'([A-Z_]+)'");

    /** Resumo de cada operação. Chave: controlador e método. */
    private static final Map<String, String> RESUMOS = Map.ofEntries(
            Map.entry("AutenticacaoController#entrar", "Abre uma sessão com e-mail e senha"),
            Map.entry("AutenticacaoController#sair", "Encerra e revoga a sessão atual"),
            Map.entry("AutenticacaoController#eu", "Identifica o usuário da sessão atual"),
            Map.entry("UsuarioController#criar", "Cria um usuário com um único perfil"),
            Map.entry("UsuarioController#alterarPerfil", "Altera o perfil de um usuário"),
            Map.entry("UsuarioController#desativar", "Desativa um usuário e revoga as sessões dele"),
            Map.entry("UsuarioController#listar", "Lista os usuários"),
            Map.entry("RecursoController#criarSala", "Cadastra uma sala"),
            Map.entry("RecursoController#criarProfessor", "Cadastra um professor"),
            Map.entry("RecursoController#criarMaterial", "Cadastra uma unidade de material"),
            Map.entry("RecursoController#alterarRestrito", "Altera o atributo restrito de um recurso"),
            Map.entry("RecursoController#desativar", "Desativa um recurso sem reservas futuras"),
            Map.entry("RecursoController#obter", "Consulta um recurso"),
            Map.entry("RecursoController#pesquisar", "Pesquisa recursos por tipo, capacidade, localização, "
                    + "competência e disponibilidade"),
            Map.entry("RecursoController#ocupacoes", "Lista os intervalos ocupados de um recurso, sem o dono"),
            Map.entry("ReservaController#criar", "Cria uma reserva"),
            Map.entry("ReservaController#alterar", "Altera uma reserva de forma atômica"),
            Map.entry("ReservaController#cancelar", "Cancela uma reserva"),
            Map.entry("ReservaController#obter", "Consulta uma reserva"),
            Map.entry("ReservaController#listar", "Lista as reservas visíveis ao perfil"),
            Map.entry("ReservaController#aprovar", "Aprova uma reserva que exige aprovação"),
            Map.entry("ReservaController#rejeitar", "Rejeita uma reserva com motivo"),
            Map.entry("ReservaController#fila", "Lista a fila de aprovações"),
            Map.entry("BloqueioController#listar", "Lista os bloqueios de manutenção, ativos e levantados"),
            Map.entry("BloqueioController#criar", "Cria um bloqueio de manutenção, com confirmação"),
            Map.entry("BloqueioController#levantar", "Levanta um bloqueio de manutenção"),
            Map.entry("UsoController#iniciar", "Registra o início de uso da reserva"),
            Map.entry("UsoController#retirar", "Registra a retirada de uma unidade de material"),
            Map.entry("UsoController#devolver", "Registra a devolução de uma unidade de material"),
            Map.entry("UsoController#concluir", "Conclui a reserva em uso"),
            Map.entry("UsoController#naoCompareceu", "Marca o não comparecimento depois da tolerância"),
            Map.entry("UsoController#historico", "Lista retiradas e devoluções da reserva"),
            Map.entry("AuditoriaController#listar", "Consulta a auditoria completa"),
            Map.entry("AuditoriaController#historico", "Consulta o histórico de uma reserva"),
            Map.entry("RelatorioController#utilizacao", "Relatório de utilização, carga horária e conflitos evitados"));

    @Bean
    OpenAPI contrato() {
        return new OpenAPI()
                .info(new Info()
                        .title("Organização de Recursos")
                        .version("0.0.1")
                        .description("API de alocação de salas, professores e materiais sem conflito de horário. "
                                + "Toda resposta de erro traz um código estável no campo code."))
                .components(new io.swagger.v3.oas.models.Components().addSecuritySchemes("sessao",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer")
                                .description("Token opaco devolvido por POST /api/auth/login")))
                .addSecurityItem(new SecurityRequirement().addList("sessao"));
    }

    @Bean
    OperationCustomizer documentarOperacao() {
        return (Operation operacao, HandlerMethod metodo) -> {
            String chave = metodo.getBeanType().getSimpleName() + "#" + metodo.getMethod().getName();
            String resumo = RESUMOS.get(chave);
            if (resumo != null) {
                operacao.setSummary(resumo);
            }
            boolean publico = chave.equals("AutenticacaoController#entrar");
            List<String> perfis = perfisPermitidos(metodo);
            operacao.addExtension("x-perfis", publico ? List.of("PUBLICO")
                    : perfis.isEmpty() ? List.of("QUALQUER_PERFIL_AUTENTICADO") : perfis);

            ApiResponses respostas = operacao.getResponses() != null ? operacao.getResponses() : new ApiResponses();
            adicionar(respostas, "400", "Dados inválidos. O campo code traz VALIDACAO_FALHOU ou o código da regra.");
            if (!publico) {
                adicionar(respostas, "401", "Sem sessão válida. O campo code traz NAO_AUTENTICADO.");
                adicionar(respostas, "403", "Perfil ou posse não permitem a operação. O campo code traz ACESSO_NEGADO.");
            } else {
                adicionar(respostas, "401", "Credenciais inválidas. O campo code traz CREDENCIAIS_INVALIDAS.");
            }
            adicionar(respostas, "404", "Recurso ou reserva não encontrado.");
            adicionar(respostas, "409", "Conflito com uma regra de negócio. O campo code traz o código estável.");
            operacao.setResponses(respostas);
            return operacao;
        };
    }

    private static void adicionar(ApiResponses respostas, String codigo, String descricao) {
        if (!respostas.containsKey(codigo)) {
            respostas.addApiResponse(codigo, new ApiResponse().description(descricao));
        }
    }

    private static List<String> perfisPermitidos(HandlerMethod metodo) {
        PreAuthorize anotacao = metodo.getMethodAnnotation(PreAuthorize.class);
        if (anotacao == null) {
            anotacao = metodo.getBeanType().getAnnotation(PreAuthorize.class);
        }
        List<String> perfis = new ArrayList<>();
        if (anotacao != null) {
            Matcher m = PERFIL.matcher(anotacao.value());
            while (m.find()) {
                perfis.add(m.group(1));
            }
        }
        return perfis;
    }
}
