package br.senac.recursos.repository;

import br.senac.recursos.model.FiltroDeRecursos;
import br.senac.recursos.model.IntervaloOcupado;
import br.senac.recursos.model.NovaSala;
import br.senac.recursos.model.NovoMaterial;
import br.senac.recursos.model.NovoProfessor;
import br.senac.recursos.model.Recurso;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Porta de persistência dos recursos: salas, professores e materiais (ADR-002). */
public interface RecursoRepository {

    long criarSala(NovaSala sala, Instant criadoEm);

    long criarProfessor(NovoProfessor professor, Instant criadoEm);

    long criarMaterial(NovoMaterial material, Instant criadoEm);

    Optional<Recurso> buscarPorId(long id);

    List<Recurso> pesquisar(FiltroDeRecursos filtro);

    /** Ocupações ativas do recurso que tocam o intervalo, sem qualquer dado do dono. */
    List<IntervaloOcupado> ocupacoes(long recursoId, Instant inicio, Instant fim);

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
