package br.senac.recursos.model.regra;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.Periodo;
import java.time.Instant;

/** Regras puras de criação de reserva. O tempo chega por parâmetro, vindo do relógio injetado (ADR-005). */
public final class RegrasDeReserva {

    private RegrasDeReserva() {
    }

    /**
     * D16: o início deve ser posterior ao instante atual. Pela convenção [início, fim) de D10, a reserva
     * que começa no instante atual já começou e não pode mais ser criada.
     */
    public static void exigirInicioFuturo(Periodo periodo, Instant agora) {
        if (!periodo.inicio().isAfter(agora)) {
            throw new ErroDeNegocio(CodigoErro.INICIO_NO_PASSADO);
        }
    }
}
