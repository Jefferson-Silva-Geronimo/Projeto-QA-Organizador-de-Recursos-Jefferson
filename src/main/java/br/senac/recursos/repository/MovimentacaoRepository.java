package br.senac.recursos.repository;

import br.senac.recursos.model.Movimentacao;
import br.senac.recursos.model.TipoMovimentacao;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Acesso a dados das retiradas e devoluções de material (RF-09). */
public interface MovimentacaoRepository {

    void registrar(long reservaId, long materialId, TipoMovimentacao tipo, long registradoPorId, Instant agora);

    /** Última movimentação de cada unidade da reserva. Unidade nunca movimentada não aparece. */
    Map<Long, TipoMovimentacao> ultimaPorMaterial(long reservaId);

    List<Movimentacao> listar(long reservaId);
}
