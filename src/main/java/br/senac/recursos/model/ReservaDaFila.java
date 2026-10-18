package br.senac.recursos.model;

/** Reserva da fila de aprovações com o nome de quem pediu, nunca o e-mail (RF-07, B3, F6-06b). */
public record ReservaDaFila(Reserva reserva, String solicitanteNome) {
}
