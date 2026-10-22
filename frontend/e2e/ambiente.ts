/** Variáveis do ambiente de E2E. Sem elas o teste não roda: nada de senha padrão no repositório. */
function exigir(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Defina ${nome} (ver docs/testes/e2e/README.md).`);
  }
  return valor;
}

export const URL_DA_API = process.env.E2E_API_URL ?? 'http://localhost:8080';

export interface Pessoa {
  nome: string;
  email: string;
  senha: string;
  perfil: 'SOLICITANTE' | 'RESPONSAVEL' | 'ADMINISTRADOR';
}

/** Pessoas fictícias do ambiente de E2E. O Administrador é o inicial, criado pela própria API a partir do ambiente. */
export function pessoas() {
  const solicitante = exigir('E2E_SOLICITANTE_SENHA');
  const responsavel = exigir('E2E_RESPONSAVEL_SENHA');
  return {
    administrador: { nome: 'Administrador inicial', email: exigir('E2E_ADMIN_EMAIL'), senha: exigir('E2E_ADMIN_SENHA'), perfil: 'ADMINISTRADOR' },
    maria: { nome: 'Maria Souza', email: 'maria.souza@exemplo.test', senha: solicitante, perfil: 'SOLICITANTE' },
    joao: { nome: 'João Pereira', email: 'joao.pereira@exemplo.test', senha: solicitante, perfil: 'SOLICITANTE' },
    carlos: { nome: 'Carlos Lima', email: 'carlos.lima@exemplo.test', senha: responsavel, perfil: 'RESPONSAVEL' },
    ana: { nome: 'Ana Prado', email: 'ana.prado@exemplo.test', senha: responsavel, perfil: 'RESPONSAVEL' },
  } satisfies Record<string, Pessoa>;
}

/** Recursos fictícios: duas salas livres e um laboratório que exige aprovação. */
export const RECURSOS = {
  sala101: { nome: 'Sala 101', capacidade: 40, localizacao: 'Bloco A, 1º andar', tipoSala: 'AULA', restrito: false },
  sala203: { nome: 'Sala 203', capacidade: 30, localizacao: 'Bloco B, 2º andar', tipoSala: 'AULA', restrito: false },
  lab3: { nome: 'Laboratório de Informática 3', capacidade: 24, localizacao: 'Bloco C, térreo', tipoSala: 'LABORATORIO', restrito: true },
} as const;
