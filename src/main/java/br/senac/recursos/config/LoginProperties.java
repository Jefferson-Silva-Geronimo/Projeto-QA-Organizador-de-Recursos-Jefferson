package br.senac.recursos.config;

import br.senac.recursos.model.regra.LimiteDeLogin;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Limite de tentativas de login (SEC-01, P5-10). Obrigatório e sem valor padrão: o valor é a lacuna D18 e nunca foi
 * inventado. Informe por variável de ambiente ({@code LOGIN_TENTATIVAS}, {@code LOGIN_JANELA} em ISO-8601).
 */
@Validated
@ConfigurationProperties(prefix = "app.login")
public record LoginProperties(@NotNull Integer tentativas, @NotNull Duration janela) {

    public LimiteDeLogin limite() {
        return new LimiteDeLogin(tentativas, janela);
    }
}
