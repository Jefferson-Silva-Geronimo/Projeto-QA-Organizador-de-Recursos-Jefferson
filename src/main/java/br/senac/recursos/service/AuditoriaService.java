package br.senac.recursos.service;

import br.senac.recursos.exception.CodigoErro;
import br.senac.recursos.exception.ErroDeNegocio;
import br.senac.recursos.model.EntidadeAuditada;
import br.senac.recursos.model.Perfil;
import br.senac.recursos.model.RegistroDeAuditoria;
import br.senac.recursos.model.UsuarioAutenticado;
import br.senac.recursos.repository.AuditoriaRepository;
import br.senac.recursos.repository.ReservaRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Consulta à trilha de auditoria (RF-10, RN-26). O Administrador vê toda a auditoria; o histórico de uma
 * reserva é visível ao dono, ao Responsável e ao Administrador. Nunca altera a trilha.
 */
@Service
public class AuditoriaService {

    private final AuditoriaRepository auditoria;
    private final ReservaRepository reservas;

    public AuditoriaService(AuditoriaRepository auditoria, ReservaRepository reservas) {
        this.auditoria = auditoria;
        this.reservas = reservas;
    }

    @Transactional(readOnly = true)
    public List<RegistroDeAuditoria> listar(EntidadeAuditada entidade, Long entidadeId) {
        return auditoria.listar(entidade, entidadeId);
    }

    @Transactional(readOnly = true)
    public List<RegistroDeAuditoria> historicoDaReserva(UsuarioAutenticado ator, long reservaId) {
        var reserva = reservas.buscar(reservaId)
                .orElseThrow(() -> new ErroDeNegocio(CodigoErro.NAO_ENCONTRADO));
        if (reserva.solicitanteId() != ator.id() && ator.perfil() == Perfil.SOLICITANTE) {
            throw new ErroDeNegocio(CodigoErro.ACESSO_NEGADO);
        }
        return auditoria.listar(EntidadeAuditada.RESERVA, reservaId);
    }
}
