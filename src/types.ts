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

export type ActiveTab = 'dashboard' | 'colaboradores' | 'cadastro';

export interface UserSettings {
  nomeUsuario: string;
  empresa: string;
  email: string;
  tema: 'light' | 'dark';
}
