package br.senac.recursos.model.regra;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Limite de tentativas de login (SEC-01). Os valores 3 e 10 minutos existem só no teste: lacuna D18. */
class LimiteDeLoginTest {

    private static final Instant AGORA = Instant.parse("2026-10-20T17:00:00Z");
    private static final LimiteDeLogin LIMITE = new LimiteDeLogin(3, Duration.ofMinutes(10));

    private static List<Instant> falhas(int quantidade) {
        List<Instant> lista = new ArrayList<>();
        for (int i = 0; i < quantidade; i++) {
            lista.add(AGORA.minusSeconds(60L + i));
        }
        return lista;
    }

    @ParameterizedTest(name = "{0} falhas dentro da janela -> bloqueado {1}")
    @CsvSource({"0,false", "2,false", "3,true", "4,true"})
    void bloqueiaSoQuandoAsFalhasChegamAoLimite(int quantidade, boolean esperado) {
        assertThat(LIMITE.bloqueado(falhas(quantidade), AGORA)).isEqualTo(esperado);
    }

    /** Idade da falha em relação à janela de 10 minutos: antes do fim, no fim e depois do fim. */
    @ParameterizedTest(name = "3 falhas com idade de {0} ms -> bloqueado {1}")
    @CsvSource({"599999,true", "600000,false", "600001,false"})
    void falhaSoContaDentroDaJanela(long idadeEmMs, boolean esperado) {
        Instant falha = AGORA.minusMillis(idadeEmMs);

        assertThat(LIMITE.bloqueado(List.of(falha, falha, falha), AGORA)).isEqualTo(esperado);
    }
}
