package br.senac.recursos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.senac.recursos.suporte.BancoRealIT;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * R-23 e P5-08: um papel de banco que NÃO é dono da tabela, mesmo com todos os privilégios de dados, não consegue
 * alterar, apagar, truncar nem desligar o gatilho da auditoria. O gatilho bloqueia o DML; o fato de não ser dono
 * impede removê-lo.
 *
 * <p>Papel que a aplicação usa de verdade: o mesmo usuário que cria o esquema (dono da tabela). No teste é o
 * usuário do contêiner; no desenvolvimento local, {@code POSTGRES_USER}. Esse papel PODE desligar o gatilho; é o
 * risco aceito de R-23, registrado em docs/decisoes-equipe.md.
 */
class AuditoriaPapelIT extends BancoRealIT {

    @BeforeEach
    void limpa() {
        limparBanco();
    }

    private Connection conectarComo(String papel, String senha) throws SQLException {
        return DriverManager.getConnection(POSTGRES.getJdbcUrl(), papel, senha);
    }

    private static String sqlState(Throwable e) {
        Throwable atual = e;
        while (atual != null) {
            if (atual instanceof SQLException sql && sql.getSQLState() != null) {
                return sql.getSQLState();
            }
            atual = atual.getCause();
        }
        return "";
    }

    @Test
    void papelQueNaoEDonoNaoAlteraNemApagaNemDesligaAAuditoria() throws Exception {
        long administrador = jdbc.queryForObject(
                "insert into usuarios (nome, email, senha_hash, perfil, criado_em) "
                        + "values ('Admin', 'a1@exemplo.test', 'x', 'ADMINISTRADOR', now()) returning id", Long.class);
        jdbc.update("insert into auditoria_eventos (ocorrido_em, ator_tipo, ator_id, entidade, entidade_id, acao) "
                + "values (now(), 'USUARIO', ?, 'RECURSO', 1, 'RECURSO_CRIADO')", administrador);

        String papel = "papel_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String senha = UUID.randomUUID().toString();
        jdbc.execute("create role " + papel + " login password '" + senha + "'");
        try {
            jdbc.execute("grant select, insert, update, delete, truncate on auditoria_eventos to " + papel);
            try (Connection c = conectarComo(papel, senha); Statement s = c.createStatement()) {
                // Com privilégio de DML, quem barra é o gatilho de somente inserção.
                assertThatThrownBy(() -> s.executeUpdate("update auditoria_eventos set acao = 'ALTERADO'"))
                        .hasMessageContaining("somente inserção");
                assertThatThrownBy(() -> s.executeUpdate("delete from auditoria_eventos"))
                        .hasMessageContaining("somente inserção");
                assertThatThrownBy(() -> s.execute("truncate auditoria_eventos"))
                        .hasMessageContaining("somente inserção");
                // Quem não é dono não consegue remover a proteção (42501 = privilégio insuficiente).
                assertThatThrownBy(() -> s.execute("alter table auditoria_eventos disable trigger auditoria_sem_alteracao"))
                        .satisfies(e -> assertThat(sqlState(e)).isEqualTo("42501"));
                assertThatThrownBy(() -> s.execute("drop trigger auditoria_sem_alteracao on auditoria_eventos"))
                        .satisfies(e -> assertThat(sqlState(e)).isEqualTo("42501"));
            }
        } finally {
            jdbc.execute("drop owned by " + papel);
            jdbc.execute("drop role " + papel);
        }

        assertThat(jdbc.queryForObject("select count(*) from auditoria_eventos where acao = 'RECURSO_CRIADO'",
                Integer.class)).isEqualTo(1);
    }
}
