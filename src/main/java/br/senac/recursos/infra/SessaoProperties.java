package br.senac.recursos.infra;

import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Duração da sessão. Obrigatória e sem valor padrão: o valor é a lacuna D17 e nunca foi inventado.
 * Informe por variável de ambiente (formato ISO-8601, por exemplo PT30M).
 */
@Validated
@ConfigurationProperties(prefix = "app.sessao")
public record SessaoProperties(@NotNull Duration duracao) {
}
