import type { components } from '@/api/schema';

export type Recurso = components['schemas']['RecursoResposta'];

export const SALA_101: Recurso = {
  id: 1,
  tipo: 'SALA',
  nome: 'Sala 101',
  restrito: false,
  ativo: true,
  capacidade: 40,
  localizacao: 'Bloco A, 1º andar',
  tipoSala: 'AULA',
  horaAbertura: '07:00',
  horaFechamento: '22:00',
  diasFuncionamento: [1, 2, 3, 4, 5],
};

export const LABORATORIO: Recurso = {
  ...SALA_101,
  id: 3,
  nome: 'Laboratório de Informática 3',
  restrito: true,
  capacidade: 24,
  localizacao: 'Bloco C, térreo',
  tipoSala: 'LABORATORIO',
};

export const PROFESSORA: Recurso = {
  id: 5,
  tipo: 'PROFESSOR',
  nome: 'Profa. Helena Costa',
  restrito: false,
  ativo: true,
  competencias: ['Matemática', 'Estatística'],
};

export const PROJETOR: Recurso = {
  id: 7,
  tipo: 'MATERIAL',
  nome: 'Projetor P-007',
  restrito: true,
  ativo: true,
  codigoPatrimonio: 'PAT-P007',
  descricao: 'Projetor Full HD com cabo HDMI',
};

export const TODOS: Recurso[] = [SALA_101, LABORATORIO, PROFESSORA, PROJETOR];
