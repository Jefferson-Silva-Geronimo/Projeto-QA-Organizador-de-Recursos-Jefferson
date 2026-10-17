package br.senac.recursos.model.regra;

import static org.assertj.core.api.Assertions.assertThat;

import br.senac.recursos.model.Periodo;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.EnumSet;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * Horas de funcionamento usadas no denominador da utilização (RN-31, C5, CT-110). A sala funciona das 08:00
 * às 18:00, de segunda a sexta; feriados ficam fora de escopo. Em 2026-10-19 (segunda) o fuso de São Paulo
 * é UTC-3.
 */
class HorasDeFuncionamentoTest {

    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    private static final LocalTime ABERTURA = LocalTime.of(8, 0);
    private static final LocalTime FECHAMENTO = LocalTime.of(18, 0);
    private static final Set<DayOfWeek> SEGUNDA_A_SEXTA = EnumSet.range(DayOfWeek.MONDAY, DayOfWeek.FRIDAY);

    private static Instant local(String dataHora) {
        return LocalDateTime.parse(dataHora).atZone(FUSO).toInstant();
    }

    private static Duration calcular(Set<DayOfWeek> dias, Instant inicio, Instant fim) {
        return HorasDeFuncionamento.calcular(ABERTURA, FECHAMENTO, dias, new Periodo(inicio, fim), FUSO);
    }

    @ParameterizedTest(name = "{0} a {1} -> {2} min")
    @CsvSource({
            "2026-10-19T00:00, 2026-10-20T00:00, 600",   // segunda inteira: só a janela de 10 horas conta
            "2026-10-19T07:00, 2026-10-19T08:00, 0",     // termina exatamente na abertura
            "2026-10-19T07:00, 2026-10-19T08:01, 1",     // um minuto depois da abertura
            "2026-10-19T08:00, 2026-10-19T09:00, 60",    // começa exatamente na abertura
            "2026-10-19T17:00, 2026-10-19T18:00, 60",    // termina exatamente no fechamento
            "2026-10-19T17:59, 2026-10-19T19:00, 1",     // um minuto antes do fechamento
            "2026-10-19T18:00, 2026-10-19T19:00, 0",     // começa exatamente no fechamento
            "2026-10-19T12:00, 2026-10-19T13:30, 90"     // dentro da janela
    })
    void limitesDaJanelaDiaria(String inicio, String fim, long minutosEsperados) {
        assertThat(calcular(SEGUNDA_A_SEXTA, local(inicio), local(fim)))
                .isEqualTo(Duration.ofMinutes(minutosEsperados));
    }

    @ParameterizedTest(name = "{0} a {1} -> {2} min")
    @CsvSource({
            "2026-10-24T00:00, 2026-10-26T00:00, 0",     // sábado e domingo não funcionam
            "2026-10-23T00:00, 2026-10-26T00:00, 600",   // sexta funciona; sábado e domingo não
            "2026-10-23T00:00, 2026-10-27T00:00, 1200",  // sexta e segunda
            "2026-10-19T00:00, 2026-10-24T00:00, 3000"   // semana útil inteira: 5 dias de 10 horas
    })
    void contaSomenteOsDiasDeFuncionamento(String inicio, String fim, long minutosEsperados) {
        assertThat(calcular(SEGUNDA_A_SEXTA, local(inicio), local(fim)))
                .isEqualTo(Duration.ofMinutes(minutosEsperados));
    }

    @Test
    void periodoQueTerminaExatamenteNaMeiaNoiteNaoContaODiaSeguinte() {
        // fim exclusivo (RN-11): a terça às 00:00 não pertence ao período de segunda
        Set<DayOfWeek> soTerca = EnumSet.of(DayOfWeek.TUESDAY);

        assertThat(calcular(soTerca, local("2026-10-19T00:00"), local("2026-10-20T00:00"))).isZero();
    }

    @Test
    void semDiasDeFuncionamentoNaoHaHoras() {
        assertThat(calcular(EnumSet.noneOf(DayOfWeek.class), local("2026-10-19T00:00"), local("2026-10-24T00:00")))
                .isZero();
    }

    @Test
    void aJanelaEInterpretadaNoFusoDaSalaENaoEmUtc() {
        // 10:00Z a 12:00Z são 07:00 a 09:00 em São Paulo: só a hora entre 08:00 e 09:00 é de funcionamento.
        // Em UTC a janela de 08:00 às 18:00 contaria as duas horas.
        Instant inicio = Instant.parse("2026-10-19T10:00:00Z");
        Instant fim = Instant.parse("2026-10-19T12:00:00Z");

        assertThat(calcular(SEGUNDA_A_SEXTA, inicio, fim)).isEqualTo(Duration.ofHours(1));
    }
}
