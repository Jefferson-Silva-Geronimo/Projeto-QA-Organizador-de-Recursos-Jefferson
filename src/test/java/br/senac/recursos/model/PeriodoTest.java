package br.senac.recursos.model;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Período semiaberto [início, fim) (RN-01, RN-11). CT-033 e CT-034. Sem Spring, sem relógio real. */
class PeriodoTest {

    @ParameterizedTest(name = "{0} a {1} válido={2}")
    @CsvSource({
            "2026-10-20T17:00:00Z, 2026-10-20T19:00:00Z, true",    // 14:00 às 16:00 locais
            "2026-10-20T17:00:00Z, 2026-10-20T17:00:00Z, false",   // duração zero
            "2026-10-20T19:00:00Z, 2026-10-20T17:00:00Z, false"    // término antes do início
    })
    void ct033_terminoDeveSerPosteriorAoInicio(String inicio, String fim, boolean valido) {
        if (valido) {
            assertThatCode(() -> new Periodo(Instant.parse(inicio), Instant.parse(fim))).doesNotThrowAnyException();
        } else {
            assertThatThrownBy(() -> new Periodo(Instant.parse(inicio), Instant.parse(fim)))
                    .isInstanceOfSatisfying(ErroDeNegocio.class,
                            e -> assertThat(e.codigo()).isEqualTo(CodigoErro.PERIODO_INVALIDO));
        }
    }

    @ParameterizedTest(name = "existente 14:00-16:00, novo {0} a {1}, conflito={2}")
    @CsvSource({
            "2026-10-20T19:00:00Z, 2026-10-20T21:00:00Z, false",       // 16:00-18:00, encosta no fim
            "2026-10-20T18:59:00Z, 2026-10-20T21:00:00Z, true",        // 15:59-18:00
            "2026-10-20T18:59:59.999Z, 2026-10-20T21:00:00Z, true",    // um milissegundo de sobreposição
            "2026-10-20T15:00:00Z, 2026-10-20T17:00:00Z, false",       // 12:00-14:00, encosta no início
            "2026-10-20T15:00:00Z, 2026-10-20T17:00:00.001Z, true",    // 12:00-14:00:00.001
            "2026-10-20T17:30:00Z, 2026-10-20T18:00:00Z, true"         // contido
    })
    void ct034_conflitoEmTrincaNasFronteiras(String inicio, String fim, boolean conflito) {
        Periodo existente = new Periodo(Instant.parse("2026-10-20T17:00:00Z"), Instant.parse("2026-10-20T19:00:00Z"));
        Periodo novo = new Periodo(Instant.parse(inicio), Instant.parse(fim));

        assertThat(novo.sobrepoe(existente)).isEqualTo(conflito);
        assertThat(existente.sobrepoe(novo)).as("simetria").isEqualTo(conflito);
    }
}
