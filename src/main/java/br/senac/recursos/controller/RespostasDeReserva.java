package br.senac.recursos.controller;

import br.senac.recursos.dto.ReservaDaFilaResposta;
import br.senac.recursos.dto.ReservaResposta;
import br.senac.recursos.model.Reserva;
import br.senac.recursos.model.ReservaDaFila;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.model.regra.PermissoesDaReserva;
import br.senac.recursos.model.regra.PermissoesDeDecisao;
import br.senac.recursos.model.regra.PermissoesDeUso;
import br.senac.recursos.service.UsoService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/** Monta a resposta de uma reserva para o usuário logado, com o que ele pode fazer agora (relógio injetado, ADR-005). */
@Component
class RespostasDeReserva {

    private final Clock relogio;
    private final UsoService uso;

    RespostasDeReserva(Clock relogio, UsoService uso) {
        this.relogio = relogio;
        this.uso = uso;
    }

    ReservaResposta de(UsuarioAutenticado ator, Reserva reserva) {
        return lista(ator, List.of(reserva)).get(0);
    }

    /** Várias reservas de uma vez: a tolerância de não comparecimento é lida uma só vez. */
    List<ReservaResposta> lista(UsuarioAutenticado ator, List<Reserva> reservas) {
        Map<Long, PermissoesDeUso> usos = uso.permissoes(ator, reservas);
        Instant agora = relogio.instant();
        return reservas.stream()
                .map(r -> ReservaResposta.de(r, PermissoesDaReserva.de(r, ator.perfil(), ator.id(), agora), usos.get(r.id())))
                .toList();
    }

    ReservaDaFilaResposta daFila(UsuarioAutenticado ator, ReservaDaFila item) {
        return ReservaDaFilaResposta.de(item,
                PermissoesDeDecisao.de(item.reserva(), ator.perfil(), ator.id(), relogio.instant()));
    }
}
