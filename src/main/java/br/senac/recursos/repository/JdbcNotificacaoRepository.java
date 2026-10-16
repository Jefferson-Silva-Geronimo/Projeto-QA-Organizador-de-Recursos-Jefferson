package br.senac.recursos.repository;

import br.senac.recursos.model.EventoNotificacao;
import br.senac.recursos.model.Notificacao;
import br.senac.recursos.model.StatusNotificacao;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcNotificacaoRepository implements NotificacaoRepository {

    private final JdbcClient jdbc;

    JdbcNotificacaoRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void inserir(long reservaId, EventoNotificacao evento, long destinatarioId, String chaveIdempotencia,
                        Instant agora) {
        jdbc.sql("""
                        insert into notificacoes (reserva_id, evento, destinatario_id, chave_idempotencia, criada_em)
                        values (:reserva, cast(:evento as evento_notificacao), :destinatario, :chave, :agora)
                        """)
                .param("reserva", reservaId)
                .param("evento", evento.name())
                .param("destinatario", destinatarioId)
                .param("chave", chaveIdempotencia)
                .param("agora", JdbcSessaoRepository.utc(agora))
                .update();
    }

    @Override
    public List<Notificacao> buscarParaEnvio(Instant agora, int limite) {
        return jdbc.sql("""
                        select id, reserva_id, evento::text as evento, destinatario_id, status::text as status,
                               tentativas, chave_idempotencia, proxima_tentativa_em
                          from notificacoes
                         where status = 'PENDENTE'
                           and ((tentativas = 0 and proxima_tentativa_em is null) or proxima_tentativa_em <= :agora)
                         order by id
                         limit :limite
                           for update skip locked
                        """)
                .param("agora", JdbcSessaoRepository.utc(agora))
                .param("limite", limite)
                .query((rs, n) -> {
                    OffsetDateTime proxima = rs.getObject("proxima_tentativa_em", OffsetDateTime.class);
                    return new Notificacao(rs.getLong("id"), rs.getLong("reserva_id"),
                            EventoNotificacao.valueOf(rs.getString("evento")), rs.getLong("destinatario_id"),
                            StatusNotificacao.valueOf(rs.getString("status")), rs.getInt("tentativas"),
                            rs.getString("chave_idempotencia"), proxima == null ? null : proxima.toInstant());
                })
                .list();
    }

    @Override
    public void atualizar(long id, StatusNotificacao status, int tentativas, Instant proximaTentativaEm,
                          Instant enviadaEm) {
        jdbc.sql("""
                        update notificacoes
                           set status = cast(:status as status_notificacao), tentativas = :tentativas,
                               proxima_tentativa_em = :proxima, enviada_em = :enviada
                         where id = :id
                        """)
                .param("status", status.name())
                .param("tentativas", tentativas)
                .param("proxima", proximaTentativaEm == null ? null : JdbcSessaoRepository.utc(proximaTentativaEm))
                .param("enviada", enviadaEm == null ? null : JdbcSessaoRepository.utc(enviadaEm))
                .param("id", id)
                .update();
    }
}
