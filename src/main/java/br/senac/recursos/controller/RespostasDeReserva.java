package br.senac.recursos.controller;

import br.senac.recursos.dto.ReservaDaFilaResposta;
import br.senac.recursos.dto.ReservaResposta;
import br.senac.recursos.model.Reserva;
import br.senac.recursos.model.ReservaDaFila;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.model.regra.PermissoesDaReserva;
import br.senac.recursos.model.regra.PermissoesDeDecisao;
import java.time.Clock;
import org.springframework.stereotype.Component;

/** Monta a resposta de uma reserva para o usuário logado, com o que ele pode fazer agora (relógio injetado, ADR-005). */
@Component
class RespostasDeReserva {

    private final Clock relogio;

    RespostasDeReserva(Clock relogio) {
        this.relogio = relogio;
    }

    ReservaResposta de(UsuarioAutenticado ator, Reserva reserva) {
        return ReservaResposta.de(reserva, PermissoesDaReserva.de(reserva, ator.perfil(), ator.id(), relogio.instant()));
    }

    ReservaDaFilaResposta daFila(UsuarioAutenticado ator, ReservaDaFila item) {
        return ReservaDaFilaResposta.de(item,
                PermissoesDeDecisao.de(item.reserva(), ator.perfil(), ator.id(), relogio.instant()));
    }
}
