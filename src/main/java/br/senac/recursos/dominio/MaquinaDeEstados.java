package br.senac.recursos.dominio;

import static br.senac.recursos.dominio.EstadoReserva.APROVADA;
import static br.senac.recursos.dominio.EstadoReserva.CANCELADA;
import static br.senac.recursos.dominio.EstadoReserva.CONCLUIDA;
import static br.senac.recursos.dominio.EstadoReserva.EM_USO;
import static br.senac.recursos.dominio.EstadoReserva.NAO_COMPARECEU;
import static br.senac.recursos.dominio.EstadoReserva.REJEITADA;
import static br.senac.recursos.dominio.EstadoReserva.SOLICITADA;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Transições de estado permitidas da reserva (RN-05, seção 3.1 de regras-negocio.md).
 * Quem pode executar cada uma e sob qual condição está nas políticas e nos casos de uso.
 * APROVADA para SOLICITADA é a alteração que exige nova aprovação (RN-19, D12).
 */
public final class MaquinaDeEstados {

    private static final Map<EstadoReserva, Set<EstadoReserva>> DESTINOS = new EnumMap<>(EstadoReserva.class);

    static {
        for (EstadoReserva e : EstadoReserva.values()) {
            DESTINOS.put(e, EnumSet.noneOf(EstadoReserva.class));
        }
        DESTINOS.get(SOLICITADA).addAll(EnumSet.of(APROVADA, REJEITADA, CANCELADA));
        DESTINOS.get(APROVADA).addAll(EnumSet.of(SOLICITADA, EM_USO, CANCELADA, NAO_COMPARECEU));
        DESTINOS.get(EM_USO).add(CONCLUIDA);
    }

    private MaquinaDeEstados() {
    }

    public static Set<EstadoReserva> destinosPermitidos(EstadoReserva origem) {
        return EnumSet.copyOf(DESTINOS.get(origem));
    }

    public static boolean permitida(EstadoReserva origem, EstadoReserva destino) {
        return DESTINOS.get(origem).contains(destino);
    }

    public static void exigir(EstadoReserva origem, EstadoReserva destino) {
        if (!permitida(origem, destino)) {
            throw new ErroDeNegocio(CodigoErro.TRANSICAO_PROIBIDA);
        }
    }
}
