package br.senac.recursos.controller;

import br.senac.recursos.dto.RelatorioResposta;
import br.senac.recursos.model.Periodo;
import br.senac.recursos.model.TipoRecurso;
import br.senac.recursos.service.RelatorioService;
import java.time.Instant;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Relatório RF-12. Responsável e Administrador leem; o Administrador só lê (C4, D5). */
@RestController
@RequestMapping("/api/relatorios")
@PreAuthorize("hasAnyRole('RESPONSAVEL', 'ADMINISTRADOR')")
class RelatorioController {

    private final RelatorioService relatorio;

    RelatorioController(RelatorioService relatorio) {
        this.relatorio = relatorio;
    }

    @GetMapping("/utilizacao")
    RelatorioResposta utilizacao(@RequestParam Instant inicio, @RequestParam Instant fim,
                                 @RequestParam(required = false) TipoRecurso tipo,
                                 @RequestParam(required = false) Long recursoId,
                                 @RequestParam(defaultValue = "0") int pagina,
                                 @RequestParam int tamanho) {
        return RelatorioResposta.de(relatorio.utilizacao(new Periodo(inicio, fim), tipo, recursoId, pagina, tamanho));
    }
}
