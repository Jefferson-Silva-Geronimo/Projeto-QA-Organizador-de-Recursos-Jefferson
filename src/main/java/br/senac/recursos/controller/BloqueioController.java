package br.senac.recursos.controller;

import br.senac.recursos.dto.BloqueioResposta;
import br.senac.recursos.dto.LevantamentoRequisicao;
import br.senac.recursos.dto.NovoBloqueioRequisicao;
import br.senac.recursos.model.Periodo;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.service.BloqueioService;
import jakarta.validation.Valid;
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

    private final BloqueioService bloqueios;

    BloqueioController(BloqueioService bloqueios) {
        this.bloqueios = bloqueios;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    BloqueioResposta criar(@AuthenticationPrincipal UsuarioAutenticado ator, @Valid @RequestBody NovoBloqueioRequisicao c) {
        var criado = bloqueios.criar(ator, c.recursoId(), new Periodo(c.inicio(), c.fim()), c.motivo(),
                c.reservasConfirmadas());
        return BloqueioResposta.de(criado.bloqueio(), criado.reservasCanceladas());
    }

    @PostMapping("/{id}/levantamento")
    BloqueioResposta levantar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                              @Valid @RequestBody(required = false) LevantamentoRequisicao c) {
        return BloqueioResposta.de(bloqueios.levantar(ator, id, c == null ? null : c.motivo()), List.of());
    }
}
