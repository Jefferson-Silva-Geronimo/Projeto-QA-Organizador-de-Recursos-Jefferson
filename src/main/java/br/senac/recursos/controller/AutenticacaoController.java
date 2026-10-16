package br.senac.recursos.controller;

import br.senac.recursos.dto.LoginRequisicao;
import br.senac.recursos.dto.LoginResposta;
import br.senac.recursos.dto.UsuarioAtualResposta;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.service.AutenticacaoService;
import jakarta.validation.Valid;
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

    private final AutenticacaoService autenticacao;

    AutenticacaoController(AutenticacaoService autenticacao) {
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
    UsuarioAtualResposta eu(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return new UsuarioAtualResposta(usuario.id(), usuario.email(), usuario.perfil());
    }
}
