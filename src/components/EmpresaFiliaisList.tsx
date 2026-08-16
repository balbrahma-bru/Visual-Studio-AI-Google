import React, { useState, useMemo } from 'react';
import {
  Building2,
  Building,
  Plus,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Edit2,
  Trash2,
  Eye,
  RotateCcw,
  Network,
  ShieldCheck,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Hash,
  FileCode2,
  Globe,
  MapPin,
  Phone,
  Mail,
  User,
  Briefcase,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Printer,
  Compass,
  Radio,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmpresaFilial, UserSettings } from '../types';

interface EmpresaFiliaisListProps {
  empresasFiliais: EmpresaFilial[];
  searchQuery: string;
  onSave: (filial: EmpresaFilial) => void;
  onDelete: (id: string) => void;
  userSettings?: UserSettings;
}

type SortField = 'idEmpresa' | 'empresa' | 'filial' | 'razaoSocial' | 'cidade' | 'cnpj' | 'rede' | 'ie' | 'ativo' | 'dataDesativacao';
type SortOrder = 'asc' | 'desc';
type ModalTab = 'fiscal' | 'endereco' | 'contato' | 'rede';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function EmpresaFiliaisList({
  empresasFiliais,
  searchQuery,
  onSave,
  onDelete,
  userSettings
}: EmpresaFiliaisListProps) {
  // Local Filter States
  const [localSearch, setLocalSearch] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('Todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedRede, setSelectedRede] = useState<string>('Todas');
  const [selectedUf, setSelectedUf] = useState<string>('Todas');
  const [showFilters, setShowFilters] = useState<boolean>(true);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('idEmpresa');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('fiscal');
  const [editingItem, setEditingItem] = useState<EmpresaFilial | null>(null);
  const [detailsItem, setDetailsItem] = useState<EmpresaFilial | null>(null);
  const [itemToDelete, setItemToDelete] = useState<EmpresaFilial | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState<boolean>(false);
  const [cepError, setCepError] = useState<string | null>(null);

  // Form States inside Modal
  // 1. Identificação e Fiscal
  const [formIdEmpresa, setFormIdEmpresa] = useState<number>(1);
  const [formEmpresa, setFormEmpresa] = useState<string>('BIO BRANDS');
  const [formFilial, setFormFilial] = useState<string>('');
  const [formRazaoSocial, setFormRazaoSocial] = useState<string>('BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA');
  const [formNomeFantasia, setFormNomeFantasia] = useState<string>('');
  const [formCnpj, setFormCnpj] = useState<string>('');
  const [formIe, setFormIe] = useState<string>('');
  const [formIm, setFormIm] = useState<string>('');
  const [formCnae, setFormCnae] = useState<string>('');
  const [formRegimeTributario, setFormRegimeTributario] = useState<string>('Lucro Real');
  const [formDataAbertura, setFormDataAbertura] = useState<string>('');
  const [formAtivo, setFormAtivo] = useState<boolean>(true);
  const [formDataDesativacao, setFormDataDesativacao] = useState<string>('');

  // 2. Endereço e Localização
  const [formCep, setFormCep] = useState<string>('');
  const [formLogradouro, setFormLogradouro] = useState<string>('');
  const [formNumero, setFormNumero] = useState<string>('');
  const [formComplemento, setFormComplemento] = useState<string>('');
  const [formBairro, setFormBairro] = useState<string>('');
  const [formCidade, setFormCidade] = useState<string>('');
  const [formUf, setFormUf] = useState<string>('SP');
  const [formPais, setFormPais] = useState<string>('Brasil');

  // 3. Contato e Gestão
  const [formTelefone, setFormTelefone] = useState<string>('');
  const [formTelefoneSecundario, setFormTelefoneSecundario] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formResponsavel, setFormResponsavel] = useState<string>('');
  const [formCargoResponsavel, setFormCargoResponsavel] = useState<string>('');

  // 4. TI, Rede e Observações
  const [formRede, setFormRede] = useState<string>('');
  const [formGateway, setFormGateway] = useState<string>('');
  const [formDns, setFormDns] = useState<string>('');
  const [formProvedorInternet, setFormProvedorInternet] = useState<string>('');
  const [formObservacoes, setFormObservacoes] = useState<string>('');

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Copy helper with visual feedback
  const handleCopy = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // ViaCEP Automatic Address Lookup
  const handleSearchCep = async (rawCep: string) => {
    const cleanCep = rawCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepError('Informe um CEP com 8 dígitos válidos.');
      return;
    }

    setCepLoading(true);
    setCepError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado na base dos Correios.');
      } else {
        if (data.logradouro) setFormLogradouro(data.logradouro);
        if (data.bairro) setFormBairro(data.bairro);
        if (data.localidade) setFormCidade(data.localidade);
        if (data.uf) setFormUf(data.uf);
        // Format CEP field
        setFormCep(`${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`);
      }
    } catch (err) {
      setCepError('Falha ao conectar com o serviço de CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setActiveModalTab('fiscal');
    setCepError(null);

    const nextId = empresasFiliais.length > 0
      ? Math.max(...empresasFiliais.map(e => e.idEmpresa || 0)) + 1
      : 1;

    setFormIdEmpresa(nextId);
    setFormEmpresa('BIO BRANDS');
    setFormFilial('');
    setFormRazaoSocial('BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA');
    setFormNomeFantasia('');
    setFormCnpj('');
    setFormIe('');
    setFormIm('');
    setFormCnae('');
    setFormRegimeTributario('Lucro Real');
    setFormDataAbertura('');
    setFormAtivo(true);
    setFormDataDesativacao('');

    setFormCep('');
    setFormLogradouro('');
    setFormNumero('');
    setFormComplemento('');
    setFormBairro('');
    setFormCidade('');
    setFormUf('SP');
    setFormPais('Brasil');

    setFormTelefone('');
    setFormTelefoneSecundario('');
    setFormEmail('');
    setFormResponsavel('');
    setFormCargoResponsavel('');

    setFormRede('');
    setFormGateway('');
    setFormDns('');
    setFormProvedorInternet('');
    setFormObservacoes('');

    setFormErrors({});
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: EmpresaFilial) => {
    setEditingItem(item);
    setActiveModalTab('fiscal');
    setCepError(null);

    setFormIdEmpresa(item.idEmpresa);
    setFormEmpresa(item.empresa);
    setFormFilial(item.filial);
    setFormRazaoSocial(item.razaoSocial);
    setFormNomeFantasia(item.nomeFantasia || '');
    setFormCnpj(item.cnpj || '');
    setFormIe(item.ie || '');
    setFormIm(item.im || '');
    setFormCnae(item.cnae || '');
    setFormRegimeTributario(item.regimeTributario || 'Lucro Real');
    setFormDataAbertura(item.dataAbertura || '');
    setFormAtivo(item.ativo);
    setFormDataDesativacao(item.dataDesativacao || (!item.ativo ? new Date().toISOString().split('T')[0] : ''));

    setFormCep(item.cep || '');
    setFormLogradouro(item.logradouro || '');
    setFormNumero(item.numero || '');
    setFormComplemento(item.complemento || '');
    setFormBairro(item.bairro || '');
    setFormCidade(item.cidade || '');
    setFormUf(item.uf || 'SP');
    setFormPais(item.pais || 'Brasil');

    setFormTelefone(item.telefone || '');
    setFormTelefoneSecundario(item.telefoneSecundario || '');
    setFormEmail(item.email || '');
    setFormResponsavel(item.responsavel || '');
    setFormCargoResponsavel(item.cargoResponsavel || '');

    setFormRede(item.rede || '');
    setFormGateway(item.gateway || '');
    setFormDns(item.dns || '');
    setFormProvedorInternet(item.provedorInternet || '');
    setFormObservacoes(item.observacoes || '');

    setFormErrors({});
    setModalOpen(true);
  };

  // Auto-fill corporate details on company change
  const handleFormEmpresaChange = (emp: string) => {
    setFormEmpresa(emp);
    if (!editingItem) {
      if (emp === 'BIO SCIENTIFIC') {
        setFormRazaoSocial('BIO SCIENTIFIC INDUSTRIA DE COSMETICOS LTDA');
        setFormRegimeTributario('Lucro Real');
      } else if (emp === 'BIO BRANDS') {
        setFormRazaoSocial('BIO BRANDS FRANCHISING GESTAO DE MARCAS LTDA');
        setFormRegimeTributario('Lucro Real');
      }
    }
  };

  // Validate and Save
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formIdEmpresa || formIdEmpresa <= 0) {
      errors.idEmpresa = 'ID da empresa é obrigatório e deve ser maior que 0.';
    }
    if (!formEmpresa.trim()) {
      errors.empresa = 'Informe o nome da empresa.';
    }
    if (!formFilial.trim()) {
      errors.filial = 'Informe o nome da filial / unidade.';
    }
    if (!formRazaoSocial.trim()) {
      errors.razaoSocial = 'Informe a Razão Social.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setActiveModalTab('fiscal');
      return;
    }

    const payload: EmpresaFilial = {
      id: editingItem ? editingItem.id : `ef-${Date.now()}`,
      idEmpresa: Number(formIdEmpresa),
      empresa: formEmpresa.trim().toUpperCase(),
      filial: formFilial.trim().toUpperCase(),
      razaoSocial: formRazaoSocial.trim().toUpperCase(),
      nomeFantasia: formNomeFantasia.trim() || undefined,
      cnpj: formCnpj.trim(),
      ie: formIe.trim(),
      im: formIm.trim() || undefined,
      cnae: formCnae.trim() || undefined,
      regimeTributario: formRegimeTributario.trim() || undefined,
      dataAbertura: formDataAbertura.trim() || undefined,

      cep: formCep.trim() || undefined,
      logradouro: formLogradouro.trim() || undefined,
      numero: formNumero.trim() || undefined,
      complemento: formComplemento.trim() || undefined,
      bairro: formBairro.trim() || undefined,
      cidade: formCidade.trim() || undefined,
      uf: formUf.trim().toUpperCase() || undefined,
      pais: formPais.trim() || 'Brasil',

      telefone: formTelefone.trim() || undefined,
      telefoneSecundario: formTelefoneSecundario.trim() || undefined,
      email: formEmail.trim() || undefined,
      responsavel: formResponsavel.trim() || undefined,
      cargoResponsavel: formCargoResponsavel.trim() || undefined,

      rede: formRede.trim(),
      gateway: formGateway.trim() || undefined,
      dns: formDns.trim() || undefined,
      provedorInternet: formProvedorInternet.trim() || undefined,
      observacoes: formObservacoes.trim() || undefined,

      ativo: formAtivo,
      dataDesativacao: !formAtivo
        ? (formDataDesativacao.trim() || new Date().toISOString().split('T')[0])
        : undefined
    };

    onSave(payload);
    setModalOpen(false);
  };

  // Unique lists for filters
  const uniqueEmpresas = useMemo(() => {
    const set = new Set(empresasFiliais.map(e => e.empresa).filter(Boolean));
    return Array.from(set).sort();
  }, [empresasFiliais]);

  const uniqueRedes = useMemo(() => {
    const set = new Set(empresasFiliais.map(e => e.rede).filter(Boolean));
    return Array.from(set).sort();
  }, [empresasFiliais]);

  const uniqueUfs = useMemo(() => {
    const set = new Set(empresasFiliais.map(e => e.uf).filter(Boolean));
    return Array.from(set).sort();
  }, [empresasFiliais]);

  // Active filters count
  const activeFiltersCount =
    (localSearch.trim() ? 1 : 0) +
    (selectedEmpresa !== 'Todas' ? 1 : 0) +
    (selectedStatus !== 'Todos' ? 1 : 0) +
    (selectedRede !== 'Todas' ? 1 : 0) +
    (selectedUf !== 'Todas' ? 1 : 0);

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...empresasFiliais];

    const matchQuery = (item: EmpresaFilial, q: string) => {
      return (
        item.idEmpresa.toString().includes(q) ||
        item.empresa.toLowerCase().includes(q) ||
        item.filial.toLowerCase().includes(q) ||
        item.razaoSocial.toLowerCase().includes(q) ||
        (item.nomeFantasia && item.nomeFantasia.toLowerCase().includes(q)) ||
        item.cnpj.toLowerCase().includes(q) ||
        item.rede.toLowerCase().includes(q) ||
        item.ie.toLowerCase().includes(q) ||
        (item.cidade && item.cidade.toLowerCase().includes(q)) ||
        (item.uf && item.uf.toLowerCase().includes(q)) ||
        (item.bairro && item.bairro.toLowerCase().includes(q)) ||
        (item.cep && item.cep.toLowerCase().includes(q)) ||
        (item.responsavel && item.responsavel.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.telefone && item.telefone.toLowerCase().includes(q))
      );
    };

    // Global Header Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => matchQuery(item, q));
    }

    // Local Search
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase().trim();
      result = result.filter(item => matchQuery(item, q));
    }

    // Empresa filter
    if (selectedEmpresa !== 'Todas') {
      result = result.filter(item => item.empresa === selectedEmpresa);
    }

    // Status filter
    if (selectedStatus !== 'Todos') {
      const isAtivo = selectedStatus === 'Ativo';
      result = result.filter(item => item.ativo === isAtivo);
    }

    // Rede filter
    if (selectedRede !== 'Todas') {
      result = result.filter(item => item.rede === selectedRede);
    }

    // UF filter
    if (selectedUf !== 'Todas') {
      result = result.filter(item => item.uf === selectedUf);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [empresasFiliais, searchQuery, localSearch, selectedEmpresa, selectedStatus, selectedRede, selectedUf, sortField, sortOrder]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = empresasFiliais.length;
    const bioBrands = empresasFiliais.filter(e => e.empresa.toUpperCase().includes('BRANDS')).length;
    const bioScientific = empresasFiliais.filter(e => e.empresa.toUpperCase().includes('SCIENTIFIC')).length;
    const ativas = empresasFiliais.filter(e => e.ativo).length;
    const uniqueIps = new Set(empresasFiliais.map(e => e.rede).filter(Boolean)).size;

    return { total, bioBrands, bioScientific, ativas, uniqueIps };
  }, [empresasFiliais]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'ID_EMPRESA', 'Empresa', 'Filial', 'Razão Social', 'Nome Fantasia', 'CNPJ', 'IE', 'IM',
      'CNAE', 'Regime Tributário', 'Data Abertura', 'CEP', 'Logradouro', 'Número', 'Complemento',
      'Bairro', 'Cidade', 'UF', 'País', 'Telefone', 'Telefone Secundário', 'E-mail',
      'Responsável', 'Cargo', 'Rede IP', 'Gateway', 'DNS', 'Provedor', 'Observações', 'Ativo', 'Data Desativação'
    ];
    const rows = filteredAndSorted.map(item => [
      item.idEmpresa,
      `"${item.empresa || ''}"`,
      `"${item.filial || ''}"`,
      `"${item.razaoSocial || ''}"`,
      `"${item.nomeFantasia || ''}"`,
      `"${item.cnpj || ''}"`,
      `"${item.ie || ''}"`,
      `"${item.im || ''}"`,
      `"${item.cnae || ''}"`,
      `"${item.regimeTributario || ''}"`,
      `"${item.dataAbertura || ''}"`,
      `"${item.cep || ''}"`,
      `"${item.logradouro || ''}"`,
      `"${item.numero || ''}"`,
      `"${item.complemento || ''}"`,
      `"${item.bairro || ''}"`,
      `"${item.cidade || ''}"`,
      `"${item.uf || ''}"`,
      `"${item.pais || 'Brasil'}"`,
      `"${item.telefone || ''}"`,
      `"${item.telefoneSecundario || ''}"`,
      `"${item.email || ''}"`,
      `"${item.responsavel || ''}"`,
      `"${item.cargoResponsavel || ''}"`,
      `"${item.rede || ''}"`,
      `"${item.gateway || ''}"`,
      `"${item.dns || ''}"`,
      `"${item.provedorInternet || ''}"`,
      `"${(item.observacoes || '').replace(/"/g, '""')}"`,
      item.ativo ? '1' : '0',
      `"${item.dataDesativacao || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `empresas_filiais_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuOpen(false);
  };

  // Export to JSON
  const exportToJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredAndSorted, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `empresas_filiais_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuOpen(false);
  };

  // Print Window
  const handlePrint = () => {
    window.print();
    setExportMenuOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-natural-text">Empresa / Filiais</h1>
                <span className="bg-natural-accent text-natural-primary text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {empresasFiliais.length} cadastradas
                </span>
              </div>
              <p className="text-xs text-natural-muted mt-0.5">
                Mapeamento institucional com cadastro completo de endereços, contatos, dados fiscais e redes IP
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Filters Button */}
          <button
            id="btn-toggle-filters"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showFilters
                ? 'bg-natural-light border-natural-primary text-natural-primary shadow-2xs'
                : 'bg-white border-natural-border text-natural-text hover:bg-natural-light'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filtros Rápidos</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-natural-primary text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              id="btn-export-dropdown"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-natural-border hover:bg-natural-light text-natural-text rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <Download size={14} className="text-natural-muted" />
              <span>Exportar</span>
              <ChevronDown size={14} className="text-natural-muted" />
            </button>

            {exportMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setExportMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-natural-border rounded-xl shadow-lg py-1.5 z-30 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={exportToCSV}
                    className="w-full text-left px-4 py-2 hover:bg-natural-light flex items-center space-x-2 text-natural-text cursor-pointer"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    <span>Planilha CSV / Excel</span>
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="w-full text-left px-4 py-2 hover:bg-natural-light flex items-center space-x-2 text-natural-text cursor-pointer"
                  >
                    <FileCode2 size={14} className="text-indigo-600" />
                    <span>Arquivo JSON</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="w-full text-left px-4 py-2 hover:bg-natural-light flex items-center space-x-2 text-natural-text cursor-pointer"
                  >
                    <FileText size={14} className="text-amber-600" />
                    <span>Imprimir / Salvar PDF</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Add New Filial */}
          <button
            id="btn-add-filial"
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-natural-primary hover:bg-natural-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Cadastrar Filial</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats Bento Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Filiais */}
        <div className="bg-white border border-natural-border p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-natural-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Filiais</span>
            <Building2 size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-natural-text font-mono">{stats.total}</div>
          <div className="text-[10px] text-natural-muted font-medium">Unidades registradas</div>
        </div>

        {/* Bio Brands */}
        <div className="bg-white border border-natural-border p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bio Brands</span>
            <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-mono font-bold">FRANCHISING</span>
          </div>
          <div className="text-2xl font-black text-indigo-900 font-mono">{stats.bioBrands}</div>
          <div className="text-[10px] text-natural-muted font-medium">Gestão de Marcas</div>
        </div>

        {/* Bio Scientific */}
        <div className="bg-white border border-natural-border p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bio Scientific</span>
            <span className="text-[10px] bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">INDÚSTRIA</span>
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">{stats.bioScientific}</div>
          <div className="text-[10px] text-natural-muted font-medium">Cosméticos e Matriz</div>
        </div>

        {/* Redes IP Mapeadas */}
        <div className="bg-white border border-natural-border p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-natural-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Redes IP</span>
            <Network size={16} className="text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-natural-text font-mono">{stats.uniqueIps}</div>
          <div className="text-[10px] text-natural-muted font-medium">Faixas de sub-rede</div>
        </div>

        {/* Status Ativas */}
        <div className="col-span-2 sm:col-span-1 bg-white border border-natural-border p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Operação Ativa</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {stats.ativas} <span className="text-xs text-natural-muted font-normal">/ {stats.total}</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            100% ativas no sistema
          </div>
        </div>
      </div>

      {/* 3. Quick Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-natural-border rounded-2xl p-4 md:p-5 shadow-2xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-natural-border pb-3">
            <div className="flex items-center space-x-2">
              <Filter size={15} className="text-natural-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-natural-text">
                Filtros de Pesquisa
              </span>
              {activeFiltersCount > 0 && (
                <span className="bg-natural-accent text-natural-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <button
                id="btn-reset-filters"
                onClick={() => {
                  setLocalSearch('');
                  setSelectedEmpresa('Todas');
                  setSelectedStatus('Todos');
                  setSelectedRede('Todas');
                  setSelectedUf('Todas');
                }}
                className="text-xs font-semibold text-natural-primary hover:text-natural-hover flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Instant Text Search */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label htmlFor="filial-filter-text" className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center space-x-1.5">
                <Search size={13} className="text-natural-primary" />
                <span>Localizar Filial</span>
              </label>
              <div className="relative">
                <input
                  id="filial-filter-text"
                  type="text"
                  placeholder="Nome, Cidade, CNPJ, Razão, IP..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className={`w-full bg-natural-light border rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-natural-text transition-all focus:outline-hidden ${
                    localSearch.trim()
                      ? 'border-natural-primary ring-2 ring-natural-accent/30 bg-natural-accent/10 font-semibold'
                      : 'border-natural-border hover:border-natural-primary/50 focus:border-natural-primary focus:ring-2 focus:ring-natural-accent/20'
                  }`}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-natural-muted">
                  <Search size={14} />
                </div>
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => setLocalSearch('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-natural-muted hover:text-natural-text transition-colors cursor-pointer"
                    title="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Empresa Filter */}
            <div className="space-y-1.5">
              <label htmlFor="filial-filter-empresa" className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center space-x-1.5">
                <Building size={13} className="text-natural-primary" />
                <span>Empresa</span>
              </label>
              <div className="relative">
                <select
                  id="filial-filter-empresa"
                  value={selectedEmpresa}
                  onChange={(e) => setSelectedEmpresa(e.target.value)}
                  className={`w-full bg-natural-light border rounded-xl px-3 py-2 text-xs font-medium text-natural-text transition-all appearance-none cursor-pointer focus:outline-hidden ${
                    selectedEmpresa !== 'Todas'
                      ? 'border-natural-primary ring-2 ring-natural-accent/30 bg-natural-accent/10 font-bold text-natural-primary'
                      : 'border-natural-border hover:border-natural-primary/50 focus:border-natural-primary focus:ring-2 focus:ring-natural-accent/20'
                  }`}
                >
                  <option value="Todas">Todas as Empresas ({empresasFiliais.length})</option>
                  {uniqueEmpresas.map(emp => {
                    const count = empresasFiliais.filter(e => e.empresa === emp).length;
                    return (
                      <option key={emp} value={emp}>
                        {emp} ({count})
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-natural-muted">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* UF Filter */}
            <div className="space-y-1.5">
              <label htmlFor="filial-filter-uf" className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center space-x-1.5">
                <MapPin size={13} className="text-natural-primary" />
                <span>Estado / UF</span>
              </label>
              <div className="relative">
                <select
                  id="filial-filter-uf"
                  value={selectedUf}
                  onChange={(e) => setSelectedUf(e.target.value)}
                  className={`w-full bg-natural-light border rounded-xl px-3 py-2 text-xs font-medium text-natural-text transition-all appearance-none cursor-pointer focus:outline-hidden ${
                    selectedUf !== 'Todas'
                      ? 'border-natural-primary ring-2 ring-natural-accent/30 bg-natural-accent/10 font-bold text-natural-primary'
                      : 'border-natural-border hover:border-natural-primary/50 focus:border-natural-primary focus:ring-2 focus:ring-natural-accent/20'
                  }`}
                >
                  <option value="Todas">Todos os Estados</option>
                  {uniqueUfs.map(uf => {
                    const count = empresasFiliais.filter(e => e.uf === uf).length;
                    return (
                      <option key={uf} value={uf}>
                        {uf} ({count} filial{count > 1 ? 'is' : ''})
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-natural-muted">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Rede IP Filter */}
            <div className="space-y-1.5">
              <label htmlFor="filial-filter-rede" className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center space-x-1.5">
                <Network size={13} className="text-natural-primary" />
                <span>Faixa de Rede IP</span>
              </label>
              <div className="relative">
                <select
                  id="filial-filter-rede"
                  value={selectedRede}
                  onChange={(e) => setSelectedRede(e.target.value)}
                  className={`w-full bg-natural-light border rounded-xl px-3 py-2 text-xs font-medium text-natural-text transition-all appearance-none cursor-pointer focus:outline-hidden ${
                    selectedRede !== 'Todas'
                      ? 'border-natural-primary ring-2 ring-natural-accent/30 bg-natural-accent/10 font-bold text-natural-primary'
                      : 'border-natural-border hover:border-natural-primary/50 focus:border-natural-primary focus:ring-2 focus:ring-natural-accent/20'
                  }`}
                >
                  <option value="Todas">Todas as Redes ({uniqueRedes.length})</option>
                  {uniqueRedes.map(rede => {
                    const count = empresasFiliais.filter(e => e.rede === rede).length;
                    return (
                      <option key={rede} value={rede}>
                        {rede} ({count} filial{count > 1 ? 'is' : ''})
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-natural-muted">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label htmlFor="filial-filter-status" className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck size={13} className="text-natural-primary" />
                <span>Status</span>
              </label>
              <div className="relative">
                <select
                  id="filial-filter-status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`w-full bg-natural-light border rounded-xl px-3 py-2 text-xs font-medium text-natural-text transition-all appearance-none cursor-pointer focus:outline-hidden ${
                    selectedStatus !== 'Todos'
                      ? 'border-natural-primary ring-2 ring-natural-accent/30 bg-natural-accent/10 font-bold text-natural-primary'
                      : 'border-natural-border hover:border-natural-primary/50 focus:border-natural-primary focus:ring-2 focus:ring-natural-accent/20'
                  }`}
                >
                  <option value="Todos">Todos os Status</option>
                  <option value="Ativo">Ativas ({stats.ativas})</option>
                  <option value="Inativo">Inativas ({stats.total - stats.ativas})</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-natural-muted">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Results Bar */}
      <div className="flex items-center justify-between text-xs text-natural-muted px-1">
        <span>
          Mostrando <span className="font-bold text-natural-text">{filteredAndSorted.length}</span> de <span className="font-bold text-natural-text">{empresasFiliais.length}</span> filiais
        </span>
        {(searchQuery || localSearch) && (
          <span>
            Filtro de busca ativo: <span className="text-natural-primary font-semibold italic">"{localSearch || searchQuery}"</span>
          </span>
        )}
      </div>

      {/* 5. Desktop Table View */}
      <div className="hidden lg:block bg-white border border-natural-border rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-natural-border text-natural-muted font-bold tracking-wider uppercase text-[10px]">
                <th
                  onClick={() => handleSort('empresa')}
                  className="py-3 px-4 cursor-pointer hover:text-natural-primary transition-colors select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Empresa</span>
                    {sortField === 'empresa' ? (
                      sortOrder === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('filial')}
                  className="py-3 px-4 cursor-pointer hover:text-natural-primary transition-colors select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Filial / Unidade</span>
                    {sortField === 'filial' ? (
                      sortOrder === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('razaoSocial')}
                  className="py-3 px-4 cursor-pointer hover:text-natural-primary transition-colors select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Razão Social</span>
                    {sortField === 'razaoSocial' ? (
                      sortOrder === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('cnpj')}
                  className="py-3 px-4 cursor-pointer hover:text-natural-primary transition-colors select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>CNPJ</span>
                    {sortField === 'cnpj' ? (
                      sortOrder === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('rede')}
                  className="py-3 px-4 cursor-pointer hover:text-natural-primary transition-colors select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Rede IP</span>
                    {sortField === 'rede' ? (
                      sortOrder === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-natural-border font-medium">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-natural-muted">
                    <Building2 size={36} className="mx-auto mb-2 opacity-30 text-natural-primary" />
                    <p className="font-semibold text-natural-text text-sm">Nenhuma filial encontrada</p>
                    <p className="text-xs mt-1">Tente ajustar seus filtros ou cadastre uma nova filial.</p>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((item) => {
                  const isScientific = item.empresa.toUpperCase().includes('SCIENTIFIC');

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Empresa */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                            isScientific
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                          }`}
                        >
                          {item.empresa}
                        </span>
                      </td>

                      {/* Filial */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-natural-text text-xs tracking-tight">
                              {item.filial}
                            </span>
                            {!item.ativo && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700">
                                Inativa
                              </span>
                            )}
                          </div>
                          {item.nomeFantasia && (
                            <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[180px]">
                              {item.nomeFantasia}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Razão Social */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-[11px] text-slate-600 truncate font-normal" title={item.razaoSocial}>
                          {item.razaoSocial}
                        </div>
                      </td>

                      {/* CNPJ */}
                      <td className="py-3 px-4 font-mono text-[11px] text-natural-text">
                        {item.cnpj ? (
                          <div className="flex items-center space-x-1.5 group/cnpj">
                            <span>{item.cnpj}</span>
                            <button
                              onClick={() => handleCopy(item.cnpj, `cnpj-${item.id}`)}
                              className="text-slate-400 hover:text-natural-primary transition-colors opacity-0 group-hover/cnpj:opacity-100 p-0.5 cursor-pointer"
                              title="Copiar CNPJ"
                            >
                              {copiedField === `cnpj-${item.id}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-sans italic">-</span>
                        )}
                      </td>

                      {/* Rede IP */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {item.rede ? (
                          <div className="flex items-center space-x-1.5 group/rede">
                            <span className="bg-cyan-50 text-cyan-900 border border-cyan-200/80 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                              <Network size={10} className="text-cyan-600 shrink-0" />
                              <span>{item.rede}</span>
                            </span>
                            <button
                              onClick={() => handleCopy(item.rede, `rede-${item.id}`)}
                              className="text-slate-400 hover:text-cyan-700 transition-colors opacity-0 group-hover/rede:opacity-100 p-0.5 cursor-pointer"
                              title="Copiar Faixa de IP"
                            >
                              {copiedField === `rede-${item.id}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-sans italic">-</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setDetailsItem(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Ver Detalhes e Ficha Completa"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Filial"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Filial"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Mobile Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
        {filteredAndSorted.length === 0 ? (
          <div className="col-span-full py-12 text-center text-natural-muted bg-white border border-natural-border rounded-2xl">
            <Building2 size={36} className="mx-auto mb-2 opacity-30 text-natural-primary" />
            <p className="font-semibold text-natural-text text-sm">Nenhuma filial encontrada</p>
            <p className="text-xs mt-1">Tente ajustar seus filtros de busca.</p>
          </div>
        ) : (
          filteredAndSorted.map((item) => {
            const isScientific = item.empresa.toUpperCase().includes('SCIENTIFIC');

            return (
              <div
                key={item.id}
                className="bg-white border border-natural-border rounded-2xl p-4 shadow-2xs space-y-3"
              >
                {/* Card Top */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                          isScientific
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                        }`}
                      >
                        {item.empresa}
                      </span>
                      {!item.ativo && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 inline-flex items-center gap-1">
                          <Calendar size={10} className="text-rose-500" />
                          <span>Desativada</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-natural-text text-sm">{item.filial}</h3>
                    {item.nomeFantasia && (
                      <p className="text-[11px] text-slate-400">{item.nomeFantasia}</p>
                    )}
                  </div>
                </div>

                {/* Razão Social & Endereço */}
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <div>
                    <span className="text-[9px] font-bold text-natural-muted uppercase block">Razão Social</span>
                    <span className="font-medium text-slate-800">{item.razaoSocial}</span>
                  </div>
                  {(item.cidade || item.uf || item.logradouro) && (
                    <div className="pt-1 border-t border-slate-200/60 flex items-center text-[10px] text-slate-500 gap-1">
                      <MapPin size={11} className="text-indigo-600 shrink-0" />
                      <span>
                        {[item.logradouro, item.numero, item.bairro, item.cidade, item.uf]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-sans font-bold text-natural-muted uppercase block">CNPJ</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="truncate text-natural-text font-bold">{item.cnpj || 'Não inf.'}</span>
                      {item.cnpj && (
                        <button
                          onClick={() => handleCopy(item.cnpj, `m-cnpj-${item.id}`)}
                          className="text-slate-400 hover:text-natural-primary p-0.5"
                        >
                          {copiedField === `m-cnpj-${item.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-sans font-bold text-natural-muted uppercase block">Rede IP</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="truncate text-cyan-800 font-bold">{item.rede || 'Não inf.'}</span>
                      {item.rede && (
                        <button
                          onClick={() => handleCopy(item.rede, `m-rede-${item.id}`)}
                          className="text-slate-400 hover:text-cyan-700 p-0.5"
                        >
                          {copiedField === `m-rede-${item.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-natural-border">
                  <button
                    onClick={() => setDetailsItem(item)}
                    className="flex-1 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5"
                  >
                    <Eye size={13} />
                    <span>Detalhes</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl border border-slate-200"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==========================================
          7. MODAL: CADASTRAR / EDITAR FILIAL
          ========================================== */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-natural-border flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-natural-text text-sm sm:text-base">
                      {editingItem ? 'Alterar Empresa / Filial' : 'Nova Empresa / Filial'}
                    </h3>
                    <p className="text-[11px] text-natural-muted">
                      Cadastro completo institucional: dados fiscais, endereço, contatos e redes IP
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  className="text-natural-muted hover:text-natural-text p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-natural-border px-6 bg-slate-50/40 shrink-0 overflow-x-auto gap-1">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('fiscal')}
                  className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    activeModalTab === 'fiscal'
                      ? 'border-natural-primary text-natural-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building size={14} />
                  <span>1. Dados Fiscais</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('endereco')}
                  className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    activeModalTab === 'endereco'
                      ? 'border-natural-primary text-natural-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MapPin size={14} />
                  <span>2. Endereço & Localização</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('contato')}
                  className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    activeModalTab === 'contato'
                      ? 'border-natural-primary text-natural-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Phone size={14} />
                  <span>3. Contato & Gestão</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('rede')}
                  className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    activeModalTab === 'rede'
                      ? 'border-natural-primary text-natural-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Network size={14} />
                  <span>4. TI, Rede & Obs</span>
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                {/* =========================================================
                    TAB 1: DADOS FISCAIS & INSTITUCIONAIS
                    ========================================================= */}
                {activeModalTab === 'fiscal' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-900 flex items-start gap-2">
                      <Building2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Identificação Institucional:</span> Defina os dados jurídicos e operacionais da entidade (Matriz ou Filial).
                      </div>
                    </div>

                    {/* ID & Empresa */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          ID Empresa / Código *
                        </label>
                        <input
                          type="number"
                          value={formIdEmpresa}
                          onChange={(e) => setFormIdEmpresa(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: 4"
                          required
                        />
                        {formErrors.idEmpresa && (
                          <p className="text-[10px] text-rose-600 font-medium">{formErrors.idEmpresa}</p>
                        )}
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Grupo / Empresa *
                        </label>
                        <select
                          value={formEmpresa}
                          onChange={(e) => handleFormEmpresaChange(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-bold text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                        >
                          <option value="BIO BRANDS">BIO BRANDS</option>
                          <option value="BIO SCIENTIFIC">BIO SCIENTIFIC</option>
                          <option value="OUTRA">OUTRA EMPRESA</option>
                        </select>
                        {formErrors.empresa && (
                          <p className="text-[10px] text-rose-600 font-medium">{formErrors.empresa}</p>
                        )}
                      </div>
                    </div>

                    {/* Nome da Filial & Nome Fantasia */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Nome da Filial / Unidade *
                        </label>
                        <input
                          type="text"
                          value={formFilial}
                          onChange={(e) => setFormFilial(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-semibold text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white uppercase"
                          placeholder="Ex: ALPHAVILLE, MOEMA, MATRIZ..."
                          required
                        />
                        {formErrors.filial && (
                          <p className="text-[10px] text-rose-600 font-medium">{formErrors.filial}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Nome Fantasia / Apelido
                        </label>
                        <input
                          type="text"
                          value={formNomeFantasia}
                          onChange={(e) => setFormNomeFantasia(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: Bio Brands Flagship Moema"
                        />
                      </div>
                    </div>

                    {/* Razão Social */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-natural-text">
                        Razão Social Completa *
                      </label>
                      <input
                        type="text"
                        value={formRazaoSocial}
                        onChange={(e) => setFormRazaoSocial(e.target.value)}
                        className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white uppercase font-medium"
                        placeholder="Razão Social completa da entidade"
                        required
                      />
                      {formErrors.razaoSocial && (
                        <p className="text-[10px] text-rose-600 font-medium">{formErrors.razaoSocial}</p>
                      )}
                    </div>

                    {/* CNPJ, IE & IM */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          CNPJ
                        </label>
                        <input
                          type="text"
                          value={formCnpj}
                          onChange={(e) => setFormCnpj(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-mono text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="00.000.000/0000-00"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Inscrição Estadual (IE)
                        </label>
                        <input
                          type="text"
                          value={formIe}
                          onChange={(e) => setFormIe(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-mono text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: 206.873.416.119"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Inscrição Municipal (IM)
                        </label>
                        <input
                          type="text"
                          value={formIm}
                          onChange={(e) => setFormIm(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-mono text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: 123456-7"
                        />
                      </div>
                    </div>

                    {/* CNAE, Regime Tributário e Data Abertura */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-xs font-bold text-natural-text">
                          CNAE Principal
                        </label>
                        <input
                          type="text"
                          value={formCnae}
                          onChange={(e) => setFormCnae(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: 20.63-1-00 - Fabricação de cosméticos"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Data de Fundação / Abertura
                        </label>
                        <input
                          type="date"
                          value={formDataAbertura}
                          onChange={(e) => setFormDataAbertura(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 2: ENDEREÇO E LOCALIZAÇÃO
                    ========================================================= */}
                {activeModalTab === 'endereco' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-[11px] text-emerald-900 flex items-start gap-2">
                      <MapPin size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Endereço e Localização Física:</span> Digite o CEP e clique em "Buscar CEP" para auto-preencher logradouro, bairro, cidade e estado.
                      </div>
                    </div>

                    {/* CEP & Busca Automática */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          CEP
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formCep}
                            onChange={(e) => {
                              setFormCep(e.target.value);
                              if (cepError) setCepError(null);
                            }}
                            onBlur={() => {
                              if (formCep.replace(/\D/g, '').length === 8 && !formLogradouro) {
                                handleSearchCep(formCep);
                              }
                            }}
                            className="flex-1 bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-mono text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                            placeholder="00000-000"
                          />
                          <button
                            type="button"
                            onClick={() => handleSearchCep(formCep)}
                            disabled={cepLoading}
                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                          >
                            {cepLoading ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Buscando...</span>
                              </>
                            ) : (
                              <>
                                <Search size={13} />
                                <span>Buscar CEP</span>
                              </>
                            )}
                          </button>
                        </div>
                        {cepError && (
                          <p className="text-[10px] text-rose-600 font-medium">{cepError}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          País
                        </label>
                        <input
                          type="text"
                          value={formPais}
                          onChange={(e) => setFormPais(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Brasil"
                        />
                      </div>
                    </div>

                    {/* Logradouro e Número */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Logradouro (Rua, Avenida, Alameda...)
                        </label>
                        <input
                          type="text"
                          value={formLogradouro}
                          onChange={(e) => setFormLogradouro(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: Alameda Rio Negro, Av. Paulista..."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Número
                        </label>
                        <input
                          type="text"
                          value={formNumero}
                          onChange={(e) => setFormNumero(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-semibold text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: 500, S/N"
                        />
                      </div>
                    </div>

                    {/* Complemento e Bairro */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Complemento (Sala, Bloco, Andar, Galpão)
                        </label>
                        <input
                          type="text"
                          value={formComplemento}
                          onChange={(e) => setFormComplemento(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: Bloco A - Sala 1401"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Bairro
                        </label>
                        <input
                          type="text"
                          value={formBairro}
                          onChange={(e) => setFormBairro(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: Alphaville Industrial, Moema..."
                        />
                      </div>
                    </div>

                    {/* Cidade e UF */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Cidade / Município
                        </label>
                        <input
                          type="text"
                          value={formCidade}
                          onChange={(e) => setFormCidade(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: Barueri, São Paulo, Brusque..."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Estado (UF)
                        </label>
                        <select
                          value={formUf}
                          onChange={(e) => setFormUf(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-semibold text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                        >
                          {BRAZILIAN_STATES.map(uf => (
                            <option key={uf} value={uf}>{uf}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 3: CONTATO E RESPONSÁVEL
                    ========================================================= */}
                {activeModalTab === 'contato' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
                      <Phone size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Contatos da Unidade & Liderança:</span> Telefones, e-mail comercial e informações do gestor/gerente responsável.
                      </div>
                    </div>

                    {/* Telefones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                          <span>Telefone Comercial Principal</span>
                          <Phone size={12} className="text-slate-400" />
                        </label>
                        <input
                          type="text"
                          value={formTelefone}
                          onChange={(e) => setFormTelefone(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-mono text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="(11) 3299-4000"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                          <span>Telefone Secundário / WhatsApp</span>
                          <Phone size={12} className="text-emerald-600" />
                        </label>
                        <input
                          type="text"
                          value={formTelefoneSecundario}
                          onChange={(e) => setFormTelefoneSecundario(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-mono text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="(11) 98765-4321"
                        />
                      </div>
                    </div>

                    {/* E-mail Institucional */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                        <span>E-mail Corporativo da Unidade</span>
                        <Mail size={12} className="text-slate-400" />
                      </label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                        placeholder="filial@biobrands.com.br"
                      />
                    </div>

                    {/* Gestor Responsável e Cargo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                          <span>Gestor / Responsável da Unidade</span>
                          <User size={12} className="text-slate-400" />
                        </label>
                        <input
                          type="text"
                          value={formResponsavel}
                          onChange={(e) => setFormResponsavel(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: Fernanda Meirelles"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                          <span>Cargo do Responsável</span>
                          <Briefcase size={12} className="text-slate-400" />
                        </label>
                        <input
                          type="text"
                          value={formCargoResponsavel}
                          onChange={(e) => setFormCargoResponsavel(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: Gerente Geral de Franquias"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 4: TI, REDE & OBSERVAÇÕES
                    ========================================================= */}
                {activeModalTab === 'rede' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="bg-cyan-50/50 border border-cyan-100 rounded-xl p-3 text-[11px] text-cyan-900 flex items-start gap-2">
                      <Network size={16} className="text-cyan-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Infraestrutura de TI & Conectividade:</span> Mapeie a faixa de rede IP da unidade, servidores e provedores de link.
                      </div>
                    </div>

                    {/* Rede IP & Gateway */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                          <span>Faixa de Sub-rede IP</span>
                          <Network size={12} className="text-cyan-600" />
                        </label>
                        <input
                          type="text"
                          value={formRede}
                          onChange={(e) => setFormRede(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-mono text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: 192.168.004.000/23"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          IP Gateway Padrão
                        </label>
                        <input
                          type="text"
                          value={formGateway}
                          onChange={(e) => setFormGateway(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-mono text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: 192.168.4.1"
                        />
                      </div>
                    </div>

                    {/* DNS & Provedor de Internet */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Servidores DNS
                        </label>
                        <input
                          type="text"
                          value={formDns}
                          onChange={(e) => setFormDns(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs font-mono text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: 1.1.1.1, 8.8.8.8"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-natural-text">
                          Provedor / Link de Internet
                        </label>
                        <input
                          type="text"
                          value={formProvedorInternet}
                          onChange={(e) => setFormProvedorInternet(e.target.value)}
                          className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                          placeholder="Ex: Vivo Fibra Dedicado 500Mbps"
                        />
                      </div>
                    </div>

                    {/* Observações Gerais */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-natural-text">
                        Observações e Particularidades Operacionais
                      </label>
                      <textarea
                        rows={3}
                        value={formObservacoes}
                        onChange={(e) => setFormObservacoes(e.target.value)}
                        className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white"
                        placeholder="Horários especiais de funcionamento, detalhes de acesso físico, observações de infraestrutura..."
                      />
                    </div>

                    {/* Status de Operação */}
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-natural-text block">Situação Cadastral da Unidade</span>
                          <span className="text-[11px] text-slate-500">Filiais ativas aparecem disponíveis para alocação de equipamentos e colaboradores.</span>
                        </div>

                        <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-natural-text select-none shrink-0">
                          <input
                            type="checkbox"
                            checked={formAtivo}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setFormAtivo(isChecked);
                              if (!isChecked && !formDataDesativacao) {
                                setFormDataDesativacao(new Date().toISOString().split('T')[0]);
                              }
                            }}
                            className="w-4 h-4 text-natural-primary rounded border-slate-300 focus:ring-natural-accent cursor-pointer"
                          />
                          <span className={formAtivo ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                            {formAtivo ? 'Unidade Ativa (1)' : 'Unidade Inativa (0)'}
                          </span>
                        </label>
                      </div>

                      {!formAtivo && (
                        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                          <label className="block text-xs font-bold text-rose-900 flex items-center justify-between">
                            <span>Data de Desativação da Unidade</span>
                            <Calendar size={13} className="text-rose-600" />
                          </label>
                          <input
                            type="date"
                            value={formDataDesativacao}
                            onChange={(e) => setFormDataDesativacao(e.target.value)}
                            className="w-full sm:w-64 bg-white border border-rose-300 rounded-lg px-3 py-1.5 text-xs text-rose-900 font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                          />
                          <p className="text-[10px] text-rose-700">
                            Data registrada na qual a filial encerrou atividades operacionais (Ativo: 0).
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Modal Navigation & Footer */}
                <div className="pt-4 border-t border-natural-border flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                  <div className="flex items-center space-x-2">
                    {activeModalTab !== 'fiscal' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeModalTab === 'rede') setActiveModalTab('contato');
                          else if (activeModalTab === 'contato') setActiveModalTab('endereco');
                          else if (activeModalTab === 'endereco') setActiveModalTab('fiscal');
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        ← Voltar Etapa
                      </button>
                    )}
                    {activeModalTab !== 'rede' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeModalTab === 'fiscal') setActiveModalTab('endereco');
                          else if (activeModalTab === 'endereco') setActiveModalTab('contato');
                          else if (activeModalTab === 'contato') setActiveModalTab('rede');
                        }}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Próxima Etapa →
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-natural-primary hover:bg-natural-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <Check size={14} />
                      <span>{editingItem ? 'Salvar Alterações' : 'Cadastrar Filial'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          8. MODAL: DETALHES & FICHA DA FILIAL
          ========================================== */}
      <AnimatePresence>
        {detailsItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setDetailsItem(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-natural-border flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-natural-text text-base">
                        {detailsItem.filial}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        detailsItem.ativo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {detailsItem.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-natural-muted">
                      ID #{detailsItem.idEmpresa} • {detailsItem.empresa}
                      {detailsItem.nomeFantasia ? ` • ${detailsItem.nomeFantasia}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      const toEdit = detailsItem;
                      setDetailsItem(null);
                      handleOpenEdit(toEdit);
                    }}
                    className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar Cadastro"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDetailsItem(null)}
                    className="text-natural-muted hover:text-natural-text p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                {/* Status Desativação Banner */}
                {!detailsItem.ativo && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-rose-900 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={18} className="text-rose-600 shrink-0" />
                      <div>
                        <span className="font-bold block text-xs">Unidade Desativada (Ativo: 0)</span>
                        <span className="text-[11px] text-rose-700">
                          Data de Desativação:{' '}
                          <strong>
                            {detailsItem.dataDesativacao
                              ? (detailsItem.dataDesativacao.includes('-')
                                  ? detailsItem.dataDesativacao.split('-').reverse().join('/')
                                  : detailsItem.dataDesativacao)
                              : 'Não informada'}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const updated: EmpresaFilial = {
                          ...detailsItem,
                          ativo: true,
                          dataDesativacao: undefined
                        };
                        onSave(updated);
                        setDetailsItem(updated);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 text-center"
                    >
                      Reativar Filial
                    </button>
                  </div>
                )}

                {/* 1. Razão Social & Fiscal Banner */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block">Razão Social Completa</span>
                      <p className="font-bold text-slate-900 text-sm">{detailsItem.razaoSocial}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(detailsItem.razaoSocial, 'det-razao')}
                      className="text-slate-400 hover:text-natural-primary p-1"
                      title="Copiar Razão Social"
                    >
                      {copiedField === 'det-razao' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {detailsItem.cnae && (
                    <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">CNAE:</span> {detailsItem.cnae}
                    </div>
                  )}
                </div>

                {/* 2. Technical / Fiscal Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                  {/* CNPJ */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                    <span className="text-[9px] font-sans font-bold text-natural-muted uppercase block">CNPJ</span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-natural-text">{detailsItem.cnpj || 'Não informado'}</span>
                      {detailsItem.cnpj && (
                        <button
                          onClick={() => handleCopy(detailsItem.cnpj, 'det-cnpj')}
                          className="text-slate-400 hover:text-natural-primary p-0.5"
                          title="Copiar CNPJ"
                        >
                          {copiedField === 'det-cnpj' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inscrição Estadual */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                    <span className="text-[9px] font-sans font-bold text-natural-muted uppercase block">Inscrição Estadual (IE)</span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">{detailsItem.ie || 'Isenta / Não inf.'}</span>
                      {detailsItem.ie && (
                        <button
                          onClick={() => handleCopy(detailsItem.ie, 'det-ie')}
                          className="text-slate-400 hover:text-natural-primary p-0.5"
                          title="Copiar IE"
                        >
                          {copiedField === 'det-ie' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inscrição Municipal */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                    <span className="text-[9px] font-sans font-bold text-natural-muted uppercase block">Inscrição Municipal</span>
                    <span className="font-bold text-slate-700">{detailsItem.im || 'Não informada'}</span>
                  </div>

                  {/* Sub-rede IP */}
                  <div className="bg-cyan-50/50 border border-cyan-100 rounded-xl p-3 space-y-1">
                    <span className="text-[9px] font-sans font-bold text-cyan-800 uppercase block">Faixa de Rede IP</span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-900">{detailsItem.rede || 'Não informada'}</span>
                      {detailsItem.rede && (
                        <button
                          onClick={() => handleCopy(detailsItem.rede, 'det-rede')}
                          className="text-cyan-600 hover:text-cyan-900 p-0.5"
                          title="Copiar Faixa IP"
                        >
                          {copiedField === 'det-rede' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Gateway Padrão */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                    <span className="text-[9px] font-sans font-bold text-natural-muted uppercase block">Gateway IP</span>
                    <span className="font-bold text-slate-700">{detailsItem.gateway || 'Não inf.'}</span>
                  </div>

                  {/* Regime / Abertura */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                    <span className="text-[9px] font-sans font-bold text-natural-muted uppercase block">Regime Tributário</span>
                    <span className="font-bold font-sans text-slate-800">{detailsItem.regimeTributario || 'Lucro Real'}</span>
                  </div>
                </div>

                {/* 3. Localização Completa */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-natural-text font-bold text-xs">
                      <MapPin size={14} className="text-indigo-600" />
                      <span>Endereço e Localização Física</span>
                    </div>
                    {detailsItem.cep && (
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[11px]">
                        CEP {detailsItem.cep}
                      </span>
                    )}
                  </div>

                  <div className="text-slate-700 space-y-1 text-xs">
                    <p className="font-medium text-slate-900">
                      {[detailsItem.logradouro, detailsItem.numero].filter(Boolean).join(', ')}
                      {detailsItem.complemento ? ` (${detailsItem.complemento})` : ''}
                    </p>
                    <p className="text-slate-600">
                      {[detailsItem.bairro, detailsItem.cidade, detailsItem.uf, detailsItem.pais]
                        .filter(Boolean)
                        .join(' - ')}
                    </p>
                  </div>
                </div>

                {/* 4. Contatos & Gestão */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Contatos */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                    <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1">
                      <Phone size={12} className="text-natural-primary" />
                      <span>Canais de Atendimento</span>
                    </span>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Telefone:</span>
                        <span className="font-mono font-bold text-slate-800">{detailsItem.telefone || 'Não informado'}</span>
                      </div>
                      {detailsItem.telefoneSecundario && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Celular / WhatsApp:</span>
                          <span className="font-mono font-bold text-emerald-800">{detailsItem.telefoneSecundario}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                        <span className="text-slate-500">E-mail:</span>
                        <span className="font-medium text-indigo-700">{detailsItem.email || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Responsável */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                    <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1">
                      <User size={12} className="text-natural-primary" />
                      <span>Gestão da Unidade</span>
                    </span>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-900 text-sm">{detailsItem.responsavel || 'Não informado'}</p>
                      <p className="text-slate-500">{detailsItem.cargoResponsavel || 'Gerente / Responsável da Filial'}</p>
                      {detailsItem.provedorInternet && (
                        <div className="pt-1.5 border-t border-slate-200/50 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Link de Internet:</span> {detailsItem.provedorInternet}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Observações */}
                {detailsItem.observacoes && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block">Observações Operacionais</span>
                    <p className="text-slate-700 text-xs leading-relaxed">{detailsItem.observacoes}</p>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="pt-3 border-t border-natural-border flex items-center justify-end space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      const toEdit = detailsItem;
                      setDetailsItem(null);
                      handleOpenEdit(toEdit);
                    }}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>Editar Informações</span>
                  </button>
                  <button
                    onClick={() => setDetailsItem(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          9. MODAL: CONFIRMAR EXCLUSÃO
          ========================================== */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setItemToDelete(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden z-10 p-6 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>

              <div>
                <h3 className="font-bold text-natural-text text-base">Desativar / Excluir Filial</h3>
                <p className="text-xs text-natural-muted mt-1">
                  Tem certeza que deseja desativar a filial <span className="font-bold text-natural-text">{itemToDelete.filial}</span> ({itemToDelete.empresa})?
                </p>
                <div className="mt-3 p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-left text-[11px] text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle size={13} className="text-rose-600 shrink-0" />
                    <span>Ação de Desativação no Sistema:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-rose-800 text-[10px]">
                    <li>O status da filial será atualizado de <strong>Ativo: 1</strong> para <strong>Ativo: 0</strong>.</li>
                    <li>A coluna <strong>Data de Desativação</strong> será preenchida com a data de hoje (<strong>{new Date().toLocaleDateString('pt-BR')}</strong>).</li>
                    <li>O registro permanece seguro no banco de dados para fins de auditoria e relatórios.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    const updated: EmpresaFilial = {
                      ...itemToDelete,
                      ativo: false,
                      dataDesativacao: today
                    };
                    onSave(updated);
                    onDelete(itemToDelete.id);
                    setItemToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Trash2 size={13} />
                  <span>Confirmar Exclusão</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
