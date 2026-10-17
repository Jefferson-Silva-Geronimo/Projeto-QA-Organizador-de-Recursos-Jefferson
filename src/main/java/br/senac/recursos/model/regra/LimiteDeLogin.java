package br.senac.recursos.model.regra;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Limite de tentativas de login por conta (SEC-01, P5-10): janela deslizante. A conta fica bloqueada enquanto houver
 * {@code tentativas} falhas dentro de {@code janela}. Regra pura, sem Spring, com o tempo recebido de fora.
 */
public record LimiteDeLogin(int tentativas, Duration janela) {

    public LimiteDeLogin {
        if (tentativas < 1) {
            throw new IllegalArgumentException("O limite de tentativas de login precisa ser de ao menos 1.");
        }
        if (janela == null || janela.isZero() || janela.isNegative()) {
            throw new IllegalArgumentException("A janela do limite de login precisa ser positiva.");
        }
    }

    public boolean bloqueado(List<Instant> falhas, Instant agora) {
        long dentroDaJanela = falhas.stream()
                .filter(falha -> Duration.between(falha, agora).compareTo(janela) < 0)
                .count();
        return dentroDaJanela >= tentativas;
    }
}
