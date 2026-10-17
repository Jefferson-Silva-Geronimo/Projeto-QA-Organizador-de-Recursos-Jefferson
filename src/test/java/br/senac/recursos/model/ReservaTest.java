package br.senac.recursos.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class ReservaTest {

    @Test
    void periodoDaReservaVaiDoInicioAoFimDela() {
        Instant inicio = Instant.parse("2026-10-20T14:00:00Z");
        Instant fim = Instant.parse("2026-10-20T16:00:00Z");
        Reserva reserva = new Reserva(1L, 2L, "Aula", null, inicio, fim, EstadoReserva.APROVADA, false, null,
                List.of(3L));

        assertThat(reserva.periodo()).isEqualTo(new Periodo(inicio, fim));
    }
}
