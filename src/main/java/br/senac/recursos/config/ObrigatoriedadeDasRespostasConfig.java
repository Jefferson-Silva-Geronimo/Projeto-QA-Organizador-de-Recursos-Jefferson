package br.senac.recursos.config;

import io.swagger.v3.oas.models.media.Schema;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Campos obrigatórios das respostas no contrato OpenAPI (RF-14, R-15, F6-10).
 *
 * <p>Só documentação: nenhum comportamento HTTP muda. O Jackson omite campo nulo
 * ({@code default-property-inclusion: non_null}), então "obrigatório" quer dizer "sempre presente". Entra aqui
 * o que o tipo ou o banco garantem (primitivo, coluna {@code NOT NULL}, lista sempre montada). Na dúvida o campo
 * fica de fora e o front trata como opcional. {@code ContratoObrigatoriosApiIT} confere esta lista contra o
 * contrato publicado e contra respostas reais.
 */
@Configuration
class ObrigatoriedadeDasRespostasConfig {

    /**
     * Campos que nunca faltam, por esquema. Ficam de fora, de propósito: {@code descricao} e {@code motivo} da
     * reserva (colunas anuláveis); os campos de {@code RecursoResposta} que dependem do tipo do recurso (sala,
     * professor ou material); {@code atorId}, {@code estadoAnterior}, {@code estadoNovo}, {@code motivo},
     * {@code antes}, {@code depois} e {@code correlacaoId} da auditoria; e {@code utilizacao} do relatório, nula
     * para professor e material (B4).
     */
    static final Map<String, List<String>> OBRIGATORIOS = Map.ofEntries(
            Map.entry("LoginResposta", List.of("token", "perfil", "expiraEm")),
            Map.entry("UsuarioAtualResposta", List.of("id", "email", "perfil")),
            Map.entry("UsuarioResposta", List.of("id", "nome", "email", "perfil", "ativo")),
            Map.entry("RecursoResposta", List.of("id", "tipo", "nome", "restrito", "ativo")),
            Map.entry("ReservaResposta", List.of("id", "solicitanteId", "titulo", "inicio", "fim", "estado",
                    "exigeAprovacao", "recursoIds", "podeAlterar", "podeCancelar")),
            Map.entry("ReservaDaFilaResposta", List.of("id", "solicitanteId", "solicitanteNome", "titulo", "inicio",
                    "fim", "estado", "exigeAprovacao", "recursoIds", "podeAprovar", "podeRejeitar")),
            Map.entry("BloqueioResposta", List.of("id", "recursoId", "inicio", "fim", "motivo", "ativo",
                    "reservasCanceladas")),
            Map.entry("MovimentacaoResposta", List.of("id", "materialId", "tipo", "registradoPorId", "registradoEm")),
            Map.entry("EventoAuditoriaResposta", List.of("id", "ocorridoEm", "atorTipo", "entidade", "entidadeId",
                    "acao")),
            Map.entry("ItemRelatorioResposta", List.of("recursoId", "nome", "tipo", "horasAlocadas",
                    "conflitosEvitados", "solicitantesDistintos")),
            Map.entry("RelatorioResposta", List.of("itens", "pagina", "tamanho", "total")),
            Map.entry("IntervaloResposta", List.of("inicio", "fim")));

    @Bean
    OpenApiCustomizer marcarCamposObrigatoriosDasRespostas() {
        return openApi -> OBRIGATORIOS.forEach((esquema, campos) -> {
            Schema<?> modelo = openApi.getComponents().getSchemas().get(esquema);
            if (modelo != null) {
                modelo.setRequired(new ArrayList<>(campos));
            }
        });
    }
}
