package br.senac.recursos.repository;

import br.senac.recursos.repository.SessaoRepository;
import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.UsuarioAutenticado;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcSessaoRepository implements SessaoRepository {

    private final JdbcClient jdbc;

    JdbcSessaoRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void criar(long usuarioId, String tokenHash, Instant criadaEm, Instant expiraEm) {
        jdbc.sql("""
                        insert into sessoes (usuario_id, token_hash, criada_em, expira_em)
                        values (:usuario, :hash, :criada, :expira)
                        """)
                .param("usuario", usuarioId)
                .param("hash", tokenHash)
                .param("criada", utc(criadaEm))
                .param("expira", utc(expiraEm))
                .update();
    }

    @Override
    public Optional<UsuarioAutenticado> buscarAtiva(String tokenHash, Instant agora) {
        return jdbc.sql("""
                        select u.id, u.email, u.perfil::text as perfil
                          from sessoes s
                          join usuarios u on u.id = s.usuario_id
                         where s.token_hash = :hash
                           and s.revogada_em is null
                           and s.expira_em > :agora
                           and u.ativo
                        """)
                .param("hash", tokenHash)
                .param("agora", utc(agora))
                .query((rs, n) -> new UsuarioAutenticado(
                        rs.getLong("id"), rs.getString("email"), Perfil.valueOf(rs.getString("perfil"))))
                .optional();
    }

    @Override
    public void revogar(String tokenHash, Instant agora) {
        jdbc.sql("update sessoes set revogada_em = :agora where token_hash = :hash and revogada_em is null")
                .param("agora", utc(agora))
                .param("hash", tokenHash)
                .update();
    }

    @Override
    public void revogarTodas(long usuarioId, Instant agora) {
        jdbc.sql("update sessoes set revogada_em = :agora where usuario_id = :usuario and revogada_em is null")
                .param("agora", utc(agora))
                .param("usuario", usuarioId)
                .update();
    }

    static OffsetDateTime utc(Instant instante) {
        return instante.atOffset(ZoneOffset.UTC);
    }
}
