package br.senac.recursos.api;

import br.senac.recursos.aplicacao.AutenticacaoServico;
import br.senac.recursos.dominio.Perfil;
import br.senac.recursos.dominio.UsuarioAutenticado;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Login, saída e identificação da sessão atual (RF-01). */
@RestController
@RequestMapping("/api/auth")
class AutenticacaoController {

    record LoginRequisicao(@NotBlank @Size(max = 254) String email,
                           @NotBlank @Size(max = 72) String senha) {
    }

    record LoginResposta(String token, Perfil perfil, Instant expiraEm) {
    }

    record QuemSou(long id, String email, Perfil perfil) {
    }

    private final AutenticacaoServico autenticacao;

    AutenticacaoController(AutenticacaoServico autenticacao) {
        this.autenticacao = autenticacao;
    }

    @PostMapping("/login")
    LoginResposta entrar(@Valid @RequestBody LoginRequisicao corpo) {
        var sessao = autenticacao.entrar(corpo.email(), corpo.senha());
        return new LoginResposta(sessao.token(), sessao.perfil(), sessao.expiraEm());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void sair(@RequestHeader(HttpHeaders.AUTHORIZATION) String cabecalho) {
        autenticacao.sair(cabecalho.substring("Bearer ".length()).trim());
    }

    @GetMapping("/eu")
    QuemSou eu(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return new QuemSou(usuario.id(), usuario.email(), usuario.perfil());
    }
}
