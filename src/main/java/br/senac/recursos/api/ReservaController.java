package br.senac.recursos.api;

import br.senac.recursos.aplicacao.ReservaServico;
import br.senac.recursos.aplicacao.ReservaServico.Alteracao;
import br.senac.recursos.aplicacao.ReservaServico.NovaReserva;
import br.senac.recursos.aplicacao.porta.ReservaRepositorio.Registro;
import br.senac.recursos.dominio.EstadoReserva;
import br.senac.recursos.dominio.Periodo;
import br.senac.recursos.dominio.UsuarioAutenticado;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Reservas (RF-04). Criam e alteram Solicitante e Responsável; o Administrador só cancela, com motivo
 * (RN-17). O servidor calcula "exige aprovação" e o estado: o valor do cliente é ignorado (RN-10).
 */
@RestController
@RequestMapping("/api/reservas")
class ReservaController {

    record NovaReservaRequisicao(@NotBlank @Size(max = 200) String titulo,
                                 @Size(max = 2000) String descricao,
                                 @NotNull Instant inicio,
                                 @NotNull Instant fim,
                                 @NotEmpty List<@NotNull Long> recursoIds) {
    }

    record AlteracaoRequisicao(@Size(min = 1, max = 200) String titulo,
                               @Size(max = 2000) String descricao,
                               Instant inicio,
                               Instant fim,
                               List<@NotNull Long> recursoIds) {
    }

    record CancelamentoRequisicao(@Size(max = 1000) String motivo) {
    }

    record ReservaResposta(long id, long solicitanteId, String titulo, String descricao, Instant inicio,
                           Instant fim, EstadoReserva estado, boolean exigeAprovacao, String motivo,
                           List<Long> recursoIds) {
        static ReservaResposta de(Registro r) {
            return new ReservaResposta(r.id(), r.solicitanteId(), r.titulo(), r.descricao(), r.inicio(), r.fim(),
                    r.estado(), r.exigeAprovacao(), r.motivo(), r.recursoIds());
        }
    }

    private final ReservaServico reservas;

    ReservaController(ReservaServico reservas) {
        this.reservas = reservas;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SOLICITANTE', 'RESPONSAVEL')")
    @ResponseStatus(HttpStatus.CREATED)
    ReservaResposta criar(@AuthenticationPrincipal UsuarioAutenticado ator,
                          @Valid @RequestBody NovaReservaRequisicao c) {
        Periodo periodo = new Periodo(c.inicio(), c.fim());
        return ReservaResposta.de(reservas.criar(ator,
                new NovaReserva(c.titulo().trim(), c.descricao(), periodo, c.recursoIds())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SOLICITANTE', 'RESPONSAVEL')")
    ReservaResposta alterar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                            @Valid @RequestBody AlteracaoRequisicao c) {
        return ReservaResposta.de(reservas.alterar(ator, id,
                new Alteracao(c.titulo() == null ? null : c.titulo().trim(), c.descricao(), c.inicio(), c.fim(),
                        c.recursoIds())));
    }

    @PostMapping("/{id}/cancelamento")
    ReservaResposta cancelar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                             @Valid @RequestBody(required = false) CancelamentoRequisicao c) {
        return ReservaResposta.de(reservas.cancelar(ator, id, c == null ? null : c.motivo()));
    }

    @GetMapping("/{id}")
    ReservaResposta obter(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id) {
        return ReservaResposta.de(reservas.obter(ator, id));
    }

    @GetMapping
    List<ReservaResposta> listar(@AuthenticationPrincipal UsuarioAutenticado ator) {
        return reservas.listar(ator).stream().map(ReservaResposta::de).toList();
    }
}
