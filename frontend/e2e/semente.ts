import { chamar, entrarNaApi } from './api';
import { RECURSOS, pessoas } from './ambiente';

interface RecursoDaApi {
  nome: string;
}

/**
 * Cria as pessoas e os recursos fictícios pela API real, uma vez, antes dos testes. É idempotente: o que já existe
 * (por exemplo, numa segunda execução no mesmo banco) não é criado de novo.
 */
export default async function semear(): Promise<void> {
  const p = pessoas();
  const token = await entrarNaApi(p.administrador.email, p.administrador.senha);

  for (const pessoa of [p.maria, p.joao, p.carlos, p.ana]) {
    const r = await chamar('POST', '/api/usuarios', { nome: pessoa.nome, email: pessoa.email, senha: pessoa.senha, perfil: pessoa.perfil }, token);
    // 409 USUARIO_JA_EXISTE: já criado numa execução anterior.
    if (r.status !== 201 && r.status !== 409) {
      throw new Error(`Semente: criar ${pessoa.email} devolveu ${r.status}`);
    }
  }

  const existentes = await chamar<RecursoDaApi[]>('GET', '/api/recursos?tipo=SALA', undefined, token);
  const nomes = new Set((existentes.corpo ?? []).map((r) => r.nome));
  for (const sala of Object.values(RECURSOS)) {
    if (nomes.has(sala.nome)) {
      continue;
    }
    const r = await chamar('POST', '/api/salas', { ...sala, horaAbertura: '07:00', horaFechamento: '22:00', diasFuncionamento: [1, 2, 3, 4, 5] }, token);
    if (r.status !== 201) {
      throw new Error(`Semente: criar ${sala.nome} devolveu ${r.status}`);
    }
  }
}
