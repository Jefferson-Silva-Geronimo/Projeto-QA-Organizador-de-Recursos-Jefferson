package br.senac.recursos.model.regra;

import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Reserva;
import java.time.Instant;

/** O que o usuário logado pode fazer com uma reserva. Em construção em TDD: por enquanto nega tudo. */
public record PermissoesDaReserva(boolean podeAlterar, boolean podeCancelar) {

    public static PermissoesDaReserva de(Reserva reserva, Perfil perfil, long atorId, Instant agora) {
        return new PermissoesDaReserva(false, false);
    }
}
