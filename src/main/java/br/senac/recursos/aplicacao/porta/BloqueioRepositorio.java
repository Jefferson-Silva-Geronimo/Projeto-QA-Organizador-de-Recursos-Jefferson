package br.senac.recursos.aplicacao.porta;

import br.senac.recursos.dominio.Periodo;
import java.time.Instant;
import java.util.Optional;

/** Porta de persistência dos bloqueios de manutenção (RF-08, ADR-002). Bloqueio não é apagado. */
public interface BloqueioRepositorio {

    record Registro(long id, long recursoId, Instant inicio, Instant fim, String motivo, boolean ativo) {
    }

    /** Insere o bloqueio e a sua ocupação ativa. A constraint de exclusão vale também aqui (RN-04). */
    long inserir(long recursoId, Periodo periodo, String motivo, long criadoPor, Instant agora);

    Optional<Registro> buscarTravando(long id);

    /** Marca o bloqueio como levantado e libera a ocupação, sem apagar o registro (D15). */
    void levantar(long id);
}
