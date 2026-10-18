export interface MensagemDeErro {
  mensagem: string;
  acao: string;
}

export function mensagemPara(_code: string): MensagemDeErro {
  return { mensagem: '', acao: '' };
}
