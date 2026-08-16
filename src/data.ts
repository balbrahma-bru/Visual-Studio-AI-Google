import { Colaborador } from './types';

export const INITIAL_COLABORADORES: Colaborador[] = [];

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

export const INITIAL_EQUIPAMENTOS = [
  {
    id: 'eq-1',
    nome: 'Notebook Dell Latitude 5430',
    tipo: 'Laptop',
    numeroSerie: 'DELL-58X9J23',
    patrimonio: 'PAT-2023-0891',
    marcaModelo: 'Dell Latitude 5430 Core i5 16GB',
    status: 'Ativo',
    dataAquisicao: '2023-05-12',
    colaboradorId: 'colab-1',
    observacoes: 'Entregue com mochila, carregador e mouse sem fio.',
    empresa: 'Bio Brands',
    historico: [
      {
        id: 'hist-1-1',
        data: '2023-05-12T10:00:00.000Z',
        acao: 'Cadastro de Ativo',
        descricao: 'Equipamento registrado no patrimônio.',
        usuario: 'Admin'
      },
      {
        id: 'hist-1-2',
        data: '2023-05-15T14:30:00.000Z',
        acao: 'Atribuição de Responsável',
        descricao: 'Notebook entregue e assinado pelo colaborador Carlos Oliveira (Suporte Técnico).',
        usuario: 'Admin'
      }
    ]
  },
  {
    id: 'eq-2',
    nome: 'Macbook Pro M2 16"',
    tipo: 'Laptop',
    numeroSerie: 'APPLE-M2-8921A',
    patrimonio: 'PAT-2023-1102',
    marcaModelo: 'Apple MacBook Pro M2 512GB',
    status: 'Ativo',
    dataAquisicao: '2023-09-01',
    colaboradorId: 'colab-2',
    observacoes: 'Uso exclusivo da gerência de recursos humanos.',
    empresa: 'Bio Scientific',
    historico: [
      {
        id: 'hist-2-1',
        data: '2023-09-01T09:15:00.000Z',
        acao: 'Cadastro de Ativo',
        descricao: 'Equipamento registrado no patrimônio corporativo.',
        usuario: 'Admin'
      },
      {
        id: 'hist-2-2',
        data: '2023-09-02T11:00:00.000Z',
        acao: 'Atribuição de Responsável',
        descricao: 'Macbook Pro entregue à colaboradora Ana Costa (Recursos Humanos).',
        usuario: 'Admin'
      }
    ]
  },
  {
    id: 'eq-3',
    nome: 'iPhone 13 Pro 128GB',
    tipo: 'Smartphone',
    numeroSerie: 'APPLE-IPH-9321B',
    patrimonio: 'PAT-2022-0453',
    marcaModelo: 'Apple iPhone 13 Pro',
    status: 'Ativo',
    dataAquisicao: '2022-10-15',
    colaboradorId: 'colab-5',
    observacoes: 'Linha corporativa habilitada com plano ilimitado.',
    empresa: 'Bio Brands',
    historico: [
      {
        id: 'hist-3-1',
        data: '2022-10-15T15:20:00.000Z',
        acao: 'Cadastro de Ativo',
        descricao: 'Smartphone cadastrado no inventário.',
        usuario: 'Admin'
      },
      {
        id: 'hist-3-2',
        data: '2022-10-16T10:00:00.000Z',
        acao: 'Atribuição de Responsável',
        descricao: 'Aparelho celular entregue ao colaborador Roberto Souza (Vendas).',
        usuario: 'Admin'
      }
    ]
  },
  {
    id: 'eq-4',
    nome: 'Servidor Dell PowerEdge R750',
    tipo: 'Servidor',
    numeroSerie: 'DELL-SERV-0912X',
    patrimonio: 'PAT-2021-0012',
    marcaModelo: 'Dell PowerEdge R750 64GB',
    status: 'Ativo',
    dataAquisicao: '2021-11-20',
    colaboradorId: null,
    observacoes: 'Hospedado no Rack principal do CPD Central.',
    empresa: 'Bio Scientific',
    historico: [
      {
        id: 'hist-4-1',
        data: '2021-11-20T08:30:00.000Z',
        acao: 'Cadastro de Ativo',
        descricao: 'Instalado no Rack 02 do Data Center Moema.',
        usuario: 'Admin'
      }
    ]
  },
  {
    id: 'eq-5',
    nome: 'Roteador Cisco ISR 4331',
    tipo: 'Roteador',
    numeroSerie: 'CISCO-ROT-7492A',
    patrimonio: 'PAT-2020-0083',
    marcaModelo: 'Cisco Integrated Services Router 4331',
    status: 'Ativo',
    dataAquisicao: '2020-03-05',
    colaboradorId: null,
    observacoes: 'Link primário de fibra óptica.',
    empresa: 'Bio Brands',
    historico: [
      {
        id: 'hist-5-1',
        data: '2020-03-05T14:00:00.000Z',
        acao: 'Cadastro de Ativo',
        descricao: 'Roteador configurado e instalado no CPD Central.',
        usuario: 'Admin'
      }
    ]
  },
  {
    id: 'eq-6',
    nome: 'Access Point Wifi Catalyst 9115',
    tipo: 'Wifi',
    numeroSerie: 'CISCO-AP-83921B',
    patrimonio: 'PAT-2022-0192',
    marcaModelo: 'Cisco Catalyst 9115 Series AP',
    status: 'Ativo',
    dataAquisicao: '2022-02-14',
    colaboradorId: null,
    observacoes: 'Instalado no teto do refeitório Moema.',
    empresa: 'Bio Scientific',
    historico: [
      {
        id: 'hist-6-1',
        data: '2022-02-14T09:00:00.000Z',
        acao: 'Cadastro de Ativo',
        descricao: 'Ponto de acesso instalado e provisionado na rede WiFi Corporativa.',
        usuario: 'Admin'
      }
    ]
  }
];

