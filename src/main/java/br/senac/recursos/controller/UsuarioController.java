package br.senac.recursos.controller;

import br.senac.recursos.dto.NovoPerfilRequisicao;
import br.senac.recursos.dto.NovoUsuarioRequisicao;
import br.senac.recursos.dto.UsuarioResposta;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.service.UsuarioService;
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

/** Gestão de usuários e perfis. Somente o Administrador (RF-15, RN-17). */
@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMINISTRADOR')")
class UsuarioController {

    private final UsuarioService usuarios;

    UsuarioController(UsuarioService usuarios) {
        this.usuarios = usuarios;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    UsuarioResposta criar(@AuthenticationPrincipal UsuarioAutenticado ator, @Valid @RequestBody NovoUsuarioRequisicao corpo) {
        return UsuarioResposta.de(usuarios.criar(ator, corpo.nome(), corpo.email(), corpo.senha(), corpo.perfil()));
    }

    @PutMapping("/{id}/perfil")
    UsuarioResposta alterarPerfil(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                                  @Valid @RequestBody NovoPerfilRequisicao corpo) {
        return UsuarioResposta.de(usuarios.alterarPerfil(ator, id, corpo.perfil()));
    }

    @PostMapping("/{id}/desativacao")
    UsuarioResposta desativar(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id) {
        return UsuarioResposta.de(usuarios.desativar(ator, id));
    }

    @GetMapping
    List<UsuarioResposta> listar() {
        return usuarios.listar().stream().map(UsuarioResposta::de).toList();
    }
}
