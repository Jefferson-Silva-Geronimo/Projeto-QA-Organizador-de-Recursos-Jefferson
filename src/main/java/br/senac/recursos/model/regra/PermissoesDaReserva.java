package br.senac.recursos.model.regra;

import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Reserva;
import java.time.Instant;

/**
 * O que o usuário logado pode fazer com uma reserva, calculado pelas mesmas políticas que recusam a operação
 * ({@link PoliticaDeAlteracao} e {@link PoliticaDeCancelamento}) e pelo instante dado (D10). A tela só mostra ou
 * esconde a ação; a recusa pelo código de erro continua valendo como defesa (ADR-004).
 *
 * <p>O motivo do cancelamento conta como informado: quem precisa dele (Responsável e Administrador, RN-18) pode
 * cancelar informando-o, e o servidor segue exigindo-o. A alteração é só de Solicitante e Responsável (RN-17).
 */
public record PermissoesDaReserva(boolean podeAlterar, boolean podeCancelar) {

    public static PermissoesDaReserva de(Reserva reserva, Perfil perfil, long atorId, Instant agora) {
        boolean dono = reserva.solicitanteId() == atorId;
        boolean alteraria = perfil != Perfil.ADMINISTRADOR
                && PoliticaDeAlteracao.avaliar(reserva.estado(), dono, agora, reserva.inicio()).isEmpty();
        boolean cancelaria = PoliticaDeCancelamento
                .avaliar(reserva.estado(), perfil, dono, agora, reserva.inicio(), true).isEmpty();
        return new PermissoesDaReserva(alteraria, cancelaria);
    }
}
