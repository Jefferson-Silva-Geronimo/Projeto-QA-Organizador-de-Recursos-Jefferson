package br.senac.recursos.repository;

import br.senac.recursos.model.EventoAuditoria;

/**
 * Porta da trilha de auditoria, somente inserção (ADR-006). Sempre chamada na mesma transação da
 * mudança que ela registra: falha ao auditar desfaz a mudança.
 */
public interface AuditoriaRepository {

    void registrar(EventoAuditoria evento);
}
