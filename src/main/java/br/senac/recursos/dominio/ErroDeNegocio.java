package br.senac.recursos.dominio;

import java.util.List;

/** Recusa por regra de negócio. Carrega um código estável e uma mensagem compreensível (RF-13). */
public class ErroDeNegocio extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final CodigoErro codigo;
    private final transient List<String> itens;

    public ErroDeNegocio(CodigoErro codigo) {
        this(codigo, codigo.mensagemPadrao(), List.of());
    }

    public ErroDeNegocio(CodigoErro codigo, String mensagem) {
        this(codigo, mensagem, List.of());
    }

    /** {@code itens} lista identificadores que explicam a recusa, por exemplo reservas conflitantes. */
    public ErroDeNegocio(CodigoErro codigo, String mensagem, List<String> itens) {
        super(mensagem);
        this.codigo = codigo;
        this.itens = List.copyOf(itens);
    }

    public CodigoErro codigo() {
        return codigo;
    }

    public List<String> itens() {
        return itens;
    }
}
