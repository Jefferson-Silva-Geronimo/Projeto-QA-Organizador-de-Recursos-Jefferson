package br.senac.recursos.model;

import java.time.LocalTime;
import java.util.List;

/**
 * Recurso com os atributos do seu tipo. Campos de outros tipos ficam nulos.
 * Professor: {@code usuarioId} é o vínculo opcional e {@code competencias} a lista de nomes.
 */
public record Recurso(long id, TipoRecurso tipo, String nome, boolean restrito, boolean ativo,
               Integer capacidade, String localizacao, String tipoSala,
               LocalTime horaAbertura, LocalTime horaFechamento, List<Integer> diasFuncionamento,
               String codigoPatrimonio, String descricao,
               Long usuarioId, List<String> competencias) {
}
