package br.senac.recursos.infra;

import br.senac.recursos.aplicacao.porta.UsuarioRepositorio;
import br.senac.recursos.dominio.Perfil;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcUsuarioRepositorio implements UsuarioRepositorio {

    private final JdbcClient jdbc;

    JdbcUsuarioRepositorio(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Registro> buscarPorEmail(String email) {
        return jdbc.sql("""
                        select id, nome, email, senha_hash, perfil::text as perfil, ativo
                          from usuarios
                         where email = :email
                        """)
                .param("email", email)
                .query((rs, n) -> new Registro(
                        rs.getLong("id"),
                        rs.getString("nome"),
                        rs.getString("email"),
                        rs.getString("senha_hash"),
                        Perfil.valueOf(rs.getString("perfil")),
                        rs.getBoolean("ativo")))
                .optional();
    }
}
