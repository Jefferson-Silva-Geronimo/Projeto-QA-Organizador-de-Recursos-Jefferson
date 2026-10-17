package br.senac.recursos.model.regra;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Limite de tentativas de login por conta (SEC-01, P5-10): janela deslizante. A conta fica bloqueada enquanto houver
 * {@code tentativas} falhas dentro de {@code janela}. Regra pura, sem Spring, com o tempo recebido de fora.
 */
public record LimiteDeLogin(int tentativas, Duration janela) {

    public boolean bloqueado(List<Instant> falhas, Instant agora) {
        return falhas.size() >= tentativas;
    }
}
