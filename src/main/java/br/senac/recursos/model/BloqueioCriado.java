package br.senac.recursos.model;

import br.senac.recursos.model.Bloqueio;
import java.util.List;

/** Bloqueio criado e as reservas que ele cancelou por inteiro. */
public record BloqueioCriado(Bloqueio bloqueio, List<Long> reservasCanceladas) {
}
