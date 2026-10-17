package br.senac.recursos.model;

/** Evento de auditoria já gravado, com o identificador do banco. A trilha é somente inserção (ADR-006). */
public record RegistroDeAuditoria(long id, EventoAuditoria evento) {
}
