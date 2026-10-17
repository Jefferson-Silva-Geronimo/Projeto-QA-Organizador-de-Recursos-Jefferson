package br.senac.recursos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.senac.recursos.suporte.BancoRealIT;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.NestedExceptionUtils;

/**
 * Esquema do banco (ADR-002, ADR-003, ADR-006). CT-007 a CT-011.
 * Os horários usam UTC; a conversão de fuso é testada na fatia das reservas.
 */
class EsquemaIT extends BancoRealIT {

    private static final OffsetDateTime DIA = OffsetDateTime.parse("2026-10-20T00:00:00Z");

    @BeforeEach
    void prepara() {
        assertThat(contar("select count(*) from information_schema.tables where table_name = 'ocupacoes'"))
                .as("tabela ocupacoes existe (migração do esquema aplicada)")
                .isEqualTo(1);
        limparBanco();
    }

    @Test
    void ct007_constraintDeExclusaoImpedeSobreposicao() {
        assertThat(contar("select count(*) from pg_constraint where conname = 'ocupacoes_sem_sobreposicao' and contype = 'x'"))
                .isEqualTo(1);
        long sala = recurso("SALA", "Sala A");
        long reserva = reserva(usuario("SOLICITANTE", "s1@exemplo.test"), hora(14), hora(16));
        ocupacao(sala, reserva, hora(14), hora(16), true);

        assertThatThrownBy(() -> ocupacao(sala, reserva, hora(15), hora(17), true))
                .satisfies(e -> assertThat(sqlState(e)).isEqualTo("23P01"));

        assertThat(contar("select count(*) from ocupacoes where recurso_id = " + sala + " and ativa")).isEqualTo(1);
    }

    @Test
    void ct008_fronteiraSemiabertaNaoConflita() {
        long sala = recurso("SALA", "Sala A");
        long reserva = reserva(usuario("SOLICITANTE", "s1@exemplo.test"), hora(14), hora(18));

        ocupacao(sala, reserva, hora(14), hora(16), true);
        ocupacao(sala, reserva, hora(16), hora(18), true);

        assertThat(contar("select count(*) from ocupacoes where recurso_id = " + sala + " and ativa")).isEqualTo(2);
    }

    @Test
    void ct009_ocupacaoInativaNaoConflita() {
        long sala = recurso("SALA", "Sala A");
        long reserva = reserva(usuario("SOLICITANTE", "s1@exemplo.test"), hora(14), hora(16));

        ocupacao(sala, reserva, hora(14), hora(16), false);
        ocupacao(sala, reserva, hora(14), hora(16), true);

        assertThat(contar("select count(*) from ocupacoes where recurso_id = " + sala + " and ativa")).isEqualTo(1);
    }

    @Test
    void ct010_reservaComFimIgualAoInicioEhRecusada() {
        long usuario = usuario("SOLICITANTE", "s1@exemplo.test");

        assertThatThrownBy(() -> reserva(usuario, hora(14), hora(14)))
                .satisfies(e -> assertThat(sqlState(e)).isEqualTo("23514"));
    }

    @Test
    void ct010_ocupacaoExigeExatamenteUmaOrigem() {
        long sala = recurso("SALA", "Sala A");
        long administrador = usuario("ADMINISTRADOR", "a1@exemplo.test");
        long reserva = reserva(usuario("SOLICITANTE", "s1@exemplo.test"), hora(14), hora(16));
        long bloqueio = bloqueio(sala, administrador, hora(8), hora(12));

        assertThatThrownBy(() -> jdbc.update(
                "insert into ocupacoes (recurso_id, periodo, ativa) values (?, tstzrange(?, ?, '[)'), true)",
                sala, hora(14), hora(16)))
                .satisfies(e -> assertThat(sqlState(e)).isEqualTo("23514"));

        assertThatThrownBy(() -> jdbc.update(
                "insert into ocupacoes (recurso_id, periodo, reserva_id, bloqueio_id, ativa) "
                        + "values (?, tstzrange(?, ?, '[)'), ?, ?, true)",
                sala, hora(14), hora(16), reserva, bloqueio))
                .satisfies(e -> assertThat(sqlState(e)).isEqualTo("23514"));
    }

    @Test
    void ct011_auditoriaEhSomenteInsercao() {
        long administrador = usuario("ADMINISTRADOR", "a1@exemplo.test");
        jdbc.update("insert into auditoria_eventos (ocorrido_em, ator_tipo, ator_id, entidade, entidade_id, acao) "
                + "values (now(), 'USUARIO', ?, 'RECURSO', 1, 'RECURSO_CRIADO')", administrador);

        assertThatThrownBy(() -> jdbc.update("update auditoria_eventos set acao = 'ALTERADO'"))
                .hasMessageContaining("somente inserção");
        assertThatThrownBy(() -> jdbc.update("delete from auditoria_eventos"))
                .hasMessageContaining("somente inserção");

        assertThat(contar("select count(*) from auditoria_eventos where acao = 'RECURSO_CRIADO'")).isEqualTo(1);
    }

    // ---- apoio

    private static OffsetDateTime hora(int h) {
        return DIA.plusHours(h);
    }

    private int contar(String sql) {
        Integer n = jdbc.queryForObject(sql, Integer.class);
        return n == null ? 0 : n;
    }

    private long usuario(String perfil, String email) {
        return jdbc.queryForObject(
                "insert into usuarios (nome, email, senha_hash, perfil, criado_em) "
                        + "values ('Fulano de teste', ?, 'hash-de-teste', cast(? as perfil_usuario), now()) returning id",
                Long.class, email, perfil);
    }

    private long recurso(String tipo, String nome) {
        long id = jdbc.queryForObject(
                "insert into recursos (tipo, nome, criado_em) values (cast(? as tipo_recurso), ?, now()) returning id",
                Long.class, tipo, nome);
        if ("SALA".equals(tipo)) {
            jdbc.update("insert into salas (recurso_id, tipo, capacidade, localizacao, tipo_sala, hora_abertura, hora_fechamento) "
                    + "values (?, 'SALA', 30, 'Bloco A', 'AULA', '07:00', '22:00')", id);
        }
        return id;
    }

    private long reserva(long solicitante, OffsetDateTime inicio, OffsetDateTime fim) {
        return jdbc.queryForObject(
                "insert into reservas (solicitante_id, titulo, inicio, fim, estado, exige_aprovacao, criada_em, atualizada_em) "
                        + "values (?, 'Aula de teste', ?, ?, 'SOLICITADA', false, now(), now()) returning id",
                Long.class, solicitante, inicio, fim);
    }

    private long bloqueio(long recurso, long criadoPor, OffsetDateTime inicio, OffsetDateTime fim) {
        return jdbc.queryForObject(
                "insert into bloqueios_manutencao (recurso_id, inicio, fim, motivo, criado_por_id, criado_em) "
                        + "values (?, ?, ?, 'Manutenção de teste', ?, now()) returning id",
                Long.class, recurso, inicio, fim, criadoPor);
    }

    private void ocupacao(long recurso, long reserva, OffsetDateTime inicio, OffsetDateTime fim, boolean ativa) {
        jdbc.update("insert into ocupacoes (recurso_id, periodo, reserva_id, ativa) "
                + "values (?, tstzrange(?, ?, '[)'), ?, ?)", recurso, inicio, fim, reserva, ativa);
    }

    private static String sqlState(Throwable e) {
        Throwable causa = NestedExceptionUtils.getMostSpecificCause(e);
        return causa instanceof SQLException sql ? sql.getSQLState() : null;
    }
}
