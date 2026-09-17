import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  ShieldCheck, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Users, 
  Database, 
  ArrowRight, 
  FileText, 
  Check, 
  X,
  Building,
  Briefcase,
  Search,
  Sparkles,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { Colaborador, UserSettings } from '../types';

interface AdministracaoProps {
  colaboradores: Colaborador[];
  onImportSuccess: (updatedList: Colaborador[], summary: { total: number; updated: number; created: number }) => void;
  onClearAllColaboradores: () => void;
  userSettings: UserSettings;
  onOpenMySQLConnect?: () => void;
}

interface ParsedPreviewRow {
  isUpdate: boolean;
  targetId?: string;
  nomeCompleto: string;
  exibicao: string;
  cpf: string;
  rg: string;
  matricula: string;
  dataNascimento: string;
  cargo: string;
  setor: string;
  email: string;
  telefone: string;
  dataAdmissao: string;
  status: 'Ativo' | 'Inativo';
  empresa: string;
  filial: string;
}

const AVATAR_COLORS = [
  '#2563eb', '#0d9488', '#d97706', '#7c3aed', '#dc2626', 
  '#0284c7', '#4f46e5', '#059669', '#b45309', '#c026d3'
];

function getRandomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function parseExcelDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'number') {
    // Excel serial date formula
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  // Match DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Match YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  return str;
}

function cleanDigits(val: any): string {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
}

function formatCpfString(val: any): string {
  if (!val) return '';
  const digits = cleanDigits(val);
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return String(val).trim();
}

