package br.senac.recursos.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Origens permitidas pelo CORS (P5-06). Sem valor padrão: sem a variável, nenhuma origem é permitida.
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> origens) {
}
