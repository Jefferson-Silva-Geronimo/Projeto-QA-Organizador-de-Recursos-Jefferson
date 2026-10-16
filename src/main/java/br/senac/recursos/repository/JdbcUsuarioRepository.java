package br.senac.recursos.repository;

import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.Usuario;
import br.senac.recursos.repository.UsuarioRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JdbcUsuarioRepository implements UsuarioRepository {

    private static final RowMapper<Usuario> MAPEADOR = (rs, n) -> new Usuario(
            rs.getLong("id"),
            rs.getString("nome"),
            rs.getString("email"),
            rs.getString("senha_hash"),
            Perfil.valueOf(rs.getString("perfil")),
            rs.getBoolean("ativo"));

    private static final String COLUNAS = "id, nome, email, senha_hash, perfil::text as perfil, ativo";

    private final JdbcClient jdbc;

    JdbcUsuarioRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Usuario> buscarPorEmail(String email) {
        return jdbc.sql("select " + COLUNAS + " from usuarios where email = :email")
                .param("email", email).query(MAPEADOR).optional();
    }

    @Override
    public Optional<Usuario> buscarPorId(long id) {
        return jdbc.sql("select " + COLUNAS + " from usuarios where id = :id")
                .param("id", id).query(MAPEADOR).optional();
    }

    @Override
    public List<Usuario> listar() {
        return jdbc.sql("select " + COLUNAS + " from usuarios order by id").query(MAPEADOR).list();
    }

    @Override
    public long contar() {
        return jdbc.sql("select count(*) from usuarios").query(Long.class).single();
    }

    @Override
    public long criar(String nome, String email, String senhaHash, Perfil perfil, Instant criadoEm) {
        return jdbc.sql("""
                        insert into usuarios (nome, email, senha_hash, perfil, criado_em)
                        values (:nome, :email, :hash, cast(:perfil as perfil_usuario), :criado)
                        returning id
                        """)
                .param("nome", nome)
                .param("email", email)
                .param("hash", senhaHash)
                .param("perfil", perfil.name())
                .param("criado", JdbcSessaoRepository.utc(criadoEm))
                .query(Long.class)
                .single();
    }

    @Override
    public void alterarPerfil(long id, Perfil perfil) {
        jdbc.sql("update usuarios set perfil = cast(:perfil as perfil_usuario) where id = :id")
                .param("perfil", perfil.name()).param("id", id).update();
    }

    @Override
    public void desativar(long id) {
        jdbc.sql("update usuarios set ativo = false where id = :id").param("id", id).update();
    }

    @Override
    public List<Long> travarResponsaveisAtivos() {
        return jdbc.sql("""
                        select id from usuarios
                         where perfil = 'RESPONSAVEL' and ativo
                         order by id
                           for update
                        """)
                .query(Long.class).list();
    }

    @Override
    public List<Long> reservasFuturas(long usuarioId, Instant agora) {
        return jdbc.sql("""
                        select id from reservas
                         where solicitante_id = :usuario
                           and estado in ('SOLICITADA', 'APROVADA', 'EM_USO')
                           and fim > :agora
                         order by id
                        """)
                .param("usuario", usuarioId)
                .param("agora", JdbcSessaoRepository.utc(agora))
                .query(Long.class).list();
    }
}
