package br.senac.recursos.model.regra;

import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Reserva;
import java.time.Instant;

/**
 * O que o usuário logado pode decidir na fila de aprovações, calculado pelas mesmas regras que recusam a decisão
 * ({@link PoliticaDeDecisao}) e pelo instante dado (D10). A tela só mostra ou esconde a ação; a recusa pelo código
 * de erro continua valendo como defesa (ADR-004).
 *
 * <p>Só o Responsável decide (RN-06); para os outros perfis os dois campos são falsos. O motivo da rejeição conta
 * como informado: o servidor segue exigindo-o (RN-24).
 */
public record PermissoesDeDecisao(boolean podeAprovar, boolean podeRejeitar) {

    public static PermissoesDeDecisao de(Reserva reserva, Perfil perfil, long atorId, Instant agora) {
        if (perfil != Perfil.RESPONSAVEL) {
            return new PermissoesDeDecisao(false, false);
        }
        boolean dono = reserva.solicitanteId() == atorId;
        return new PermissoesDeDecisao(
                PoliticaDeDecisao.avaliarAprovacao(reserva.estado(), dono, agora, reserva.inicio()).isEmpty(),
                PoliticaDeDecisao.avaliarRejeicao(reserva.estado(), dono).isEmpty());
    }
}
