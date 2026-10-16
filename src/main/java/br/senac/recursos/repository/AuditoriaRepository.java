package br.senac.recursos.repository;

import br.senac.recursos.model.EntidadeAuditada;
import br.senac.recursos.model.EventoAuditoria;
import br.senac.recursos.model.RegistroDeAuditoria;
import java.util.List;

/**
 * Trilha de auditoria, somente inserção (ADR-006). O registro é sempre feito na mesma transação da
 * mudança que ele descreve: falha ao auditar desfaz a mudança.
 */
public interface AuditoriaRepository {

    void registrar(EventoAuditoria evento);

    /** Eventos em ordem de ocorrência. Filtros nulos não filtram. */
    List<RegistroDeAuditoria> listar(EntidadeAuditada entidade, Long entidadeId);
}
