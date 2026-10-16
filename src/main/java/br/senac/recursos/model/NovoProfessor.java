package br.senac.recursos.model;

import java.util.List;

public record NovoProfessor(String nome, boolean restrito, Long usuarioId, List<String> competencias) {
}
