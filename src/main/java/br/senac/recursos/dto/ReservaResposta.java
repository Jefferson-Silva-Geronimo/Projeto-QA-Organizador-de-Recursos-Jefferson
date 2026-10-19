package br.senac.recursos.dto;

import br.senac.recursos.model.EstadoReserva;
import br.senac.recursos.model.Reserva;
import br.senac.recursos.model.regra.PermissoesDaReserva;
import java.time.Instant;
import java.util.List;

/**
 * Reserva como o usuário logado a vê. {@code podeAlterar} e {@code podeCancelar} dizem o que ele pode fazer agora
 * com ela (F6-14): a tela só mostra ou esconde a ação, e a recusa pelo código estável continua valendo.
 */
public record ReservaResposta(long id, long solicitanteId, String titulo, String descricao, Instant inicio,
                       Instant fim, EstadoReserva estado, boolean exigeAprovacao, String motivo,
                       List<Long> recursoIds, boolean podeAlterar, boolean podeCancelar) {
    public static ReservaResposta de(Reserva r, PermissoesDaReserva permissoes) {
        return new ReservaResposta(r.id(), r.solicitanteId(), r.titulo(), r.descricao(), r.inicio(), r.fim(),
                r.estado(), r.exigeAprovacao(), r.motivo(), r.recursoIds(), permissoes.podeAlterar(),
                permissoes.podeCancelar());
    }
}
