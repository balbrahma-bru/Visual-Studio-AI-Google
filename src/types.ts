export interface Colaborador {
  id: string;
  nomeCompleto: string;
  exibicao: string; // Nome de exibição ou apelido
  cpf: string;
  rg: string;
  matricula?: string;
  dataNascimento: string;
  cargo: string;
  setor: string;
  email: string;
  telefone: string;
  dataAdmissao: string;
  status: 'Ativo' | 'Inativo';
  avatarColor: string; // Color code for dynamic avatars
  empresa?: string;
  filial?: string;
}

export type ActiveTab = 'dashboard' | 'empresa_filial' | 'colaboradores' | 'cadastro' | 'equipamentos' | 'notas_fiscais' | 'administracao';

export interface EmpresaFilial {
  id: string;
  idEmpresa: number;
  empresa: string;
  filial: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  ie: string;
  im?: string;
  cnae?: string;
  regimeTributario?: string;
  dataAbertura?: string;
  
  // Endereço e Localização
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  pais?: string;

  // Contato e Gestão
  telefone?: string;
  telefoneSecundario?: string;
  email?: string;
  responsavel?: string;
  cargoResponsavel?: string;

  // Infraestrutura de Rede e TI
  rede: string;
  gateway?: string;
  dns?: string;
  provedorInternet?: string;

  // Observações adicionais
  observacoes?: string;
  ativo: boolean;
  dataDesativacao?: string;
}

export interface NotaFiscalItem {
  id: string;
  quantidade: number;
  descricao: string;
  valorUnitario: number;
  valorTotal: number;
}

export interface NotaFiscalAnexo {
  name: string;
  size: number;
  type: string;
  base64?: string; // Stored contents in localstorage
}

export interface NotaFiscal {
  id: string;
  numero: string;
  emissor: string;
  dataEmissao: string;
  dataVencimento?: string;
  dataCadastro: string;
  valorTotalNota: number;
  empresa: 'Bio Brands' | 'Bio Scientific';
  filial?: string;
  contrato?: string;
  itens: NotaFiscalItem[];
  notaFiscalFile?: NotaFiscalAnexo | null;
  outrosArquivos?: NotaFiscalAnexo[];
  observacoes?: string;
}

export interface HistoricoEquipamento {
  id: string;
  data: string;
  acao: string;
  descricao: string;
  usuario: string;
}

export interface Equipamento {
  id: string;
  nome: string;
  tipo: 'Desktop' | 'Laptop' | 'Smartphone' | 'Servidor' | 'Roteador' | 'Wifi' | 'Outro';
  numeroSerie: string;
  patrimonio: string;
  marcaModelo: string;
  status: 'Ativo' | 'Inativo' | 'Em Manutenção' | 'Baixado';
  dataAquisicao: string;
  colaboradorId?: string | null; // Can be linked to a Colaborador
  observacoes?: string;
  historico?: HistoricoEquipamento[];
  empresa: 'Bio Brands' | 'Bio Scientific';
}

export interface UserSettings {
  nomeUsuario: string;
  empresa: string;
  email: string;
  tema: 'light' | 'dark';
}
