package br.senac.recursos.aplicacao.porta;

import br.senac.recursos.dominio.TipoRecurso;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/** Porta de persistência dos recursos: salas, professores e materiais (ADR-002). */
public interface RecursoRepositorio {

    /**
     * Recurso com os atributos do seu tipo. Campos de outros tipos ficam nulos.
     * Professor: {@code usuarioId} é o vínculo opcional e {@code competencias} a lista de nomes.
     */
    record Detalhe(long id, TipoRecurso tipo, String nome, boolean restrito, boolean ativo,
                   Integer capacidade, String localizacao, String tipoSala,
                   LocalTime horaAbertura, LocalTime horaFechamento, List<Integer> diasFuncionamento,
                   String codigoPatrimonio, String descricao,
                   Long usuarioId, List<String> competencias) {
    }

    record NovaSala(String nome, boolean restrito, int capacidade, String localizacao, String tipoSala,
                    LocalTime horaAbertura, LocalTime horaFechamento, List<Integer> diasFuncionamento) {
    }

    record NovoProfessor(String nome, boolean restrito, Long usuarioId, List<String> competencias) {
    }

    record NovoMaterial(String nome, boolean restrito, String codigoPatrimonio, String descricao) {
    }

    /** Filtros da pesquisa. Campos nulos não filtram. O intervalo é semiaberto [inicio, fim). */
    record Filtro(TipoRecurso tipo, Integer capacidadeMinima, String localizacao, String competencia,
                  Instant inicio, Instant fim) {
    }

    record Intervalo(Instant inicio, Instant fim) {
    }

    long criarSala(NovaSala sala, Instant criadoEm);

    long criarProfessor(NovoProfessor professor, Instant criadoEm);

    long criarMaterial(NovoMaterial material, Instant criadoEm);

    Optional<Detalhe> buscarPorId(long id);

    List<Detalhe> pesquisar(Filtro filtro);

    /** Ocupações ativas do recurso que tocam o intervalo, sem qualquer dado do dono. */
    List<Intervalo> ocupacoes(long recursoId, Instant inicio, Instant fim);

    void alterarRestrito(long id, boolean restrito);

    void desativar(long id);

    /** Trava a linha do recurso até o fim da transação. */
    boolean travar(long id);

    /**
     * Trava os recursos em modo compartilhado, ordenados por identificador, até o fim da transação.
     * Impede a desativação concorrente e fixa a ordem de aquisição (ADR-003). Devolve os que existem.
     */
    List<Long> travarCompartilhado(List<Long> ids);

    /** Reservas SOLICITADA, APROVADA ou EM_USO do recurso com término posterior a {@code agora} (D11). */
    List<Long> reservasFuturas(long recursoId, Instant agora);
}
