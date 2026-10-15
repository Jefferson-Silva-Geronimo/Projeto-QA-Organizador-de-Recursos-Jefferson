package br.senac.recursos.dominio;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Set;

/** Esqueleto da fatia 4.3: ainda sem verificação. */
public record JanelaDeFuncionamento(LocalTime abertura, LocalTime fechamento, Set<DayOfWeek> dias) {

    public void verificar(Periodo periodo, ZoneId fuso) {
        // ainda não implementado
    }
}
