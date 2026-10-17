package br.senac.recursos.suporte;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Só existe no classpath de teste. Provoca falhas internas para verificar o tratamento seguro de erros. */
@RestController
class ExplosaoController {

    private final JdbcTemplate jdbc;

    ExplosaoController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/api/_teste/explosao")
    String explode() {
        throw new IllegalStateException("detalhe interno que não pode vazar: tabela usuarios, senha_hash");
    }

    /** Violação real de constraint: o PostgreSQL devolve o valor da coluna na mensagem de erro. */
    @GetMapping("/api/_teste/violacao")
    String violacao() {
        String sql = "insert into usuarios (nome, email, senha_hash, perfil, criado_em) "
                + "values ('Fictício', 'log.sentinela@exemplo.test', 'x', 'SOLICITANTE', now())";
        jdbc.update(sql);
        jdbc.update(sql);
        return "inalcançável";
    }
}