export const EQUIPAMENTO_TIPOS = [
  'Desktop',
  'Laptop',
  'Smartphone',
  'Servidor',
  'Roteador',
  'Wifi',
  'Outro'
];

export const EQUIPAMENTO_STATUSES = [
  'Ativo',
  'Inativo',
  'Em Manutenção',
  'Baixado'
];

export const INITIAL_NOTAS_FISCAIS = [
  {
    id: 'nf-1',
    numero: '000.124.981',
    emissor: 'Dell Computadores do Brasil Ltda',
    dataEmissao: '2026-06-15',
    dataCadastro: '2026-06-16T14:30:00.000Z',
    valorTotalNota: 13498.00,
    empresa: 'Bio Brands',
    observacoes: 'Aquisição de notebooks corporativos de alta performance.',
    notaFiscalFile: {
      name: 'NF_DELL_124981.pdf',
      size: 145200,
      type: 'application/pdf'
    },
    outrosArquivos: [
      {
        name: 'Boleto_Dell_1_3_Parcelado.pdf',
        size: 98100,
        type: 'application/pdf'
      }
    ],
    itens: [
      {
        id: 'nfi-1-1',
        quantidade: 2,
        descricao: 'Notebook Dell Latitude 3440 Intel Core i5 16GB RAM 512GB SSD',
        valorUnitario: 5499.00,
        valorTotal: 10998.00
      },
      {
        id: 'nfi-1-2',
        quantidade: 1,
        descricao: 'Monitor Dell 27" SE2722H Full HD HDMI/VGA',
        valorUnitario: 1250.00,
        valorTotal: 1250.00
      },
      {
        id: 'nfi-1-3',
        quantidade: 5,
        descricao: 'Kit Mouse e Teclado Sem Fio Dell KM3322W USB',
        valorUnitario: 250.00,
        valorTotal: 1250.00
      }
    ]
  },
  {
    id: 'nf-2',
    numero: '000.054.312',
    emissor: 'Alpha Equipamentos Científicos S.A.',
    dataEmissao: '2026-07-02',
    dataCadastro: '2026-07-03T10:15:00.000Z',
    valorTotalNota: 24500.00,
    empresa: 'Bio Scientific',
    observacoes: 'Substituição de equipamentos laboratoriais e calibradores.',
    notaFiscalFile: {
      name: 'NF_ALPHA_054312.pdf',
      size: 285400,
      type: 'application/pdf'
    },
    outrosArquivos: [
      {
        name: 'Boleto_Alpha_Integral.pdf',
        size: 112000,
        type: 'application/pdf'
      },
      {
        name: 'Comprovante_Transf_Alpha.pdf',
        size: 78000,
        type: 'application/pdf'
      }
    ],
    itens: [
      {
        id: 'nfi-2-1',
        quantidade: 1,
        descricao: 'Balança de Precisão Analítica Bio-Precision 0.1mg',
        valorUnitario: 18500.00,
        valorTotal: 18500.00
      },
      {
        id: 'nfi-2-2',
        quantidade: 2,
        descricao: 'Termômetro Digital Científico Calibrado RBC',
        valorUnitario: 3000.00,
        valorTotal: 6000.00
      }
    ]
  }
];