export default function Administracao({ 
  colaboradores, 
  onImportSuccess, 
  onClearAllColaboradores, 
  userSettings,
  onOpenMySQLConnect 
}: AdministracaoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{ total: number; updated: number; created: number } | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Trigger hidden file picker
  const handleButtonClick = () => {
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Download a pre-configured sample Excel file
  const handleDownloadSample = () => {
    const sampleData = [
      {
        "Nome Completo": "Carlos Eduardo Pereira",
        "Nome Exibição": "Carlos Eduardo",
        "CPF": "123.456.789-00",
        "RG": "12.345.678-9",
        "Matrícula": "1002050",
        "Data Nascimento": "15/04/1990",
        "Cargo": "Analista de Sistemas Senior",
        "Setor": "Tecnologia",
        "E-mail": "carlos.pereira@techcorp.com.br",
        "Celular": "(11) 98765-4321",
        "Data Admissão": "10/01/2021",
        "Ativo": 1,
        "Empresa": "Bio Brands",
        "Filial": "Moema"
      },
      {
        "Nome Completo": "Fernanda Lima Santos",
        "Nome Exibição": "Fernanda Lima",
        "CPF": "987.654.321-11",
        "RG": "98.765.432-1",
        "Matrícula": "1002051",
        "Data Nascimento": "22/08/1993",
        "Cargo": "Gerente de Recursos Humanos",
        "Setor": "Recursos Humanos",
        "E-mail": "fernanda.lima@techcorp.com.br",
        "Celular": "(11) 97654-3210",
        "Data Admissão": "15/05/2019",
        "Ativo": 0,
        "Empresa": "Bio Scientific",
        "Filial": "Rio de Janeiro"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 28 }, { wch: 18 }, { wch: 16 }, { wch: 14 },
      { wch: 12 }, { wch: 16 }, { wch: 28 }, { wch: 20 },
      { wch: 32 }, { wch: 16 }, { wch: 14 }, { wch: 10 },
      { wch: 16 }, { wch: 16 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Colaboradores");
    XLSX.writeFile(workbook, "Modelo_Importacao_Colaboradores.xlsx");
  };

  // Handle file selection & parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('O arquivo selecionado não contém planilhas válidas.');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON array
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('A planilha está vazia ou não possui registros formatados.');
        }

        // Process rows and map flexible field names
        const parsed: ParsedPreviewRow[] = [];

        rawJson.forEach((row) => {
          // Find field values matching common column header synonyms
          const getVal = (...keys: string[]): string => {
            for (const key of keys) {
              const matchingProp = Object.keys(row).find(
                (k) => k.toLowerCase().trim() === key.toLowerCase().trim()
              );
              if (matchingProp && row[matchingProp] !== undefined && row[matchingProp] !== null) {
                return String(row[matchingProp]).trim();
              }
            }
            return '';
          };

          const nomeCompleto = getVal('Nome Completo', 'NomeCompleto', 'Nome', 'Colaborador', 'NOME', 'Funcionario', 'FUNCIONARIO') || 'Sem Nome';
          let exibicao = getVal('Nome Exibição', 'Nome de Exibição', 'Exibição', 'Apelido', 'Exibicao');
          if (!exibicao && nomeCompleto) {
            const parts = nomeCompleto.split(' ');
            exibicao = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
          }

          const rawCpf = getVal('CPF', 'cpf', 'Cpf');
          const cpf = formatCpfString(rawCpf);
          const rg = getVal('RG', 'rg', 'Rg', 'Doc RG');
          const matricula = getVal('Matrícula', 'Matricula', 'matricula', 'Código', 'Codigo', 'ID');
          
          const rawNasc = getVal('Data Nascimento', 'Data de Nascimento', 'Nascimento', 'Data Nasc.', 'dataNascimento', 'DT_NASCIMENTO');
          const dataNascimento = parseExcelDate(rawNasc);

          const cargo = getVal('Cargo', 'cargo', 'Função', 'Funcao') || 'Colaborador';
          const setor = getVal('Setor', 'setor', 'Departamento', 'Área', 'Area') || 'Geral';
          const email = getVal('E-mail', 'Email', 'email', 'E-Mail', 'Mail') || '';
          const telefone = getVal('Celular', 'Telefone', 'telefone', 'Contato', 'Fone') || '';
          
          const rawAdmissao = getVal('Data Admissão', 'Data de Admissão', 'Admissão', 'Admissao', 'dataAdmissao', 'DT_ADMISSAO');
          const dataAdmissao = parseExcelDate(rawAdmissao) || new Date().toISOString().split('T')[0];

          // Check column 'ativo', 'Ativo', 'FL_ATIVO', 'fl_ativo', 'Status', 'status', 'Situação', 'Situacao'
          const rawAtivoOrStatus = getVal(
            'Ativo', 'ativo', 'ATIVO', 
            'FL_ATIVO', 'fl_ativo', 'Fl Ativo',
            'Status', 'status', 'STATUS',
            'Situação', 'Situacao', 'SITUACAO'
          );

          let status: 'Ativo' | 'Inativo' = 'Ativo';
          const cleanStatus = rawAtivoOrStatus.trim().toLowerCase();

          // 1 = Ativo, 0 = Inativo, true/false, or Ativo/Inativo text
          if (cleanStatus === '0' || cleanStatus === 'false' || cleanStatus === 'f' || cleanStatus === 'n' || cleanStatus === 'nao' || cleanStatus === 'não' || cleanStatus.includes('inat') || cleanStatus.includes('desat')) {
            status = 'Inativo';
          } else if (cleanStatus === '1' || cleanStatus === 'true' || cleanStatus === 'v' || cleanStatus === 's' || cleanStatus === 'sim' || cleanStatus.includes('ati')) {
            status = 'Ativo';
          } else {
            status = 'Ativo';
          }

          const empresa = getVal('Empresa', 'empresa', 'Razão Social', 'Razao Social') || 'Bio Brands';
          const filial = getVal('Filial', 'filial', 'Unidade', 'Unidade Operacional') || 'Matriz';

          // Match logic against existing colaboradores
          const cpfClean = cleanDigits(cpf);
          let target = colaboradores.find((c) => {
            if (cpfClean && cleanDigits(c.cpf) === cpfClean) return true;
            if (matricula && c.matricula && c.matricula.trim() === matricula.trim()) return true;
            if (email && c.email && c.email.toLowerCase().trim() === email.toLowerCase().trim()) return true;
            return false;
          });

          parsed.push({
            isUpdate: !!target,
            targetId: target?.id,
            nomeCompleto,
            exibicao: exibicao || nomeCompleto,
            cpf,
            rg,
            matricula,
            dataNascimento,
            cargo,
            setor,
            email,
            telefone,
            dataAdmissao,
            status,
            empresa,
            filial
          });
        });

        setPreviewRows(parsed);
        setIsProcessing(false);
      } catch (err: any) {
        console.error('Erro na leitura do arquivo XLSX', err);
        setErrorMessage(err.message || 'Ocorreu um erro ao processar a planilha. Verifique a estrutura e formato do arquivo.');
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Erro ao ler o arquivo físico.');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Commit changes to main state
  const handleConfirmImport = () => {
    if (!previewRows) return;

    let updatedCount = 0;
    let createdCount = 0;

    let currentList = [...colaboradores];

    previewRows.forEach((row, idx) => {
      if (row.isUpdate && row.targetId) {
        // Update existing item
        currentList = currentList.map((existing) => {
          if (existing.id === row.targetId) {
            updatedCount++;
            return {
              ...existing,
              nomeCompleto: row.nomeCompleto || existing.nomeCompleto,
              exibicao: row.exibicao || existing.exibicao,
              cpf: row.cpf || existing.cpf,
              rg: row.rg || existing.rg,
              matricula: row.matricula || existing.matricula,
              dataNascimento: row.dataNascimento || existing.dataNascimento,
              cargo: row.cargo || existing.cargo,
              setor: row.setor || existing.setor,
              email: row.email || existing.email,
              telefone: row.telefone || existing.telefone,
              dataAdmissao: row.dataAdmissao || existing.dataAdmissao,
              status: row.status,
              empresa: row.empresa || existing.empresa,
              filial: row.filial || existing.filial
            };
          }
          return existing;
        });
      } else {
        // Create new item
        createdCount++;
        const newColab: Colaborador = {
          id: `colab-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          nomeCompleto: row.nomeCompleto,
          exibicao: row.exibicao,
          cpf: row.cpf,
          rg: row.rg,
          matricula: row.matricula,
          dataNascimento: row.dataNascimento,
          cargo: row.cargo,
          setor: row.setor,
          email: row.email,
          telefone: row.telefone,
          dataAdmissao: row.dataAdmissao,
          status: row.status,
          avatarColor: getRandomColor(),
          empresa: row.empresa,
          filial: row.filial
        };
        currentList.unshift(newColab);
      }
    });

    const summary = {
      total: previewRows.length,
      updated: updatedCount,
      created: createdCount
    };

    setImportSummary(summary);
    setPreviewRows(null);
    onImportSuccess(currentList, summary);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Hidden native input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
      />

      {/* Top Banner & Header */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-natural-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2 text-natural-primary">
            <ShieldCheck size={20} className="text-natural-accent shrink-0" />
            <h1 className="text-xl md:text-2xl font-serif italic font-bold tracking-tight text-natural-text">
              Administração de Dados & Importação
            </h1>
          </div>
          <p className="text-xs text-natural-muted leading-relaxed">
            Painel administrativo para sincronização e atualização massiva do banco de colaboradores. Envie planilhas em formato Excel (<strong>.xlsx</strong>) com colunas como <strong>Ativo (1 = Ativo, 0 = Inativo)</strong> para cadastrar novos colaboradores ou atualizar registros existentes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="btn-download-sample-xlsx"
            onClick={handleDownloadSample}
            className="py-2.5 px-4 bg-natural-light hover:bg-natural-light-gray border border-natural-border text-natural-text text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-2xs"
          >
            <Download size={15} className="text-natural-primary" />
            <span>Baixar Planilha Exemplo (.xlsx)</span>
          </button>

          <button
            id="btn-clear-all-colaboradores"
            onClick={() => setIsConfirmClearOpen(true)}
            className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-2xs"
          >
            <Trash2 size={15} className="text-rose-600" />
            <span>Limpar Todos os Colaboradores</span>
          </button>

          <button
            id="btn-import-colaboradores-main"
            onClick={handleButtonClick}
            disabled={isProcessing}
            className="py-2.5 px-5 bg-natural-primary hover:bg-natural-hover text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-md shadow-natural-primary/10 disabled:opacity-50"
          >
            {isProcessing ? (
              <RefreshCw size={16} className="animate-spin text-natural-accent" />
            ) : (
              <Upload size={16} className="text-natural-accent" />
            )}
            <span>Importar Colaboradores</span>
          </button>
        </div>
      </div>

      {/* MySQL Remote Connection Card */}
      {onOpenMySQLConnect && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-900/50 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5 max-w-2xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Database size={24} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Banco de Dados MySQL Remoto
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  100.24.209.39:3306
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Usuário: root
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 leading-relaxed">
                Conecte-se diretamente ao MySQL no IP <strong>100.24.209.39</strong>, informe sua senha para testar a comunicação em tempo real, checar latência, consultar bancos e executar scripts de schema.
              </p>
            </div>
          </div>

          <button
            id="btn-admin-open-mysql-modal"
            onClick={onOpenMySQLConnect}
            className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer shrink-0"
          >
            <Database size={15} />
            <span>Testar Conexão / Digitar Senha</span>
          </button>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start space-x-3 shadow-2xs animate-in fade-in duration-150">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-900 uppercase text-[10px] tracking-wider mb-0.5">Falha no Processamento</h4>
            <p>{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Import Summary Toast Banner if committed */}
      {importSummary && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start justify-between shadow-2xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
              <CheckCircle size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-emerald-950 text-sm">
                Importação Concluída com Sucesso!
              </h4>
              <p className="text-emerald-800 leading-relaxed">
                A base de dados de colaboradores foi atualizada. Processados <strong>{importSummary.total}</strong> registros no arquivo.
              </p>
              <div className="flex items-center space-x-4 pt-1 font-mono text-[11px]">
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                  Novos Cadastrados: {importSummary.created}
                </span>
                <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-semibold border border-sky-200">
                  Cadastros Atualizados: {importSummary.updated}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setImportSummary(null)} 
            className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Administrative Dash Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-natural-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-natural-muted uppercase tracking-wider">Total de Colaboradores</span>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-natural-text">{colaboradores.length}</span>
            <span className="text-xs text-natural-muted font-medium">registros ativos</span>
          </div>
          <p className="text-[11px] text-natural-muted leading-relaxed">
            Base sincronizada no armazenamento local.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-natural-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-natural-muted uppercase tracking-wider">Regras de Status (Ativo/Inativo)</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <div className="text-xs font-semibold text-natural-text">
            Coluna "Ativo": 1 = Ativo | 0 = Inativo
          </div>
          <p className="text-[11px] text-natural-muted leading-relaxed">
            A importação mapeia automaticamente <strong>1</strong> para status Ativo e <strong>0</strong> para Inativo.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-natural-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-natural-muted uppercase tracking-wider">Segurança & Integridade</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Database size={18} />
            </div>
          </div>
          <div className="text-xs font-semibold text-natural-text">
            Validação Prévia de Dados
          </div>
          <p className="text-[11px] text-natural-muted leading-relaxed">
            Exibe visualização de alterações pré-confirmação antes da gravação final.
          </p>
        </div>
      </div>

      {/* Upload Drag/Drop Dropzone Box */}
      <div 
        onClick={handleButtonClick}
        className="bg-white border-2 border-dashed border-natural-border hover:border-natural-accent/80 rounded-2xl p-8 md:p-12 text-center transition-all cursor-pointer group hover:bg-natural-light/50"
      >
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-natural-light group-hover:bg-natural-accent/30 rounded-2xl text-natural-primary flex items-center justify-center mx-auto transition-colors">
            <FileSpreadsheet size={32} className="text-natural-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-natural-text group-hover:text-natural-primary transition-colors">
              Clique aqui para selecionar seu arquivo de Colaboradores
            </h3>
            <p className="text-xs text-natural-muted">
              Aceita arquivos no formato <strong>.xlsx</strong>, <strong>.xls</strong> ou <strong>.csv</strong>
            </p>
          </div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-natural-primary bg-natural-light px-4 py-2 rounded-full border border-natural-border">
            <Upload size={14} />
            <span>Selecionar Arquivo XLSX</span>
          </div>
        </div>
      </div>

      {/* CONFIRM CLEAR MODAL */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-natural-border shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-natural-text">Limpar Todos os Colaboradores?</h3>
                <p className="text-xs text-natural-muted">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-natural-muted leading-relaxed bg-rose-50 p-3.5 rounded-xl border border-rose-200">
              Tem certeza que deseja remover todos os <strong>{colaboradores.length}</strong> colaboradores cadastrados? A base de dados ficará completamente limpa e pronta para a nova importação da planilha Excel.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsConfirmClearOpen(false)}
                className="py-2 px-4 bg-white border border-natural-border rounded-xl text-xs font-semibold text-natural-text hover:bg-natural-light-gray transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-clear-all"
                onClick={() => {
                  setIsConfirmClearOpen(false);
                  onClearAllColaboradores();
                }}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-rose-600/20"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL / DRAWER FOR PARSED ROWS */}
      {previewRows && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-natural-border shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-natural-primary text-white p-6 flex items-center justify-between border-b border-natural-hover shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-natural-accent rounded-lg text-natural-primary">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">
                    Pré-visualização da Importação ({fileName})
                  </h3>
                  <p className="text-xs text-natural-gray-text">
                    Análise dos registros encontrados no arquivo antes de atualizar o banco de dados.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewRows(null)} 
                className="text-natural-accent hover:text-white p-1 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Summary Banner */}
            <div className="bg-natural-light px-6 py-3 border-b border-natural-border flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
              <div className="flex items-center space-x-4">
                <span className="text-natural-text font-bold">
                  Total de Linhas Lidas: <span className="font-mono text-natural-primary text-sm ml-1">{previewRows.length}</span>
                </span>
                <span className="bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full font-semibold border border-sky-200">
                  {previewRows.filter(r => r.isUpdate).length} Atualizações
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                  {previewRows.filter(r => !r.isUpdate).length} Novos Registros
                </span>
              </div>
              <span className="text-natural-muted italic text-[11px]">
                Regra Ativo: 1 = Ativo, 0 = Inativo.
              </span>
            </div>

            {/* Modal Table Body */}
            <div className="p-6 overflow-y-auto flex-1 max-h-[50vh]">
              <div className="border border-natural-border rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-natural-light border-b border-natural-border text-[11px] font-bold text-natural-muted uppercase">
                      <th className="py-3 px-4">Ação</th>
                      <th className="py-3 px-4">Nome Completo</th>
                      <th className="py-3 px-4">CPF</th>
                      <th className="py-3 px-4">Matrícula</th>
                      <th className="py-3 px-4">Cargo / Setor</th>
                      <th className="py-3 px-4">Filial</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-natural-border">
                    {previewRows.map((row, index) => (
                      <tr key={index} className="hover:bg-natural-light/30 transition-colors">
                        <td className="py-3 px-4">
                          {row.isUpdate ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                              Atualizar
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Novo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-natural-text">
                          {row.nomeCompleto}
                        </td>
                        <td className="py-3 px-4 font-mono text-natural-muted">
                          {row.cpf || '-'}
                        </td>
                        <td className="py-3 px-4 font-mono text-natural-muted">
                          {row.matricula || '-'}
                        </td>
                        <td className="py-3 px-4 text-natural-text">
                          <span className="font-medium">{row.cargo}</span>
                          <span className="text-natural-muted text-[10px] block">{row.setor}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-natural-text">
                          {row.filial}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-natural-light p-6 border-t border-natural-border flex items-center justify-between shrink-0">
              <button
                onClick={() => setPreviewRows(null)}
                className="py-2.5 px-5 bg-white border border-natural-border rounded-xl text-xs font-semibold text-natural-text hover:bg-natural-light-gray transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                id="confirm-import-xlsx-btn"
                onClick={handleConfirmImport}
                className="py-2.5 px-6 bg-natural-primary hover:bg-natural-hover text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-md shadow-natural-primary/10"
              >
                <Check size={16} className="text-natural-accent" />
                <span>Confirmar e Atualizar Tabela</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

