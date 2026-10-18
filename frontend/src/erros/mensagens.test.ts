import { tabelaDeErrosDaDocumentacao } from '@/test/documentacao';
import { mensagemPara } from '@/erros/mensagens';

describe('mensagemPara', () => {
  const documentada = [...tabelaDeErrosDaDocumentacao().entries()];

  it('a tabela da documentação tem os 34 códigos estáveis do servidor', () => {
    expect(documentada).toHaveLength(34);
  });

  it.each(documentada)('%s devolve a mensagem e a ação documentadas', (code, esperado) => {
    expect(mensagemPara(code)).toEqual({ mensagem: esperado.mensagem, acao: esperado.acao });
  });
});
