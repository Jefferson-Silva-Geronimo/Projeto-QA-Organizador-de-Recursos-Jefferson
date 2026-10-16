package br.senac.recursos.model;

import java.time.LocalTime;
import java.util.List;

public record NovaSala(String nome, boolean restrito, int capacidade, String localizacao, String tipoSala,
                LocalTime horaAbertura, LocalTime horaFechamento, List<Integer> diasFuncionamento) {
}
