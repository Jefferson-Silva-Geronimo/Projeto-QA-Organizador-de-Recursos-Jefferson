package br.senac.recursos.dominio;

import java.time.Instant;
import java.util.Objects;

/** Esqueleto da fatia 4.3: ainda sem validação nem conflito. */
public record Periodo(Instant inicio, Instant fim) {

    public Periodo {
        Objects.requireNonNull(inicio, "inicio");
        Objects.requireNonNull(fim, "fim");
    }

    public boolean sobrepoe(Periodo outro) {
        return false;
    }
}
