package br.senac.recursos.model.regra;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.Periodo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.EnumSet;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Janela e dias de funcionamento da sala (RN-14). CT-036 e CT-037. */
class JanelaDeFuncionamentoTest {

    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

    /** Sala A: 07:00 às 22:00, de segunda a sexta. */
    private static final JanelaDeFuncionamento SALA_A = new JanelaDeFuncionamento(
            LocalTime.of(7, 0), LocalTime.of(22, 0),
            EnumSet.range(DayOfWeek.MONDAY, DayOfWeek.FRIDAY));

    private static Periodo local(String inicio, String fim) {
        return new Periodo(LocalDateTime.parse(inicio).atZone(FUSO).toInstant(),
                LocalDateTime.parse(fim).atZone(FUSO).toInstant());
    }

    @ParameterizedTest(name = "{0} a {1} -> {2}")
    @CsvSource({
            "2026-10-20T07:00, 2026-10-20T22:00, ACEITA",              // terça, a janela inteira
            "2026-10-20T07:00, 2026-10-20T07:01, ACEITA",              // abertura exata
            "2026-10-20T21:59, 2026-10-20T22:00, ACEITA",              // fechamento exato
            "2026-10-20T06:59, 2026-10-20T08:00, FORA_DA_JANELA",      // um minuto antes da abertura
            "2026-10-20T06:00, 2026-10-20T08:00, FORA_DA_JANELA",
            "2026-10-20T21:00, 2026-10-20T22:01, FORA_DA_JANELA",      // um minuto depois do fechamento
            "2026-10-20T21:00, 2026-10-20T23:00, FORA_DA_JANELA",
            "2026-10-20T23:00, 2026-10-21T01:00, CRUZA_MEIA_NOITE"
    })
    void ct036_reservaPrecisaCaberNaJanelaSemCruzarAMeiaNoite(String inicio, String fim, String esperado) {
        Periodo periodo = local(inicio, fim);

        if (esperado.equals("ACEITA")) {
            assertThatCode(() -> SALA_A.verificar(periodo, FUSO)).doesNotThrowAnyException();
        } else {
            assertThatThrownBy(() -> SALA_A.verificar(periodo, FUSO))
                    .isInstanceOfSatisfying(ErroDeNegocio.class,
                            e -> assertThat(e.codigo()).isEqualTo(CodigoErro.valueOf(esperado)));
        }
    }

    @ParameterizedTest(name = "{0} é dia sem funcionamento")
    @CsvSource({
            "2026-10-24T10:00, 2026-10-24T12:00",    // sábado
            "2026-10-25T10:00, 2026-10-25T12:00"     // domingo
    })
    void ct037_diaSemFuncionamentoEhRecusado(String inicio, String fim) {
        assertThatThrownBy(() -> SALA_A.verificar(local(inicio, fim), FUSO))
                .isInstanceOfSatisfying(ErroDeNegocio.class,
                        e -> assertThat(e.codigo()).isEqualTo(CodigoErro.DIA_SEM_FUNCIONAMENTO));
    }

    @ParameterizedTest(name = "{0}")
    @CsvSource({"2026-10-19T10:00, 2026-10-19T12:00", "2026-10-23T10:00, 2026-10-23T12:00"})
    void ct037_segundaESextaFuncionam(String inicio, String fim) {
        assertThatCode(() -> SALA_A.verificar(local(inicio, fim), FUSO)).doesNotThrowAnyException();
    }
}
