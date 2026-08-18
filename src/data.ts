import { Colaborador, EmpresaFilial } from './types';

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

export const FILIAIS_BY_EMPRESA: { [key: string]: string[] } = {
  'Bio Brands': [
    'ALPHAVILLE',
    'BRUSQUE',
    'CAMPINAS',
    'E-COMMERCE',
    'FILIAL FORTALEZA',
    'FILIAL VITORIA',
    'FORTALEZA',
    'MOEMA',
    'PARAIBA',
    'RECIFE',
    'RIO DE JANEIRO',
    'VILA MADALENA',
    'VITORIA'
  ],
  'Bio Scientific': ['MATRIZ', 'CDBR116'],
  'Terceiros': [
    'ALPHAVILLE',
    'BRUSQUE',
    'CAMPINAS',
    'CDBR116',
    'E-COMMERCE',
    'FILIAL FORTALEZA',
    'FILIAL VITORIA',
    'FORTALEZA',
    'MATRIZ',
    'MOEMA',
    'PARAIBA',
    'RECIFE',
    'RIO DE JANEIRO',
    'VILA MADALENA',
    'VITORIA'
  ]
};

export const INITIAL_NOTAS_FISCAIS = [
  {
    id: 'nf-1',
    numero: '000.124.981',
    emissor: 'Dell Computadores do Brasil Ltda',
    dataEmissao: '2026-06-15',
    dataVencimento: '2026-07-15',
    dataCadastro: '2026-06-16T14:30:00.000Z',
    valorTotalNota: 13498.00,
    empresa: 'Bio Brands',
    filial: 'Moema',
    contrato: 'CTR-2026-089',
    numeroPedido: '104829',
    natureza: '11020',
    cdc: '020101',
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
        codigoTotvs: '0001048291',
        quantidade: 2,
        descricao: 'Notebook Dell Latitude 3440 Intel Core i5 16GB RAM 512GB SSD',
        valorUnitario: 5499.00,
        valorTotal: 10998.00
      },
      {
        id: 'nfi-1-2',
        codigoTotvs: '0001048292',
        quantidade: 1,
        descricao: 'Monitor Dell 27" SE2722H Full HD HDMI/VGA',
        valorUnitario: 1250.00,
        valorTotal: 1250.00
      },
      {
        id: 'nfi-1-3',
        codigoTotvs: '0001048293',
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
    dataVencimento: '2026-08-02',
    dataCadastro: '2026-07-03T10:15:00.000Z',
    valorTotalNota: 24500.00,
    empresa: 'Bio Scientific',
    filial: 'Matriz',
    contrato: 'CTR-2026-014',
    numeroPedido: '208451',
    natureza: '21050',
    cdc: '030204',
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
        codigoTotvs: '0002084511',
        quantidade: 1,
        descricao: 'Balança de Precisão Analítica Bio-Precision 0.1mg',
        valorUnitario: 18500.00,
        valorTotal: 18500.00
      },
      {
        id: 'nfi-2-2',
        codigoTotvs: '0002084512',
        quantidade: 2,
        descricao: 'Termômetro Digital Científico Calibrado RBC',
        valorUnitario: 3000.00,
        valorTotal: 6000.00
      }
    ]
  }
];

