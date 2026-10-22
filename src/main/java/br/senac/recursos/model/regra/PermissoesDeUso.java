package br.senac.recursos.model.regra;

import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Reserva;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * O que o usuário logado pode fazer no uso da reserva, calculado pelas mesmas regras que recusam a operação
 * ({@link PoliticaDeUso}) e pelo instante dado (D1). A tela só mostra ou esconde a ação; a recusa pelo código de erro
 * continua valendo como defesa (ADR-004).
 *
 * <p>Só o Responsável registra o uso (RN-20), seja ou não o dono da reserva (D13); para os outros perfis os três
 * campos são falsos. Retirar e devolver cada unidade saem da movimentação atual do histórico, não daqui.
 */
public record PermissoesDeUso(boolean podeIniciar, boolean podeConcluir, boolean podeMarcarNaoComparecimento) {

    public static PermissoesDeUso nenhuma() {
        return new PermissoesDeUso(false, false, false);
    }

    public static PermissoesDeUso de(Reserva reserva, Perfil perfil, boolean haMaterialPendente,
                                     Optional<Duration> tolerancia, Instant agora) {
        if (perfil != Perfil.RESPONSAVEL) {
            return nenhuma();
        }
        return new PermissoesDeUso(
                PoliticaDeUso.avaliarInicio(reserva.estado()).isEmpty(),
                PoliticaDeUso.avaliarConclusao(reserva.estado(), haMaterialPendente).isEmpty(),
                PoliticaDeUso.avaliarNaoComparecimento(reserva.estado(), tolerancia, agora, reserva.inicio()).isEmpty());
    }
}
