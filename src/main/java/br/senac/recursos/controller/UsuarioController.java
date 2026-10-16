package br.senac.recursos.controller;

import br.senac.recursos.service.UsuarioService;
import br.senac.recursos.repository.UsuarioRepository.Registro;
import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.UsuarioAutenticado;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    /** Senha: mínimo de 8 caracteres (NIST SP 800-63B) e máximo de 72 bytes do BCrypt. Sem requisito próprio. */
    record NovoUsuario(@NotBlank @Size(max = 200) String nome,
                       @NotBlank @Email @Size(max = 254) String email,
                       @NotBlank @Size(min = 8, max = 72) String senha,
                       @NotNull Perfil perfil) {
    }

    record NovoPerfil(@NotNull Perfil perfil) {
    }

    record UsuarioResposta(long id, String nome, String email, Perfil perfil, boolean ativo) {
        static UsuarioResposta de(Registro r) {
            return new UsuarioResposta(r.id(), r.nome(), r.email(), r.perfil(), r.ativo());
        }
    }

    private final UsuarioService usuarios;

    UsuarioController(UsuarioService usuarios) {
        this.usuarios = usuarios;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    UsuarioResposta criar(@AuthenticationPrincipal UsuarioAutenticado ator, @Valid @RequestBody NovoUsuario corpo) {
        return UsuarioResposta.de(usuarios.criar(ator, corpo.nome(), corpo.email(), corpo.senha(), corpo.perfil()));
    }

    @PutMapping("/{id}/perfil")
    UsuarioResposta alterarPerfil(@AuthenticationPrincipal UsuarioAutenticado ator, @PathVariable long id,
                                  @Valid @RequestBody NovoPerfil corpo) {
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