export const INITIAL_EMPRESAS_FILIAIS: EmpresaFilial[] = [
  {
    id: 'ef-1',
    idEmpresa: 1,
    empresa: 'BIO SCIENTIFIC',
    filial: 'MATRIZ',
    razaoSocial: 'BIO SCIENTIFIC INDUSTRIA DE COSMETICOS LTDA',
    nomeFantasia: 'Bio Scientific - Matriz Fabril',
    cnpj: '04.552.888/0001-26',
    ie: '109.876.543.210',
    im: '987654-1',
    cnae: '20.63-1-00 - Fabricação de cosméticos, produtos de perfumaria e de higiene pessoal',
    regimeTributario: 'Lucro Real',
    dataAbertura: '2001-07-15',
    cep: '06454-000',
    logradouro: 'Alameda Rio Negro',
    numero: '500',
    complemento: 'Bloco A - Pavimento Térreo e 1º Andar',
    bairro: 'Alphaville Centro Industrial',
    cidade: 'Barueri',
    uf: 'SP',
    pais: 'Brasil',
    telefone: '(11) 4197-8800',
    telefoneSecundario: '(11) 98765-4321',
    email: 'matriz@bioscientific.com.br',
    responsavel: 'Carlos Eduardo Silveira',
    cargoResponsavel: 'Diretor de Operações',
    rede: '192.168.002.000/23',
    gateway: '192.168.2.1',
    dns: '1.1.1.1, 8.8.8.8',
    provedorInternet: 'Vivo Fibra Dedicado 500Mbps',
    observacoes: 'Sede fabril e laboratório de P&D principal. Acesso restrito com biometria.',
    ativo: true
  },
  {
    id: 'ef-4',
    idEmpresa: 4,
    empresa: 'BIO BRANDS',
    filial: 'ALPHAVILLE',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Headquarter',
    cnpj: '20.937.822/0001-00',
    ie: '206.873.416.119',
    im: '123456-7',
    cnae: '77.40-3-00 - Gestão de ativos intangíveis não financeiros / Franchising',
    regimeTributario: 'Lucro Real',
    dataAbertura: '2014-03-20',
    cep: '06454-000',
    logradouro: 'Alameda Grajaú',
    numero: '129',
    complemento: '14º Andar - Conjunto 1401',
    bairro: 'Alphaville Industrial',
    cidade: 'Barueri',
    uf: 'SP',
    pais: 'Brasil',
    telefone: '(11) 3299-4000',
    telefoneSecundario: '(11) 99123-4567',
    email: 'contato@biobrands.com.br',
    responsavel: 'Fernanda Meirelles',
    cargoResponsavel: 'Gerente Geral de Franquias',
    rede: '192.168.004.000/23',
    gateway: '192.168.4.1',
    dns: '1.1.1.1, 8.8.8.8',
    provedorInternet: 'Claro Fibra 600Mbps',
    observacoes: 'Escritório executivo e central de franchising das marcas.',
    ativo: true
  },
  {
    id: 'ef-15',
    idEmpresa: 15,
    empresa: 'BIO SCIENTIFIC',
    filial: 'CDBR116',
    razaoSocial: 'BIO SCIENTIFIC INDUSTRIA DE COSMETICOS LTDA',
    nomeFantasia: 'Bio Scientific - Centro de Distribuição BR116',
    cnpj: '04.552.888/0003-98',
    ie: '675.570.690.115',
    im: '554321-9',
    cnae: '52.11-7-99 - Depósitos de mercadorias para terceiros',
    regimeTributario: 'Lucro Real',
    dataAbertura: '2018-09-10',
    cep: '06803-000',
    logradouro: 'Rodovia Régis Bittencourt (BR-116)',
    numero: 'Km 279',
    complemento: 'Galpão Modular 04',
    bairro: 'Parque Industrial',
    cidade: 'Embu das Artes',
    uf: 'SP',
    pais: 'Brasil',
    telefone: '(11) 4785-9900',
    email: 'logistica.cd@bioscientific.com.br',
    responsavel: 'Marcos Vinicius Paiva',
    cargoResponsavel: 'Coordenador de Logística e Armazenagem',
    rede: '192.168.006.000/24',
    gateway: '192.168.6.1',
    provedorInternet: 'Algar Telecom 300Mbps',
    observacoes: 'CD central de matérias-primas e produtos acabados para o Sul e Sudeste.',
    ativo: true
  },
  {
    id: 'ef-20',
    idEmpresa: 20,
    empresa: 'BIO BRANDS',
    filial: 'E-COMMERCE',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Digital & Fulfillment',
    cnpj: '20.937.822/0004-53',
    ie: '109.432.876.543',
    im: '345678-0',
    cnae: '47.72-5-00 - Comércio varejista de cosméticos, produtos de perfumaria e de higiene pessoal',
    regimeTributario: 'Lucro Real',
    dataAbertura: '2020-05-12',
    cep: '06454-000',
    logradouro: 'Alameda Grajaú',
    numero: '129',
    complemento: '14º Andar - Ala Digital',
    bairro: 'Alphaville Industrial',
    cidade: 'Barueri',
    uf: 'SP',
    pais: 'Brasil',
    telefone: '(11) 3299-4050',
    email: 'ecommerce@biobrands.com.br',
    responsavel: 'Juliana Costa',
    cargoResponsavel: 'Head de E-commerce & Performance',
    rede: '192.168.006.000/24',
    gateway: '192.168.6.1',
    observacoes: 'Fulfillment de pedidos online e atendimento ao cliente e-commerce.',
    ativo: true
  },
  {
    id: 'ef-16',
    idEmpresa: 16,
    empresa: 'BIO BRANDS',
    filial: 'VILA MADALENA',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Concept Store - Vila Madalena',
    cnpj: '20.937.822/0002-91',
    ie: '121.894.641.111',
    im: '234567-8',
    cep: '05435-000',
    logradouro: 'Rua Harmonia',
    numero: '342',
    complemento: 'Loja Conceito',
    bairro: 'Vila Madalena',
    cidade: 'São Paulo',
    uf: 'SP',
    pais: 'Brasil',
    telefone: '(11) 3031-8822',
    email: 'vilamadalena@biobrands.com.br',
    responsavel: 'Lucas Gabriel Martins',
    cargoResponsavel: 'Gerente da Loja',
    rede: '192.168.008.000/24',
    gateway: '192.168.8.1',
    ativo: true
  },
  {
    id: 'ef-18',
    idEmpresa: 18,
    empresa: 'BIO BRANDS',
    filial: 'BRUSQUE',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Unidade Santa Catarina',
    cnpj: '20.937.822/0005-34',
    ie: '263.287.033',
    im: '789012-3',
    cep: '88350-000',
    logradouro: 'Avenida Otto Renaux',
    numero: '180',
    complemento: 'Sala 02',
    bairro: 'São Luiz',
    cidade: 'Brusque',
    uf: 'SC',
    pais: 'Brasil',
    telefone: '(47) 3355-1234',
    email: 'brusque@biobrands.com.br',
    responsavel: 'Renata Schmidt',
    cargoResponsavel: 'Supervisora Regional Sul',
    rede: '192.168.010.000/24',
    gateway: '192.168.10.1',
    ativo: true
  },
  {
    id: 'ef-17',
    idEmpresa: 17,
    empresa: 'BIO BRANDS',
    filial: 'MOEMA',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Flagship Moema',
    cnpj: '20.937.822/0003-72',
    ie: '151.659.065.114',
    im: '456789-1',
    cep: '04524-000',
    logradouro: 'Avenida Bem-te-vi',
    numero: '89',
    complemento: 'Casa Comercial',
    bairro: 'Moema',
    cidade: 'São Paulo',
    uf: 'SP',
    pais: 'Brasil',
    telefone: '(11) 5052-7711',
    email: 'moema@biobrands.com.br',
    responsavel: 'Camila Albuquerque',
    cargoResponsavel: 'Gerente Comercial',
    rede: '192.168.012.000/24',
    gateway: '192.168.12.1',
    ativo: true
  },
  {
    id: 'ef-26',
    idEmpresa: 26,
    empresa: 'BIO BRANDS',
    filial: 'VITORIA',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Shopping Vitória',
    cnpj: '20.937.822/0009-68',
    ie: '083.456.78-9',
    cep: '29055-911',
    logradouro: 'Avenida Américo Buaiz',
    numero: '200',
    complemento: 'Piso 2 - Loja 241',
    bairro: 'Enseada do Suá',
    cidade: 'Vitória',
    uf: 'ES',
    pais: 'Brasil',
    telefone: '(27) 3335-8000',
    email: 'vitoria@biobrands.com.br',
    responsavel: 'Rodrigo Fontana',
    rede: '192.168.014.000/24',
    ativo: true
  },
  {
    id: 'ef-30',
    idEmpresa: 30,
    empresa: 'BIO BRANDS',
    filial: 'FILIAL VITORIA',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    cnpj: '20.937.822/0008-87',
    ie: '083.987.65-4',
    cep: '29060-010',
    logradouro: 'Rua Desembargador Sampaio',
    numero: '315',
    bairro: 'Praia do Canto',
    cidade: 'Vitória',
    uf: 'ES',
    pais: 'Brasil',
    telefone: '(27) 3227-9944',
    email: 'praiadocanto@biobrands.com.br',
    responsavel: 'Tatiana Gusmão',
    rede: '192.168.014.000/24',
    ativo: true
  },
  {
    id: 'ef-24',
    idEmpresa: 24,
    empresa: 'BIO BRANDS',
    filial: 'CAMPINAS',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Iguatemi Campinas',
    cnpj: '20.937.822/0010-00',
    ie: '244.890.123.456',
    cep: '13092-902',
    logradouro: 'Avenida Iguatemi',
    numero: '777',
    complemento: 'Loja 118 - 1º Piso',
    bairro: 'Vila Brandina',
    cidade: 'Campinas',
    uf: 'SP',
    pais: 'Brasil',
    telefone: '(19) 3254-8900',
    email: 'campinas@biobrands.com.br',
    responsavel: 'Marcio Barreto',
    rede: '192.168.016.000/24',
    ativo: true
  },
  {
    id: 'ef-27',
    idEmpresa: 27,
    empresa: 'BIO BRANDS',
    filial: 'RECIFE',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Shopping Recife',
    cnpj: '20.937.822/0011-82',
    ie: '048.765.43-2',
    cep: '51020-900',
    logradouro: 'Rua Padre Carapuceiro',
    numero: '777',
    complemento: 'Loja 312',
    bairro: 'Boa Viagem',
    cidade: 'Recife',
    uf: 'PE',
    pais: 'Brasil',
    telefone: '(81) 3464-6000',
    email: 'recife@biobrands.com.br',
    responsavel: 'Clarissa Queiroz',
    rede: '192.168.018.000/24',
    ativo: true
  },
  {
    id: 'ef-22',
    idEmpresa: 22,
    empresa: 'BIO BRANDS',
    filial: 'RIO DE JANEIRO',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Leblon',
    cnpj: '20.937.822/0013-44',
    ie: '77.890.123',
    cep: '22440-032',
    logradouro: 'Avenida Ataulfo de Paiva',
    numero: '456',
    complemento: 'Loja A',
    bairro: 'Leblon',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    pais: 'Brasil',
    telefone: '(21) 2512-3344',
    email: 'leblon@biobrands.com.br',
    responsavel: 'Guilherme Drummond',
    rede: '192.168.020.000/24',
    ativo: true
  },
  {
    id: 'ef-21',
    idEmpresa: 21,
    empresa: 'BIO BRANDS',
    filial: 'PARAIBA',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Manaíra Shopping',
    cnpj: '20.937.822/0012-63',
    ie: '16.051.79-9',
    cep: '58038-000',
    logradouro: 'Avenida Governador Flávio Ribeiro Coutinho',
    numero: '805',
    complemento: 'Loja 210',
    bairro: 'Manaíra',
    cidade: 'João Pessoa',
    uf: 'PB',
    pais: 'Brasil',
    telefone: '(83) 2106-6000',
    email: 'joaopessoa@biobrands.com.br',
    responsavel: 'Mariana Medeiros',
    rede: '192.168.022.000/24',
    ativo: true
  },
  {
    id: 'ef-28',
    idEmpresa: 28,
    empresa: 'BIO BRANDS',
    filial: 'FORTALEZA',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Iguatemi Bosque',
    cnpj: '20.937.822/0015-06',
    ie: '06.890.123-4',
    cep: '60810-650',
    logradouro: 'Avenida Washington Soares',
    numero: '85',
    complemento: 'Loja 415 - Expansão',
    bairro: 'Edson Queiroz',
    cidade: 'Fortaleza',
    uf: 'CE',
    pais: 'Brasil',
    telefone: '(85) 3477-3560',
    email: 'fortaleza@biobrands.com.br',
    responsavel: 'Ana Beatriz Cavalcanti',
    rede: '192.168.024.000/24',
    ativo: true
  },
  {
    id: 'ef-29',
    idEmpresa: 29,
    empresa: 'BIO BRANDS',
    filial: 'FILIAL FORTALEZA',
    razaoSocial: 'BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA',
    nomeFantasia: 'Bio Brands Aldeota',
    cnpj: '20.937.822/0014-25',
    ie: '06.987.654-3',
    cep: '60160-230',
    logradouro: 'Avenida Dom Luís',
    numero: '1200',
    complemento: 'Torre 1 - Sala 804',
    bairro: 'Aldeota',
    cidade: 'Fortaleza',
    uf: 'CE',
    pais: 'Brasil',
    telefone: '(85) 3268-1122',
    email: 'aldeota@biobrands.com.br',
    responsavel: 'Vinicius Aragão',
    rede: '192.168.024.000/24',
    ativo: true
  }
];

