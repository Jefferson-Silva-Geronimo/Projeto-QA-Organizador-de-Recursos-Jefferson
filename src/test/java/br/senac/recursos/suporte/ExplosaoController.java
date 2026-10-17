package br.senac.recursos.suporte;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Só existe no classpath de teste. Provoca uma falha interna para verificar o tratamento seguro de erros. */
@RestController
class ExplosaoController {

    @GetMapping("/api/_teste/explosao")
    String explode() {
        throw new IllegalStateException("detalhe interno que não pode vazar: tabela usuarios, senha_hash");
    }
}
