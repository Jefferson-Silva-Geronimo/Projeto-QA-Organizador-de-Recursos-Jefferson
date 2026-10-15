package br.senac.recursos.dominio;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Set;

/**
 * Janela diária e dias da semana de funcionamento de uma sala (RN-14). O instante é convertido para
 * o fuso configurado (A6) só aqui, para comparar com o horário local da sala.
 * A reserva não cruza a meia-noite local nesta versão (suposição S3).
 */
public record JanelaDeFuncionamento(LocalTime abertura, LocalTime fechamento, Set<DayOfWeek> dias) {

    public JanelaDeFuncionamento {
        dias = Set.copyOf(dias);
    }

    public void verificar(Periodo periodo, ZoneId fuso) {
        ZonedDateTime inicio = periodo.inicio().atZone(fuso);
        ZonedDateTime fim = periodo.fim().atZone(fuso);
        if (!inicio.toLocalDate().equals(fim.toLocalDate())) {
            throw new ErroDeNegocio(CodigoErro.CRUZA_MEIA_NOITE);
        }
        if (!dias.contains(inicio.getDayOfWeek())) {
            throw new ErroDeNegocio(CodigoErro.DIA_SEM_FUNCIONAMENTO);
        }
        if (inicio.toLocalTime().isBefore(abertura) || fim.toLocalTime().isAfter(fechamento)) {
            throw new ErroDeNegocio(CodigoErro.FORA_DA_JANELA);
        }
    }
}
