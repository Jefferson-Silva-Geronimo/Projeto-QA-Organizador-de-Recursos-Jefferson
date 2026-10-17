package br.senac.recursos.model.regra;

import br.senac.recursos.model.Periodo;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Set;

/**
 * Horas de funcionamento de uma sala dentro de um período (RN-31, C5): soma da parte de cada janela diária,
 * nos dias da semana de funcionamento, que cai dentro do período. Feriados ficam fora de escopo.
 */
public final class HorasDeFuncionamento {

    private HorasDeFuncionamento() {
    }

    public static Duration calcular(LocalTime abertura, LocalTime fechamento, Set<DayOfWeek> dias,
                                    Periodo periodo, ZoneId fuso) {
        LocalDate dia = periodo.inicio().atZone(fuso).toLocalDate();
        LocalDate ultimo = periodo.fim().minusNanos(1).atZone(fuso).toLocalDate();
        Duration total = Duration.ZERO;
        while (!dia.isAfter(ultimo)) {
            if (dias.contains(dia.getDayOfWeek())) {
                Instant inicioDaJanela = dia.atTime(abertura).atZone(fuso).toInstant();
                Instant fimDaJanela = dia.atTime(fechamento).atZone(fuso).toInstant();
                Instant de = inicioDaJanela.isAfter(periodo.inicio()) ? inicioDaJanela : periodo.inicio();
                Instant ate = fimDaJanela.isBefore(periodo.fim()) ? fimDaJanela : periodo.fim();
                if (ate.isAfter(de)) {
                    total = total.plus(Duration.between(de, ate));
                }
            }
            dia = dia.plusDays(1);
        }
        return total;
    }
}
