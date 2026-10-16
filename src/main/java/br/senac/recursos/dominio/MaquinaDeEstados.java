package br.senac.recursos.dominio;

import java.util.EnumSet;
import java.util.Set;

/** Esqueleto da fatia 4.5: ainda não permite nenhuma transição. */
public final class MaquinaDeEstados {

    private MaquinaDeEstados() {
    }

    public static Set<EstadoReserva> destinosPermitidos(EstadoReserva origem) {
        return EnumSet.noneOf(EstadoReserva.class);
    }

    public static boolean permitida(EstadoReserva origem, EstadoReserva destino) {
        return false;
    }

    public static void exigir(EstadoReserva origem, EstadoReserva destino) {
        // ainda não implementado
    }
}
