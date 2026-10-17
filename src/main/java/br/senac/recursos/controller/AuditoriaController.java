package br.senac.recursos.controller;

import br.senac.recursos.dto.EventoAuditoriaResposta;
import br.senac.recursos.model.EntidadeAuditada;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.service.AuditoriaService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Consulta à auditoria (RF-10). A auditoria completa é só do Administrador (C4, RN-26). */
@RestController
class AuditoriaController {

    private final AuditoriaService auditoria;

    AuditoriaController(AuditoriaService auditoria) {
        this.auditoria = auditoria;
    }

    @GetMapping("/api/auditoria")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    List<EventoAuditoriaResposta> listar(@RequestParam(required = false) EntidadeAuditada entidade,
                                         @RequestParam(required = false) Long entidadeId) {
        return auditoria.listar(entidade, entidadeId).stream().map(EventoAuditoriaResposta::de).toList();
    }

    @GetMapping("/api/reservas/{id}/historico")
    List<EventoAuditoriaResposta> historico(@AuthenticationPrincipal UsuarioAutenticado ator,
                                            @PathVariable long id) {
        return auditoria.historicoDaReserva(ator, id).stream().map(EventoAuditoriaResposta::de).toList();
    }
}
