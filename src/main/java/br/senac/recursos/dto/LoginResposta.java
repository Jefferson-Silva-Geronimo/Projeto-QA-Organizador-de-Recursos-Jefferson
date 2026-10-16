package br.senac.recursos.dto;

import br.senac.recursos.model.Perfil;
import java.time.Instant;

public record LoginResposta(String token, Perfil perfil, Instant expiraEm) {
}
