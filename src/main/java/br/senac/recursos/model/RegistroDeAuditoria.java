package br.senac.recursos.model;

/**
 * Evento de auditoria já gravado, com o identificador do banco e o nome de quem agiu (nulo quando o ator é o
 * SISTEMA). O e-mail nunca acompanha o evento. A trilha é somente inserção (ADR-006).
 */
public record RegistroDeAuditoria(long id, EventoAuditoria evento, String atorNome) {
}
