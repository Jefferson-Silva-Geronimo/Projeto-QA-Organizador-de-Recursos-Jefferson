package br.senac.recursos.model;

/** Estados da reserva (RN-05). Fluxo principal: SOLICITADA, APROVADA, EM_USO, CONCLUIDA. */
public enum EstadoReserva {
    SOLICITADA,
    APROVADA,
    EM_USO,
    CONCLUIDA,
    REJEITADA,
    CANCELADA,
    NAO_COMPARECEU;

    /** Estados terminais não mudam mais (RN-18, RN-19). */
    public boolean terminal() {
        return this == CONCLUIDA || this == REJEITADA || this == CANCELADA || this == NAO_COMPARECEU;
    }

    /** Estados em que a reserva ocupa o recurso na constraint de exclusão (ADR-003). */
    public boolean ocupaRecurso() {
        return this == SOLICITADA || this == APROVADA || this == EM_USO;
    }
}
