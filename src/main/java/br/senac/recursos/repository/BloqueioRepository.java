package br.senac.recursos.repository;

import br.senac.recursos.model.Bloqueio;
import br.senac.recursos.model.Periodo;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Porta de persistência dos bloqueios de manutenção (RF-08, ADR-002). Bloqueio não é apagado. */
public interface BloqueioRepository {

    /** Insere o bloqueio e a sua ocupação ativa. A constraint de exclusão vale também aqui (RN-04). */
    long inserir(long recursoId, Periodo periodo, String motivo, long criadoPor, Instant agora);

    Optional<Bloqueio> buscarTravando(long id);

    /** Todos os bloqueios, ativos e levantados, em ordem de início e de identificador (D15: nada é apagado). */
    List<Bloqueio> listar();

    /** Marca o bloqueio como levantado e libera a ocupação, sem apagar o registro (D15). */
    void levantar(long id);
}
