import { situacoesSemCodigoDaDocumentacao, tabelaDeErrosDaDocumentacao } from '@/test/documentacao';
import { MENSAGEM_DE_REDE, mensagemPara } from '@/erros/mensagens';

describe('mensagemPara', () => {
  const documentada = [...tabelaDeErrosDaDocumentacao().entries()];

  it('a tabela da documentação tem os 34 códigos estáveis do servidor', () => {
    expect(documentada).toHaveLength(34);
  });

  it.each(documentada)('%s devolve a mensagem e a ação documentadas', (code, esperado) => {
    expect(mensagemPara(code)).toEqual({ mensagem: esperado.mensagem, acao: esperado.acao });
  });
});

describe('mensagens sem código do servidor', () => {
  const [rede, desconhecido, semCorpo] = situacoesSemCodigoDaDocumentacao();

  it('a documentação traz as três situações', () => {
    expect([rede?.situacao, desconhecido?.situacao, semCorpo?.situacao]).toEqual([
      expect.stringContaining('Falha de rede'),
      expect.stringContaining('Código desconhecido'),
      expect.stringContaining('sem corpo'),
    ]);
  });

  it('código que o front não conhece devolve a mensagem genérica, sem repetir nada do servidor', () => {
    expect(mensagemPara('CODIGO_DE_UM_SERVIDOR_MAIS_NOVO')).toEqual({
      mensagem: desconhecido?.mensagem,
      acao: desconhecido?.acao,
    });
  });

  it('resposta sem código devolve a mensagem de resposta fora do formato', () => {
    expect(mensagemPara('')).toEqual({ mensagem: semCorpo?.mensagem, acao: semCorpo?.acao });
  });

  it('falha de rede tem mensagem própria', () => {
    expect(MENSAGEM_DE_REDE).toEqual({ mensagem: rede?.mensagem, acao: rede?.acao });
  });
});
