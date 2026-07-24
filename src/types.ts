export interface Colaborador {
  id: string;
  nomeCompleto: string;
  exibicao: string; // Nome de exibição ou apelido
  cpf: string;
  rg: string;
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

export type ActiveTab = 'dashboard' | 'colaboradores' | 'cadastro' | 'equipamentos' | 'notas_fiscais';

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
  dataCadastro: string;
  valorTotalNota: number;
  empresa: 'Bio Brands' | 'Bio Scientific';
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
