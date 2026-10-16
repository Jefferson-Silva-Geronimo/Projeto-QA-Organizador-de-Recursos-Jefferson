package br.senac.recursos.controller;

import br.senac.recursos.service.RecursoService;
import br.senac.recursos.repository.RecursoRepository.Detalhe;
import br.senac.recursos.repository.RecursoRepository.Filtro;
import br.senac.recursos.repository.RecursoRepository.Intervalo;
import br.senac.recursos.repository.RecursoRepository.NovaSala;
import br.senac.recursos.repository.RecursoRepository.NovoMaterial;
import br.senac.recursos.repository.RecursoRepository.NovoProfessor;
import br.senac.recursos.model.TipoRecurso;
import br.senac.recursos.model.UsuarioAutenticado;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
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

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    record NovaSalaRequisicao(@NotBlank @Size(max = 200) String nome,
                              @NotNull @Min(1) Integer capacidade,
                              @NotBlank @Size(max = 200) String localizacao,
                              @Size(max = 100) String tipoSala,
                              @NotNull LocalTime horaAbertura,
                              @NotNull LocalTime horaFechamento,
                              @NotEmpty List<@NotNull @Min(1) @Max(7) Integer> diasFuncionamento,
                              boolean restrito) {
    }

    record NovoProfessorRequisicao(@NotBlank @Size(max = 200) String nome,
                                   Long usuarioId,
                                   List<@NotBlank @Size(max = 100) String> competencias,
                                   boolean restrito) {
    }

    record NovoMaterialRequisicao(@NotBlank @Size(max = 200) String nome,
                                  @NotBlank @Size(max = 100) String codigoPatrimonio,
                                  @Size(max = 500) String descricao,
                                  boolean restrito) {
    }

    record RestritoRequisicao(boolean restrito) {
    }

    record RecursoResposta(long id, TipoRecurso tipo, String nome, boolean restrito, boolean ativo,
                           Integer capacidade, String localizacao, String tipoSala,
                           String horaAbertura, String horaFechamento, List<Integer> diasFuncionamento,
                           String codigoPatrimonio, String descricao, Long usuarioId, List<String> competencias) {
        static RecursoResposta de(Detalhe d) {
            return new RecursoResposta(d.id(), d.tipo(), d.nome(), d.restrito(), d.ativo(), d.capacidade(),
                    d.localizacao(), d.tipoSala(),
                    d.horaAbertura() == null ? null : d.horaAbertura().format(HORA),
                    d.horaFechamento() == null ? null : d.horaFechamento().format(HORA),
                    d.diasFuncionamento(), d.codigoPatrimonio(), d.descricao(), d.usuarioId(), d.competencias());
        }
    }

    record IntervaloResposta(Instant inicio, Instant fim) {
        static IntervaloResposta de(Intervalo i) {
            return new IntervaloResposta(i.inicio(), i.fim());
        }
    }

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
        Filtro filtro = new Filtro(tipo, capacidadeMinima, vazioParaNulo(localizacao), vazioParaNulo(competencia),
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
