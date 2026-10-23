package br.senac.recursos.config;

import io.swagger.v3.oas.models.media.Schema;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Campos obrigatórios das requisições no contrato OpenAPI (RF-08, RF-14, R-15, F6-19).
 *
 * <p>Só documentação: nenhum comportamento HTTP muda. O servidor sempre exigiu o motivo ao criar e ao levantar um
 * bloqueio e responde {@code 400 MOTIVO_OBRIGATORIO} sem ele (RN-22 e D15). Marcar o campo com a validação do Bean
 * Validation mudaria o código de erro para {@code VALIDACAO_FALHOU}, então o contrato é corrigido aqui, sem validar
 * de novo. Sem isto, o cliente gerado aceitava um corpo que o servidor recusa. {@code ContratoDeRequisicoesApiIT}
 * (CT-166 e CT-167) confere o contrato e o comportamento.
 */
@Configuration
class ObrigatoriedadeDasRequisicoesConfig {

    /** Campos acrescentados ao {@code required} que já existe, por esquema de requisição. */
    static final Map<String, List<String>> ACRESCENTADOS = Map.of(
            "NovoBloqueioRequisicao", List.of("motivo"),
            "LevantamentoRequisicao", List.of("motivo"));

    @Bean
    OpenApiCustomizer marcarMotivoDoBloqueioComoObrigatorio() {
        return openApi -> ACRESCENTADOS.forEach((esquema, campos) -> {
            Schema<?> modelo = openApi.getComponents().getSchemas().get(esquema);
            if (modelo == null) {
                return;
            }
            List<String> obrigatorios = new ArrayList<>(modelo.getRequired() == null ? List.of() : modelo.getRequired());
            campos.stream().filter(campo -> !obrigatorios.contains(campo)).forEach(obrigatorios::add);
            modelo.setRequired(obrigatorios);
        });
    }
}
