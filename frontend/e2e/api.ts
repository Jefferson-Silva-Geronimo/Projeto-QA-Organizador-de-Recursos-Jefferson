import { URL_DA_API } from './ambiente';

export interface Resposta<T = unknown> {
  status: number;
  corpo: T;
}

/** Chamada direta à API real, só para montar o cenário (semente e pré-condições). O que o teste verifica passa pela tela. */
export async function chamar<T = unknown>(metodo: string, caminho: string, corpo?: unknown, token?: string): Promise<Resposta<T>> {
  const resposta = await fetch(URL_DA_API + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await resposta.text();
  return { status: resposta.status, corpo: (texto ? JSON.parse(texto) : null) as T };
}

export async function entrarNaApi(email: string, senha: string): Promise<string> {
  const r = await chamar<{ token: string }>('POST', '/api/auth/login', { email, senha });
  if (r.status !== 200) {
    throw new Error(`Login de ${email} recusado pela API: ${r.status}`);
  }
  return r.corpo.token;
}

/** Próximo dia útil a partir de hoje, mais `adiante` dias, como AAAA-MM-DD (hora local do campus não importa aqui). */
export function diaUtil(adiante: number): string {
  const d = new Date();
  d.setDate(d.getDate() + adiante);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}
