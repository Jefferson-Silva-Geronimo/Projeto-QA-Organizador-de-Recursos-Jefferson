package br.senac.recursos.controller;

import br.senac.recursos.dto.IntervaloResposta;
import br.senac.recursos.dto.NovaSalaRequisicao;
import br.senac.recursos.dto.NovoMaterialRequisicao;
import br.senac.recursos.dto.NovoProfessorRequisicao;
import br.senac.recursos.dto.RecursoResposta;
import br.senac.recursos.dto.RestritoRequisicao;
import br.senac.recursos.model.FiltroDeRecursos;
import br.senac.recursos.model.NovaSala;
import br.senac.recursos.model.NovoMaterial;
import br.senac.recursos.model.NovoProfessor;
import br.senac.recursos.model.TipoRecurso;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.service.RecursoService;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Cadastro e consulta de salas, professores e materiais (RF-02, RF-03). Escrita só do Administrador;
 * leitura para todo usuário autenticado. A consulta de ocupação nunca identifica o dono (RN-26).
 */
@RestController
class RecursoController {

    private final RecursoService recursos;

    RecursoController(RecursoService recursos) {
        this.recursos = recursos;
    }

    @PostMapping("/api/salas")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @ResponseStatus(HttpStatus.CREATED)
    RecursoResposta criarSala(@AuthenticationPrincipal UsuarioAutenticado ator,
                              @Valid @RequestBody NovaSalaRequisicao c) {
        return RecursoResposta.de(recursos.criarSala(ator, new NovaSala(c.nome().trim(), c.restrito(),
                c.capacidade(), c.localizacao().trim(), c.tipoSala(), c.horaAbertura(), c.horaFechamento(),
                c.diasFuncionamento())));
    }

    @PostMapping("/api/professores")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @ResponseStatus(HttpStatus.CREATED)
    RecursoResposta criarProfessor(@AuthenticationPrincipal UsuarioAutenticado ator,
                                   @Valid @RequestBody NovoProfessorRequisicao c) {
        return RecursoResposta.de(recursos.criarProfessor(ator, new NovoProfessor(c.nome().trim(), c.restrito(),
                c.usuarioId(), c.competencias() == null ? List.of() : c.competencias())));
    }

    @PostMapping("/api/materiais")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @ResponseStatus(HttpStatus.CREATED)
    RecursoResposta criarMaterial(@AuthenticationPrincipal UsuarioAutenticado ator,
                                  @Valid @RequestBody NovoMaterialRequisicao c) {
        return RecursoResposta.de(recursos.criarMaterial(ator, new NovoMaterial(c.nome().trim(), c.restrito(),
                c.codigoPatrimonio().trim(), c.descricao())));
    }

    @PutMapping("/api/recursos/{id}/restrito")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    RecursoResposta alterarRestrito(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                                    @RequestBody RestritoRequisicao c) {
        return RecursoResposta.de(recursos.alterarRestrito(ator, id, c.restrito()));
    }

    @PostMapping("/api/recursos/{id}/desativacao")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    RecursoResposta desativar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id) {
        return RecursoResposta.de(recursos.desativar(ator, id));
    }

    @GetMapping("/api/recursos/{id}")
    RecursoResposta obter(@PathVariable long id) {
        return RecursoResposta.de(recursos.obter(id));
    }

    @GetMapping("/api/recursos")
    List<RecursoResposta> pesquisar(@RequestParam(required = false) TipoRecurso tipo,
                                    @RequestParam(required = false) Integer capacidadeMinima,
                                    @RequestParam(required = false) String localizacao,
                                    @RequestParam(required = false) String competencia,
                                    @RequestParam(required = false) Instant inicio,
                                    @RequestParam(required = false) Instant fim) {
        FiltroDeRecursos filtro = new FiltroDeRecursos(tipo, capacidadeMinima, vazioParaNulo(localizacao), vazioParaNulo(competencia),
                inicio, fim);
        return recursos.pesquisar(filtro).stream().map(RecursoResposta::de).toList();
    }

    @GetMapping("/api/recursos/{id}/ocupacoes")
    List<IntervaloResposta> ocupacoes(@PathVariable long id, @RequestParam Instant inicio,
                                      @RequestParam Instant fim) {
        return recursos.ocupacoes(id, inicio, fim).stream().map(IntervaloResposta::de).toList();
    }

    private static String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
