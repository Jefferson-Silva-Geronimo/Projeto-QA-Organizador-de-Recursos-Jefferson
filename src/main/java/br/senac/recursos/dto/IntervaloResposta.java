package br.senac.recursos.dto;

import br.senac.recursos.model.IntervaloOcupado;
import java.time.Instant;

public record IntervaloResposta(Instant inicio, Instant fim) {
    public static IntervaloResposta de(IntervaloOcupado i) {
        return new IntervaloResposta(i.inicio(), i.fim());
    }
}
