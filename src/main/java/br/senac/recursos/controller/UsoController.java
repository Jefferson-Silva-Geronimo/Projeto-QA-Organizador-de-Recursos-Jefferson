package br.senac.recursos.controller;

import br.senac.recursos.dto.MaterialRequisicao;
import br.senac.recursos.dto.MovimentacaoResposta;
import br.senac.recursos.dto.ReservaResposta;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.service.UsoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Uso da reserva e movimentação de material. Só o Responsável registra (RN-20, RF-09, RF-16); o
 * Responsável dono também opera a própria reserva, com o ator auditado (D13).
 */
@RestController
@RequestMapping("/api/reservas/{id}")
class UsoController {

    private final UsoService uso;
    private final RespostasDeReserva respostas;

    UsoController(UsoService uso, RespostasDeReserva respostas) {
        this.respostas = respostas;
        this.uso = uso;
    }

    @PostMapping("/inicio")
    @PreAuthorize("hasRole('RESPONSAVEL')")
    ReservaResposta iniciar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id) {
        return respostas.de(ator, uso.iniciar(ator, id));
    }

    @PostMapping("/retiradas")
    @PreAuthorize("hasRole('RESPONSAVEL')")
    ReservaResposta retirar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                            @Valid @RequestBody MaterialRequisicao c) {
        return respostas.de(ator, uso.retirar(ator, id, c.materialId()));
    }

    @PostMapping("/devolucoes")
    @PreAuthorize("hasRole('RESPONSAVEL')")
    ReservaResposta devolver(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                             @Valid @RequestBody MaterialRequisicao c) {
        return respostas.de(ator, uso.devolver(ator, id, c.materialId()));
    }

    @PostMapping("/conclusao")
    @PreAuthorize("hasRole('RESPONSAVEL')")
    ReservaResposta concluir(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id) {
        return respostas.de(ator, uso.concluir(ator, id));
    }

    @PostMapping("/nao-comparecimento")
    @PreAuthorize("hasRole('RESPONSAVEL')")
    ReservaResposta naoCompareceu(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id) {
        return respostas.de(ator, uso.marcarNaoCompareceu(ator, id));
    }

    @GetMapping("/movimentacoes")
    List<MovimentacaoResposta> historico(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id) {
        return uso.historico(ator, id).stream().map(MovimentacaoResposta::de).toList();
    }
}
