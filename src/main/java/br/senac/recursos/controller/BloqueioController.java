package br.senac.recursos.controller;

import br.senac.recursos.service.BloqueioService;
import br.senac.recursos.repository.BloqueioRepository.Registro;
import br.senac.recursos.model.Periodo;
import br.senac.recursos.model.UsuarioAutenticado;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Bloqueio de manutenção. Somente o Administrador (RF-08, RN-17). */
@RestController
@RequestMapping("/api/bloqueios")
@PreAuthorize("hasRole('ADMINISTRADOR')")
class BloqueioController {

    record NovoBloqueio(@NotNull Long recursoId, @NotNull Instant inicio, @NotNull Instant fim,
                        @Size(max = 1000) String motivo, List<@NotNull Long> reservasConfirmadas) {
    }

    record Levantamento(@Size(max = 1000) String motivo) {
    }

    record BloqueioResposta(long id, long recursoId, Instant inicio, Instant fim, String motivo, boolean ativo,
                            List<Long> reservasCanceladas) {
        static BloqueioResposta de(Registro r, List<Long> canceladas) {
            return new BloqueioResposta(r.id(), r.recursoId(), r.inicio(), r.fim(), r.motivo(), r.ativo(),
                    canceladas);
        }
    }

    private final BloqueioService bloqueios;

    BloqueioController(BloqueioService bloqueios) {
        this.bloqueios = bloqueios;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    BloqueioResposta criar(@AuthenticationPrincipal UsuarioAutenticado ator, @Valid @RequestBody NovoBloqueio c) {
        var criado = bloqueios.criar(ator, c.recursoId(), new Periodo(c.inicio(), c.fim()), c.motivo(),
                c.reservasConfirmadas());
        return BloqueioResposta.de(criado.bloqueio(), criado.reservasCanceladas());
    }

    @PostMapping("/{id}/levantamento")
    BloqueioResposta levantar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                              @Valid @RequestBody(required = false) Levantamento c) {
        return BloqueioResposta.de(bloqueios.levantar(ator, id, c == null ? null : c.motivo()), List.of());
    }
}
