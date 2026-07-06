import { Colaborador } from './types';

export const INITIAL_COLABORADORES: Colaborador[] = [
  {
    id: 'colab-1',
    nomeCompleto: 'Carlos Henrique Souza',
    exibicao: 'Carlos Souza',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    dataNascimento: '1988-04-15',
    cargo: 'Desenvolvedor Software Senior',
    setor: 'Tecnologia',
    email: 'carlos.souza@empresa.com.br',
    telefone: '(11) 98765-4321',
    dataAdmissao: '2021-03-10',
    status: 'Ativo',
    avatarColor: 'bg-blue-500 text-white',
    empresa: 'Bio Brands',
    filial: 'Rio de Janeiro'
  },
  {
    id: 'colab-2',
    nomeCompleto: 'Amanda Martins Silva',
    exibicao: 'Amanda Silva',
    cpf: '987.654.321-11',
    rg: '98.765.432-1',
    dataNascimento: '1992-09-22',
    cargo: 'Gerente de Recursos Humanos',
    setor: 'Recursos Humanos',
    email: 'amanda.silva@empresa.com.br',
    telefone: '(11) 97654-3210',
    dataAdmissao: '2019-07-01',
    status: 'Ativo',
    avatarColor: 'bg-emerald-500 text-white',
    empresa: 'Bio Scientific',
    filial: 'Matriz'
  },
  {
    id: 'colab-3',
    nomeCompleto: 'Roberto Alves Oliveira',
    exibicao: 'Roberto Oliveira',
    cpf: '456.789.123-22',
    rg: '45.678.912-3',
    dataNascimento: '1985-11-05',
    cargo: 'Analista Financeiro Pleno',
    setor: 'Financeiro',
    email: 'roberto.oliveira@empresa.com.br',
    telefone: '(21) 99876-5432',
    dataAdmissao: '2020-01-15',
    status: 'Ativo',
    avatarColor: 'bg-amber-500 text-white',
    empresa: 'Terceiros',
    filial: 'CDBR116'
  },
  {
    id: 'colab-4',
    nomeCompleto: 'Juliana Costa Ramos',
    exibicao: 'Juliana Ramos',
    cpf: '789.123.456-33',
    rg: '78.912.345-6',
    dataNascimento: '1995-07-30',
    cargo: 'Coordenadora de Marketing',
    setor: 'Marketing',
    email: 'juliana.ramos@empresa.com.br',
    telefone: '(11) 95544-3322',
    dataAdmissao: '2022-06-18',
    status: 'Ativo',
    avatarColor: 'bg-purple-500 text-white',
    empresa: 'Bio Brands',
    filial: 'Moema'
  },
  {
    id: 'colab-5',
    nomeCompleto: 'Lucas Medeiros Lima',
    exibicao: 'Lucas Lima',
    cpf: '234.567.890-44',
    rg: '23.456.789-0',
    dataNascimento: '1990-12-12',
    cargo: 'Executivo de Vendas',
    setor: 'Vendas',
    email: 'lucas.lima@empresa.com.br',
    telefone: '(31) 98877-6655',
    dataAdmissao: '2023-02-01',
    status: 'Ativo',
    avatarColor: 'bg-rose-500 text-white',
    empresa: 'Bio Brands',
    filial: 'Vila Madalena'
  },
  {
    id: 'colab-6',
    nomeCompleto: 'Patrícia Neves Santos',
    exibicao: 'Patrícia Santos',
    cpf: '345.678.901-55',
    rg: '34.567.890-1',
    dataNascimento: '1983-02-28',
    cargo: 'Coordenadora de Operações',
    setor: 'Operações',
    email: 'patricia.santos@empresa.com.br',
    telefone: '(19) 97766-5544',
    dataAdmissao: '2018-10-10',
    status: 'Inativo',
    avatarColor: 'bg-slate-500 text-white',
    empresa: 'Bio Scientific',
    filial: 'CDBR116'
  }
];

export const SETORES = [
  'Tecnologia',
  'Recursos Humanos',
  'Financeiro',
  'Marketing',
  'Vendas',
  'Operações'
];

export const AVATAR_COLORS = [
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
  'bg-indigo-500 text-white',
  'bg-cyan-500 text-white',
  'bg-orange-500 text-white',
  'bg-teal-500 text-white',
];

// Helper formats
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function formatRG(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8, 9)}`;
}

export function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function formatLocalDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  
  // Check for common invalid CPFs (11111111111, etc)
  if (/^(\d)\1{10}$/.test(clean)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(clean.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(clean.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11))) return false;
  
  return true;
}
