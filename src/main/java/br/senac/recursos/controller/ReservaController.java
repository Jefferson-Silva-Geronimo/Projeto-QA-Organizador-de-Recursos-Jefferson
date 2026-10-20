package br.senac.recursos.controller;

import br.senac.recursos.dto.AlteracaoReservaRequisicao;
import br.senac.recursos.dto.CancelamentoRequisicao;
import br.senac.recursos.dto.DecisaoRequisicao;
import br.senac.recursos.dto.NovaReservaRequisicao;
import br.senac.recursos.dto.ReservaDaFilaResposta;
import br.senac.recursos.dto.ReservaResposta;
import br.senac.recursos.model.AlteracaoDeReserva;
import br.senac.recursos.model.NovaReserva;
import br.senac.recursos.model.Periodo;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.service.AprovacaoService;
import br.senac.recursos.service.ReservaService;
import jakarta.validation.Valid;
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

    private final ReservaService reservas;
    private final AprovacaoService aprovacoes;
    private final RespostasDeReserva respostas;

    ReservaController(ReservaService reservas, AprovacaoService aprovacoes, RespostasDeReserva respostas) {
        this.reservas = reservas;
        this.aprovacoes = aprovacoes;
        this.respostas = respostas;
    }

    @PostMapping("/{id}/aprovacao")
    @PreAuthorize("hasRole('RESPONSAVEL')")
    ReservaResposta aprovar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                            @Valid @RequestBody(required = false) DecisaoRequisicao c) {
        return respostas.de(ator, aprovacoes.aprovar(ator, id, c == null ? null : c.motivo()));
    }

    @PostMapping("/{id}/rejeicao")
    @PreAuthorize("hasRole('RESPONSAVEL')")
    ReservaResposta rejeitar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                             @Valid @RequestBody(required = false) DecisaoRequisicao c) {
        return respostas.de(ator, aprovacoes.rejeitar(ator, id, c == null ? null : c.motivo()));
    }

    @GetMapping("/fila")
    @PreAuthorize("hasRole('RESPONSAVEL')")
    List<ReservaDaFilaResposta> fila() {
        return aprovacoes.fila().stream().map(ReservaDaFilaResposta::de).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SOLICITANTE', 'RESPONSAVEL')")
    @ResponseStatus(HttpStatus.CREATED)
    ReservaResposta criar(@AuthenticationPrincipal UsuarioAutenticado ator,
                          @Valid @RequestBody NovaReservaRequisicao c) {
        Periodo periodo = new Periodo(c.inicio(), c.fim());
        return respostas.de(ator, reservas.criar(ator,
                new NovaReserva(c.titulo().trim(), c.descricao(), periodo, c.recursoIds())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SOLICITANTE', 'RESPONSAVEL')")
    ReservaResposta alterar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                            @Valid @RequestBody AlteracaoReservaRequisicao c) {
        return respostas.de(ator, reservas.alterar(ator, id,
                new AlteracaoDeReserva(c.titulo() == null ? null : c.titulo().trim(), c.descricao(), c.inicio(), c.fim(),
                        c.recursoIds())));
    }

    @PostMapping("/{id}/cancelamento")
    ReservaResposta cancelar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                             @Valid @RequestBody(required = false) CancelamentoRequisicao c) {
        return respostas.de(ator, reservas.cancelar(ator, id, c == null ? null : c.motivo()));
    }

    @GetMapping("/{id}")
    ReservaResposta obter(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id) {
        return respostas.de(ator, reservas.obter(ator, id));
    }

    @GetMapping
    List<ReservaResposta> listar(@AuthenticationPrincipal UsuarioAutenticado ator) {
        return reservas.listar(ator).stream().map(r -> respostas.de(ator, r)).toList();
    }
}
