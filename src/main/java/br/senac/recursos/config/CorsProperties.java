package br.senac.recursos.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Origens permitidas pelo CORS (P5-06). Sem valor padrão: sem a variável, nenhuma origem é permitida. Origem com
 * curinga é recusada na partida: ela anularia a restrição ao front end.
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> origens) {

    public CorsProperties {
        origens = origens == null ? List.of() : List.copyOf(origens);
        for (String origem : origens) {
            if (origem.contains("*")) {
                throw new IllegalArgumentException("Origem de CORS com curinga não é permitida.");
            }
        }
    }
}
