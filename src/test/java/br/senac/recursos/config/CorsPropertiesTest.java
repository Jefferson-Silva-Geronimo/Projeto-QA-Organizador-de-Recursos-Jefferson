package br.senac.recursos.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** CORS nunca aceita curinga (P5-06): uma origem "*" derrubaria a restrição ao front end. */
class CorsPropertiesTest {

    @ParameterizedTest
    @ValueSource(strings = {"*", "https://*.exemplo.test", " * "})
    void origemComCuringaEhRecusada(String origem) {
        assertThatThrownBy(() -> new CorsProperties(List.of(origem)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("curinga");
    }

    @Test
    void semOrigensNenhumaOrigemEhPermitida() {
        assertThat(new CorsProperties(null).origens()).isEmpty();
        assertThat(new CorsProperties(List.of()).origens()).isEmpty();
    }

    @Test
    void origemExplicitaEhAceita() {
        assertThat(new CorsProperties(List.of("https://app.exemplo.test")).origens())
                .containsExactly("https://app.exemplo.test");
    }
}
