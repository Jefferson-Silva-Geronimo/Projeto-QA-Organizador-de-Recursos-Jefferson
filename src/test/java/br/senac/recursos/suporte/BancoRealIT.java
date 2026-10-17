package br.senac.recursos.suporte;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Base dos testes de integração: PostgreSQL 17 real em container, sem H2 (ADR-009).
 * O container é compartilhado por todas as classes da execução.
 */
@SpringBootTest
public abstract class BancoRealIT {

    /** Imagem fixada por digest: a tag móvel "17" mudaria o banco do teste sem alterar o código. */
    private static final String IMAGEM_POSTGRES =
            "postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3";

    protected static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse(IMAGEM_POSTGRES).asCompatibleSubstituteFor("postgres"));

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void propriedades(DynamicPropertyRegistry registro) {
        registro.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registro.add("spring.datasource.username", POSTGRES::getUsername);
        registro.add("spring.datasource.password", POSTGRES::getPassword);
        // Valor de teste. A duração real da sessão é a lacuna D17 e não tem valor definido.
        registro.add("app.sessao.duracao", () -> "PT1H");
    }

    @Autowired
    protected JdbcTemplate jdbc;

    /** Esvazia as tabelas de dados. A configuração (linha única) é preservada. */
    protected void limparBanco() {
        jdbc.execute("ALTER TABLE auditoria_eventos DISABLE TRIGGER USER");
        List<String> tabelas = List.of("sessoes", "notificacoes", "movimentacoes_material", "aprovacoes",
                "tentativas_conflito", "ocupacoes", "bloqueios_manutencao", "reservas", "auditoria_eventos",
                "professor_competencias", "competencias", "sala_dias_funcionamento", "materiais",
                "professores", "salas", "recursos", "usuarios");
        jdbc.execute("TRUNCATE TABLE " + String.join(", ", tabelas) + " RESTART IDENTITY CASCADE");
        jdbc.execute("ALTER TABLE auditoria_eventos ENABLE TRIGGER USER");
    }
}
