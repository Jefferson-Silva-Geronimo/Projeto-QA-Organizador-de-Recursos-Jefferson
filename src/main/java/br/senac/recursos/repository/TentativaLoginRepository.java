package br.senac.recursos.repository;

import java.time.Instant;
import java.util.List;

/** Falhas de login por conta (SEC-01). O e-mail chega já normalizado. */
public interface TentativaLoginRepository {

    /** Falhas da conta com {@code ocorrida_em} estritamente depois de {@code depoisDe}. */
    List<Instant> falhasDepoisDe(String email, Instant depoisDe);

    void registrarFalha(String email, Instant quando);

    /** Apaga as falhas da conta depois de um login com sucesso. */
    void limpar(String email);

    /** Apaga as falhas de qualquer conta que já saíram da janela. */
    void removerAteInclusive(Instant limite);
}
