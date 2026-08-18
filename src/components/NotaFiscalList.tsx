import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  File, 
  Upload, 
  Download, 
  X, 
  Calendar, 
  DollarSign, 
  Layers, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  TrendingUp, 
  Building,
  Info,
  ChevronRight,
  ShoppingCart,
  Percent,
  FileSpreadsheet,
  Pencil,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  SlidersHorizontal,
  Send,
  Mail,
  CheckCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Receipt,
  MailCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotaFiscal, NotaFiscalItem, NotaFiscalAnexo, UserSettings, EmpresaFilial } from '../types';
import { FILIAIS_BY_EMPRESA, isNotaAptaFinanceiro, EMAIL_FINANCEIRO_DESTINO } from '../data';

type NFSortField = 'dataEmissao' | 'numero' | 'empresa' | 'filial' | 'emissor' | 'numeroPedido' | 'dataVencimento' | 'valorTotalNota';
type NFSortOrder = 'asc' | 'desc';

interface NotaFiscalListProps {
  notasFiscais: NotaFiscal[];
  empresasFiliais?: EmpresaFilial[];
  onSave: (nota: NotaFiscal) => void;
  onDelete: (id: string) => void;
  userSettings: UserSettings;
  activeSubTab?: 'todas' | 'financeiro';
  onSubTabChange?: (tab: 'todas' | 'financeiro') => void;
}

export default function NotaFiscalList({ 
  notasFiscais, 
  empresasFiliais, 
  onSave, 
  onDelete, 
  userSettings,
  activeSubTab = 'todas',
  onSubTabChange
}: NotaFiscalListProps) {
  // Sub-tab state
  const [internalSubTab, setInternalSubTab] = useState<'todas' | 'financeiro'>(activeSubTab);

  useEffect(() => {
    if (activeSubTab) {
      setInternalSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  const currentSubTab = activeSubTab || internalSubTab;

  const handleSwitchSubTab = (tab: 'todas' | 'financeiro') => {
    setInternalSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('All');
  const [selectedFilialFilter, setSelectedFilialFilter] = useState<string>('All');

  // Sorting state (default to dataEmissao descending)
  const [sortField, setSortField] = useState<NFSortField>('dataEmissao');
  const [sortOrder, setSortOrder] = useState<NFSortOrder>('desc');

  // Handle column header sort toggle
  const handleSort = (field: NFSortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      if (field === 'dataEmissao' || field === 'valorTotalNota') {
        setSortOrder('desc');
      } else {
        setSortOrder('asc');
      }
    }
  };

  // Helper to extract active filiais (ativo = 1 / true) belonging to the specified Empresa
  const getFiliaisForEmpresa = (targetEmpresa: 'Bio Brands' | 'Bio Scientific', list?: EmpresaFilial[]): string[] => {
    if (list && list.length > 0) {
      const normTarget = targetEmpresa.trim().toLowerCase().replace(/\s+/g, '');
      const filtered = list.filter(ef => {
        const normEmp = (ef.empresa || '').trim().toLowerCase().replace(/\s+/g, '');
        const isAtivo = ef.ativo === true; // Somente filiais ativas (ativo = 1)
        return normEmp === normTarget && isAtivo;
      });

      const uniqueFiliais = Array.from(
        new Set(
          filtered
            .map(ef => ef.filial?.trim())
            .filter((f): f is string => Boolean(f))
        )
      ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

      if (uniqueFiliais.length > 0) {
        return uniqueFiliais;
      }
    }

    return FILIAIS_BY_EMPRESA[targetEmpresa] || [];
  };

  // Helper to format Emissor name to only first name and surname (nome e sobrenome)
  const getShortEmissorName = (name: string): string => {
    if (!name) return '-';
    const clean = name.trim();
    const parts = clean.split(/\s+/);
    if (parts.length <= 2) return clean;
    return `${parts[0]} ${parts[1]}`;
  };

  // Modal and details view states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNota, setEditingNota] = useState<NotaFiscal | null>(null);
  const [selectedNotaForDetails, setSelectedNotaForDetails] = useState<NotaFiscal | null>(null);
  const [nfIdToDelete, setNfIdToDelete] = useState<string | null>(null);

  // Form Fields State
  const [numero, setNumero] = useState('');
  const [emissor, setEmissor] = useState('');
  const [dataEmissao, setDataEmissao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [empresa, setEmpresa] = useState<'Bio Brands' | 'Bio Scientific'>('Bio Brands');
  const [filial, setFilial] = useState('ALPHAVILLE');
  const [contrato, setContrato] = useState('');
  const [numeroPedido, setNumeroPedido] = useState('');
  const [natureza, setNatureza] = useState('');
  const [cdc, setCdc] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // File attachments state
  const [notaFiscalFile, setNotaFiscalFile] = useState<NotaFiscalAnexo | null>(null);
  const [boletoFile, setBoletoFile] = useState<NotaFiscalAnexo | null>(null);
  const [outrosArquivos, setOutrosArquivos] = useState<NotaFiscalAnexo[]>([]);
  
  // Modal state for sending invoice to Financeiro
  const [notaToSendToFinanceiro, setNotaToSendToFinanceiro] = useState<NotaFiscal | null>(null);
  const [isSendingFinanceiroEmail, setIsSendingFinanceiroEmail] = useState(false);
  const [sendFinanceiroStep, setSendFinanceiroStep] = useState(0);
  const [sendFinanceiroSuccess, setSendFinanceiroSuccess] = useState(false);
  const [sendFinanceiroToast, setSendFinanceiroToast] = useState<string | null>(null);

  // Current items being added/edited in the invoice
  const [itens, setItens] = useState<NotaFiscalItem[]>([]);

  // Compute available Filiais strictly according to the selected Empresa and Empresa/Filiais registry
  const filialOptions = useMemo(() => {
    return getFiliaisForEmpresa(empresa, empresasFiliais);
  }, [empresa, empresasFiliais]);

  // Handle Empresa change with auto-selection of appropriate Filial
  const handleEmpresaChange = (newEmpresa: 'Bio Brands' | 'Bio Scientific') => {
    setEmpresa(newEmpresa);
    const available = getFiliaisForEmpresa(newEmpresa, empresasFiliais);
    const matched = available.find(f => f.trim().toLowerCase() === filial.trim().toLowerCase());
    if (matched) {
      setFilial(matched);
    } else {
      setFilial(available[0] || '');
    }
  };
  
  // Temporary fields for adding a single item
  const [tempCodigoTotvs, setTempCodigoTotvs] = useState('');
  const [tempDescricao, setTempDescricao] = useState('');
  const [tempQuantidade, setTempQuantidade] = useState<number>(1);
  const [tempValorUnitario, setTempValorUnitario] = useState<number>(0);
  const [tempValorUnitarioStr, setTempValorUnitarioStr] = useState('R$ 0,00');

  // Change handler to mask currency typed by user
  const handleValorUnitarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, '');
    if (!cleanDigits) {
      setTempValorUnitario(0);
      setTempValorUnitarioStr('R$ 0,00');
      return;
    }
    const cents = parseInt(cleanDigits, 10);
    const numericValue = cents / 100;
    setTempValorUnitario(numericValue);

    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
    setTempValorUnitarioStr(formatted);
  };
  
  const [formError, setFormError] = useState('');

  // Drag and drop states
  const [dragActivePrimary, setDragActivePrimary] = useState(false);
  const [dragActiveBoleto, setDragActiveBoleto] = useState(false);
  const [dragActiveOthers, setDragActiveOthers] = useState(false);

  // File input refs
  const primaryFileInputRef = useRef<HTMLInputElement>(null);
  const boletoFileInputRef = useRef<HTMLInputElement>(null);
  const othersFileInputRef = useRef<HTMLInputElement>(null);

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Convert Date helper
  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  // Remove leading zeros helper for NF number
  const cleanNumeroNF = (num: string) => {
    if (!num) return '';
    const cleaned = num.trim().replace(/^[0.\s]+/, '');
    return cleaned || '0';
  };

  // Handle opening form for create or edit
  const handleOpenForm = (nota: NotaFiscal | null) => {
    if (nota) {
      setEditingNota(nota);
      setNumero(nota.numero);
      setEmissor(nota.emissor);
      setDataEmissao(nota.dataEmissao);
      setDataVencimento(nota.dataVencimento || '');
      setEmpresa(nota.empresa);
      const available = getFiliaisForEmpresa(nota.empresa, empresasFiliais);
      const matched = available.find(f => f.trim().toLowerCase() === (nota.filial || '').trim().toLowerCase());
      setFilial(matched || nota.filial || available[0] || '');
      setContrato(nota.contrato || '');
      setNumeroPedido(nota.numeroPedido || '');
      setNatureza(nota.natureza || '');
      setCdc(nota.cdc || '');
      setObservacoes(nota.observacoes || '');
      setNotaFiscalFile(nota.notaFiscalFile || null);
      setBoletoFile(nota.boletoFile || null);
      setOutrosArquivos(nota.outrosArquivos || []);
      setItens(nota.itens || []);
    } else {
      setEditingNota(null);
      setNumero('');
      setEmissor('');
      setDataEmissao(new Date().toISOString().split('T')[0]);
      setDataVencimento('');
      setEmpresa('Bio Brands');
      const available = getFiliaisForEmpresa('Bio Brands', empresasFiliais);
      setFilial(available[0] || 'ALPHAVILLE');
      setContrato('');
      setNumeroPedido('');
      setNatureza('');
      setCdc('');
      setObservacoes('');
      setNotaFiscalFile(null);
      setBoletoFile(null);
      setOutrosArquivos([]);
      setItens([]);
    }
    
    // Clear temp item
    setTempCodigoTotvs('');
    setTempDescricao('');
    setTempQuantidade(1);
    setTempValorUnitario(0);
    setTempValorUnitarioStr('R$ 0,00');
    setFormError('');
    setIsFormOpen(true);
  };

  // Handle duplicating an existing invoice into a new record with null number and attachments
  const handleDuplicateNota = (nota: NotaFiscal) => {
    setEditingNota(null);
    setNumero(''); // Número fica Null / Vazio para o novo registro
    setEmissor(nota.emissor || '');
    setDataEmissao(nota.dataEmissao || new Date().toISOString().split('T')[0]);
    setDataVencimento(nota.dataVencimento || '');
    setEmpresa(nota.empresa);
    const available = getFiliaisForEmpresa(nota.empresa, empresasFiliais);
    const matched = available.find(f => f.trim().toLowerCase() === (nota.filial || '').trim().toLowerCase());
    setFilial(matched || nota.filial || available[0] || '');
    setContrato(nota.contrato || '');
    setNumeroPedido(nota.numeroPedido || '');
    setNatureza(nota.natureza || '');
    setCdc(nota.cdc || '');
    setObservacoes(nota.observacoes || '');
    setNotaFiscalFile(null); // Anexos ficam Null
    setBoletoFile(null); // Boleto fica Null
    setOutrosArquivos([]); // Anexos adicionais ficam Null / Vazios
    setItens(
      (nota.itens || []).map((item, idx) => ({
        ...item,
        id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
      }))
    );

    // Clear temp item
    setTempCodigoTotvs('');
    setTempDescricao('');
    setTempQuantidade(1);
    setTempValorUnitario(0);
    setTempValorUnitarioStr('R$ 0,00');
    setFormError('');
    setIsFormOpen(true);
  };

  // Read file utility helper to Base64
  const handleFileRead = (file: File, callback: (anexo: NotaFiscalAnexo) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      callback({
        name: file.name,
        size: file.size,
        type: file.type,
        base64: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // Primary File Drag & Drop Handlers
  const handleDragPrimary = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActivePrimary(true);
    } else if (e.type === "dragleave") {
      setDragActivePrimary(false);
    }
  };

  const handleDropPrimary = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActivePrimary(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0], (anexo) => {
        setNotaFiscalFile(anexo);
      });
    }
  };

  const handleSelectPrimary = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileRead(e.target.files[0], (anexo) => {
        setNotaFiscalFile(anexo);
      });
    }
  };

  // Boleto File Drag & Drop Handlers
  const handleDragBoleto = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveBoleto(true);
    } else if (e.type === "dragleave") {
      setDragActiveBoleto(false);
    }
  };

  const handleDropBoleto = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveBoleto(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0], (anexo) => {
        setBoletoFile(anexo);
      });
    }
  };

  const handleSelectBoleto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileRead(e.target.files[0], (anexo) => {
        setBoletoFile(anexo);
      });
    }
  };

  // Others File Drag & Drop Handlers
  const handleDragOthers = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveOthers(true);
    } else if (e.type === "dragleave") {
      setDragActiveOthers(false);
    }
  };

  const handleDropOthers = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveOthers(false);

    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      filesArray.forEach(file => {
        handleFileRead(file, (anexo) => {
          setOutrosArquivos(prev => [...prev, anexo]);
        });
      });
    }
  };

  const handleSelectOthers = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      filesArray.forEach(file => {
        handleFileRead(file, (anexo) => {
          setOutrosArquivos(prev => [...prev, anexo]);
        });
      });
    }
  };

  // Remove primary file
  const handleRemovePrimaryFile = () => {
    setNotaFiscalFile(null);
    if (primaryFileInputRef.current) primaryFileInputRef.current.value = '';
  };

  // Remove boleto file
  const handleRemoveBoletoFile = () => {
    setBoletoFile(null);
    if (boletoFileInputRef.current) boletoFileInputRef.current.value = '';
  };

  // Remove other file
  const handleRemoveOtherFile = (index: number) => {
    setOutrosArquivos(prev => prev.filter((_, i) => i !== index));
  };

  // Add Item to list
  const handleAddItem = () => {
    if (!tempDescricao.trim()) {
      alert('Por favor, informe a descrição do item.');
      return;
    }
    if (tempQuantidade <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }
    if (tempValorUnitario < 0) {
      alert('O valor unitário não pode ser negativo.');
      return;
    }

    const newItem: NotaFiscalItem = {
      id: `item-${Date.now()}`,
      codigoTotvs: tempCodigoTotvs.trim() || undefined,
      descricao: tempDescricao.trim(),
      quantidade: tempQuantidade,
      valorUnitario: tempValorUnitario,
      valorTotal: Number((tempQuantidade * tempValorUnitario).toFixed(2))
    };

    setItens(prev => [...prev, newItem]);
    setTempCodigoTotvs('');
    setTempDescricao('');
    setTempQuantidade(1);
    setTempValorUnitario(0);
    setTempValorUnitarioStr('R$ 0,00');
  };

  // Remove Item from list
  const handleRemoveItem = (id: string) => {
    setItens(prev => prev.filter(item => item.id !== id));
  };

  // Compute live total for the invoice
  const computedTotalNota = useMemo(() => {
    return itens.reduce((sum, item) => sum + item.valorTotal, 0);
  }, [itens]);

  // Form submit handler
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!numero.trim()) {
      setFormError('Por favor, preencha o número da Nota Fiscal.');
      return;
    }
    if (!emissor.trim()) {
      setFormError('Por favor, preencha o emissor da Nota Fiscal.');
      return;
    }
    if (!dataEmissao) {
      setFormError('Por favor, selecione a data de emissão.');
      return;
    }
    if (itens.length === 0) {
      setFormError('Você deve adicionar pelo menos um item à Nota Fiscal.');
      return;
    }
    if (!notaFiscalFile) {
      setFormError('O upload do arquivo principal da Nota Fiscal é obrigatório.');
      return;
    }

    const payload: NotaFiscal = {
      id: editingNota ? editingNota.id : `nf-${Date.now()}`,
      numero: cleanNumeroNF(numero) || numero.trim(),
      emissor: emissor.trim(),
      dataEmissao,
      dataVencimento: dataVencimento || undefined,
      dataCadastro: editingNota ? editingNota.dataCadastro : new Date().toISOString(),
      valorTotalNota: Number(computedTotalNota.toFixed(2)),
      empresa,
      filial: filial || filialOptions[0] || '',
      contrato: contrato.trim(),
      numeroPedido: numeroPedido.trim() || undefined,
      natureza: natureza.trim() || undefined,
      cdc: cdc.trim() || undefined,
      itens,
      notaFiscalFile,
      boletoFile: boletoFile || undefined,
      outrosArquivos,
      observacoes: observacoes.trim(),
      enviadoFinanceiro: editingNota ? editingNota.enviadoFinanceiro : false,
      dataEnvioFinanceiro: editingNota ? editingNota.dataEnvioFinanceiro : undefined,
      emailEnvioFinanceiro: editingNota ? editingNota.emailEnvioFinanceiro : undefined
    };

    onSave(payload);
    setIsFormOpen(false);
  };

  // Open send modal for Financeiro
  const handleOpenSendModal = (nota: NotaFiscal) => {
    setNotaToSendToFinanceiro(nota);
    setIsSendingFinanceiroEmail(false);
    setSendFinanceiroStep(0);
    setSendFinanceiroSuccess(false);
  };

  // Trigger simulated email sending to fabiorodrigues@bioscientific.ind.br
  const handleConfirmSendToFinanceiro = () => {
    if (!notaToSendToFinanceiro) return;
    setIsSendingFinanceiroEmail(true);
    setSendFinanceiroStep(1);

    // Step 1: Connecting SMTP (600ms)
    setTimeout(() => {
      setSendFinanceiroStep(2);
      // Step 2: Packing attachments: NF + Boleto (650ms)
      setTimeout(() => {
        setSendFinanceiroStep(3);
        // Step 3: Transmitting to fabiorodrigues@bioscientific.ind.br (700ms)
        setTimeout(() => {
          setSendFinanceiroStep(4);
          setSendFinanceiroSuccess(true);

          const updatedNota: NotaFiscal = {
            ...notaToSendToFinanceiro,
            enviadoFinanceiro: true,
            dataEnvioFinanceiro: new Date().toISOString(),
            emailEnvioFinanceiro: EMAIL_FINANCEIRO_DESTINO
          };

          onSave(updatedNota);

          // Update details modal if currently open with this note
          if (selectedNotaForDetails && selectedNotaForDetails.id === notaToSendToFinanceiro.id) {
            setSelectedNotaForDetails(updatedNota);
          }

          // Show Toast notification and close modal after brief delay
          setSendFinanceiroToast(`Nota Fiscal Nº ${cleanNumeroNF(notaToSendToFinanceiro.numero)} e Boleto enviados com sucesso para ${EMAIL_FINANCEIRO_DESTINO}!`);
          setTimeout(() => {
            setSendFinanceiroToast(null);
          }, 6000);

          setTimeout(() => {
            setNotaToSendToFinanceiro(null);
            setIsSendingFinanceiroEmail(false);
            setSendFinanceiroStep(0);
            setSendFinanceiroSuccess(false);
          }, 1500);
        }, 700);
      }, 650);
    }, 600);
  };

  // Delete Action Confirm
  const handleDeleteConfirm = () => {
    if (nfIdToDelete) {
      onDelete(nfIdToDelete);
      setNfIdToDelete(null);
      if (selectedNotaForDetails?.id === nfIdToDelete) {
        setSelectedNotaForDetails(null);
      }
    }
  };

  // Available filiais for filter bar
  const availableFilterFiliais = useMemo(() => {
    if (selectedEmpresa !== 'All') {
      return getFiliaisForEmpresa(selectedEmpresa as 'Bio Brands' | 'Bio Scientific', empresasFiliais);
    }
    if (empresasFiliais && empresasFiliais.length > 0) {
      const list = Array.from(
        new Set(
          empresasFiliais
            .filter(ef => ef.ativo === true)
            .map(ef => ef.filial?.trim())
            .filter((f): f is string => Boolean(f))
        )
      ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      if (list.length > 0) return list;
    }
    return Array.from(new Set(notasFiscais.map(n => n.filial).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [selectedEmpresa, empresasFiliais, notasFiscais]);

  // Filter and search invoices
  const filteredNotas = useMemo(() => {
    return notasFiscais
      .filter(nf => {
        // 1. SubTab Filter: 'todas' vs 'financeiro'
        if (currentSubTab === 'financeiro') {
          if (!isNotaAptaFinanceiro(nf)) {
            return false;
          }
        }

        // 2. Search Query
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
          nf.numero.toLowerCase().includes(query) ||
          cleanNumeroNF(nf.numero).toLowerCase().includes(query) ||
          nf.emissor.toLowerCase().includes(query) ||
          (nf.numeroPedido && nf.numeroPedido.toLowerCase().includes(query)) ||
          (nf.natureza && nf.natureza.toLowerCase().includes(query)) ||
          (nf.cdc && nf.cdc.toLowerCase().includes(query)) ||
          (nf.filial && nf.filial.toLowerCase().includes(query)) ||
          (nf.contrato && nf.contrato.toLowerCase().includes(query)) ||
          (nf.observacoes && nf.observacoes.toLowerCase().includes(query)) ||
          (nf.itens && nf.itens.some(item => item.descricao.toLowerCase().includes(query) || (item.codigoTotvs && item.codigoTotvs.toLowerCase().includes(query))));

        // 3. Company Filter
        const matchesEmpresa = selectedEmpresa === 'All' || nf.empresa === selectedEmpresa;

        // 4. Filial Filter
        const matchesFilial = selectedFilialFilter === 'All' || (nf.filial || '').trim().toLowerCase() === selectedFilialFilter.trim().toLowerCase();

        return matchesSearch && matchesEmpresa && matchesFilial;
      })
      .sort((a, b) => {
        let comparison = 0;

        if (sortField === 'dataEmissao') {
          const valA = (a.dataEmissao || '').trim();
          const valB = (b.dataEmissao || '').trim();
          comparison = valA.localeCompare(valB);
        } else if (sortField === 'numero') {
          const cleanA = cleanNumeroNF(a.numero);
          const cleanB = cleanNumeroNF(b.numero);
          const numA = parseInt(cleanA, 10);
          const numB = parseInt(cleanB, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            comparison = numA - numB;
          } else {
            comparison = (a.numero || '').localeCompare(b.numero || '', 'pt-BR', { numeric: true, sensitivity: 'base' });
          }
        } else if (sortField === 'empresa') {
          comparison = (a.empresa || '').localeCompare(b.empresa || '', 'pt-BR', { sensitivity: 'base' });
        } else if (sortField === 'filial') {
          comparison = (a.filial || '').localeCompare(b.filial || '', 'pt-BR', { sensitivity: 'base' });
        } else if (sortField === 'emissor') {
          comparison = (a.emissor || '').localeCompare(b.emissor || '', 'pt-BR', { sensitivity: 'base' });
        } else if (sortField === 'numeroPedido') {
          comparison = (a.numeroPedido || '').localeCompare(b.numeroPedido || '', 'pt-BR', { numeric: true, sensitivity: 'base' });
        } else if (sortField === 'dataVencimento') {
          const valA = (a.dataVencimento || '').trim();
          const valB = (b.dataVencimento || '').trim();
          if (!valA && valB) comparison = 1;
          else if (valA && !valB) comparison = -1;
          else comparison = valA.localeCompare(valB);
        } else if (sortField === 'valorTotalNota') {
          comparison = (a.valorTotalNota || 0) - (b.valorTotalNota || 0);
        }

        // Secondary deterministic fallback
        if (comparison === 0) {
          const dateA = (a.dataEmissao || a.dataCadastro || '');
          const dateB = (b.dataEmissao || b.dataCadastro || '');
          return dateB.localeCompare(dateA);
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [notasFiscais, currentSubTab, searchQuery, selectedEmpresa, selectedFilialFilter, sortField, sortOrder]);

  // Counts for financeiro badge tabs
  const totalNotasCount = notasFiscais.length;
  const aptasFinanceiroCount = useMemo(() => {
    return notasFiscais.filter(isNotaAptaFinanceiro).length;
  }, [notasFiscais]);
  const pendentesEnvioFinanceiroCount = useMemo(() => {
    return notasFiscais.filter(nf => isNotaAptaFinanceiro(nf) && !nf.enviadoFinanceiro).length;
  }, [notasFiscais]);
  const enviadasFinanceiroCount = useMemo(() => {
    return notasFiscais.filter(nf => nf.enviadoFinanceiro).length;
  }, [notasFiscais]);

  // Total summary of filtered invoices
  const stats = useMemo(() => {
    const totalValue = filteredNotas.reduce((sum, n) => sum + n.valorTotalNota, 0);
    const count = filteredNotas.length;
    const itemsCount = filteredNotas.reduce((sum, n) => sum + n.itens.reduce((s, i) => s + i.quantidade, 0), 0);
    return { totalValue, count, itemsCount };
  }, [filteredNotas]);

  // Simulate downloading/viewing a file
  const handleSimulateDownload = (file: NotaFiscalAnexo) => {
    // If we have base64, we can let user download it
    if (file.base64) {
      const link = document.createElement('a');
      link.href = file.base64;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create a dummy text file to download for demonstration
      const blob = new Blob([`Simulação do arquivo: ${file.name}\nTamanho original: ${(file.size / 1024).toFixed(1)} KB`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name.endsWith('.pdf') ? file.name : `${file.name}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-8" id="nf-container">
      {/* Toast Notification for email sending */}
      <AnimatePresence>
        {sendFinanceiroToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 max-w-md bg-emerald-700 text-white p-4 rounded-2xl shadow-xl flex items-center space-x-3 border border-emerald-500"
          >
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div className="text-xs font-sans">
              <p className="font-bold">E-mail Enviado ao Financeiro!</p>
              <p className="opacity-90">{sendFinanceiroToast}</p>
            </div>
            <button
              onClick={() => setSendFinanceiroToast(null)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-auto cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          HEADER SECTION (Title & Sub-Tab Switcher)
          ========================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0 bg-white border border-natural-border p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              {currentSubTab === 'financeiro' ? <DollarSign size={20} /> : <FileText size={20} />}
            </div>
            <h1 className="text-xl font-serif italic font-bold tracking-tight text-natural-text">
              {currentSubTab === 'financeiro' ? 'Notas Fiscais - Módulo Financeiro' : 'Gestão de Notas Fiscais'}
            </h1>
          </div>
          <p className="text-xs text-natural-muted leading-relaxed">
            {currentSubTab === 'financeiro' 
              ? 'Notas fiscais contendo Nota Fiscal e Boleto anexados estão aptas para envio direto ao departamento financeiro.' 
              : 'Registre notas fiscais de hardware, vincule boletos de cobrança e controle compras das empresas Bio Brands e Bio Scientific.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* SubTab Toggle Bar */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-medium">
            <button
              id="subtab-todas-notas"
              type="button"
              onClick={() => setInternalSubTab('todas')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentSubTab === 'todas'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-natural-muted hover:text-natural-text'
              }`}
            >
              <FileSpreadsheet size={14} />
              <span>Todas as Notas</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                currentSubTab === 'todas' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {totalNotasCount}
              </span>
            </button>

            <button
              id="subtab-financeiro-notas"
              type="button"
              onClick={() => setInternalSubTab('financeiro')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentSubTab === 'financeiro'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'text-natural-muted hover:text-natural-text'
              }`}
            >
              <DollarSign size={14} />
              <span>Financeiro</span>
              {aptasFinanceiroCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  currentSubTab === 'financeiro' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {aptasFinanceiroCount}
                </span>
              )}
            </button>
          </div>

          <button
            id="btn-register-nf"
            onClick={() => handleOpenForm(null)}
            className="bg-natural-primary hover:bg-natural-primary/95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-natural-primary/10 hover:shadow-lg hover:shadow-natural-primary/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            Cadastrar Nota Fiscal
          </button>
        </div>
      </div>

      {/* Financeiro Sub-Tab Information Banner (When Financeiro Tab is active) */}
      {currentSubTab === 'financeiro' && (
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start md:items-center space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 md:mt-0">
              <MailCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                <span>Notas com Nota Fiscal e Boleto (Financeiro)</span>
                <span className="text-[10px] bg-emerald-200/60 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-md">
                  {pendentesEnvioFinanceiroCount} pendente{pendentesEnvioFinanceiroCount !== 1 ? 's' : ''} / {enviadasFinanceiroCount} enviada{enviadasFinanceiroCount !== 1 ? 's' : ''}
                </span>
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
                Exibindo somente as notas fiscais que possuem o anexo do documento fiscal e o boleto bancário. Destinatário padrão: <strong className="font-mono underline">{EMAIL_FINANCEIRO_DESTINO}</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSwitchSubTab('todas')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer"
          >
            Ver Todas as Notas
          </button>
        </div>
      )}

      {/* ==========================================
          STATS CARDS GRID
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-natural-border p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-wider text-natural-muted uppercase">
              {currentSubTab === 'financeiro' ? 'Valor Total (Financeiro)' : 'Total Acumulado'}
            </span>
            <div className="text-xl font-serif italic font-bold text-natural-text font-mono">
              {formatCurrency(stats.totalValue)}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white border border-natural-border p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-wider text-natural-muted uppercase">
              {currentSubTab === 'financeiro' ? 'Notas no Financeiro' : 'Notas Registradas'}
            </span>
            <div className="text-xl font-serif italic font-bold text-natural-text font-mono">
              {stats.count}
            </div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
            {currentSubTab === 'financeiro' ? <DollarSign size={20} /> : <FileSpreadsheet size={20} />}
          </div>
        </div>

        <div className="bg-white border border-natural-border p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-wider text-natural-muted uppercase">
              {currentSubTab === 'financeiro' ? 'Enviadas ao Financeiro' : 'Qtd Itens Adquiridos'}
            </span>
            <div className="text-xl font-serif italic font-bold text-natural-text font-mono">
              {currentSubTab === 'financeiro' ? enviadasFinanceiroCount : stats.itemsCount}
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
            {currentSubTab === 'financeiro' ? <Send size={20} /> : <ShoppingCart size={20} />}
          </div>
        </div>
      </div>

      {/* ==========================================
          FILTERS & SEARCH BAR
          ========================================== */}
      <div className="bg-white border border-natural-border rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          
          {/* Search box */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-natural-muted">
              <Search size={16} />
            </div>
            <input
              id="search-nf-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por número da NF, fornecedor, itens..."
              className="w-full bg-slate-50 border border-natural-border rounded-xl pl-10 pr-4 py-2 text-xs text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                id="btn-clear-search"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-natural-muted hover:text-natural-text cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Company Filter */}
          <div className="md:col-span-3">
            <select
              id="filter-nf-empresa"
              value={selectedEmpresa}
              onChange={(e) => {
                setSelectedEmpresa(e.target.value);
                setSelectedFilialFilter('All');
              }}
              className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all cursor-pointer"
            >
              <option value="All">Todas Empresas (Filtro)</option>
              <option value="Bio Brands">Bio Brands</option>
              <option value="Bio Scientific">Bio Scientific</option>
            </select>
          </div>

          {/* Filial Filter */}
          <div className="md:col-span-3">
            <select
              id="filter-nf-filial"
              value={selectedFilialFilter}
              onChange={(e) => setSelectedFilialFilter(e.target.value)}
              className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all cursor-pointer"
            >
              <option value="All">Todas as Filiais ({availableFilterFiliais.length})</option>
              {availableFilterFiliais.map((filial) => (
                <option key={filial} value={filial}>
                  {filial}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ==========================================
          NOTAS FISCAIS TABLE LIST
          ========================================== */}
      <div className="bg-white border border-natural-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-natural-muted font-mono border-b border-natural-border font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                {/* Data Emissão */}
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                  onClick={() => handleSort('dataEmissao')}
                  title="Clique para ordenar por Data de Emissão"
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'dataEmissao' ? 'text-indigo-600 font-bold' : ''}>
                      Data Emissão
                    </span>
                    {sortField === 'dataEmissao' ? (
                      sortOrder === 'desc' ? (
                        <ArrowDown size={13} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUp size={13} className="text-indigo-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-slate-400 opacity-40 group-hover:opacity-100 shrink-0" />
                    )}
                  </div>
                </th>

                {/* Número */}
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                  onClick={() => handleSort('numero')}
                  title="Clique para ordenar por Número da NF"
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'numero' ? 'text-indigo-600 font-bold' : ''}>
                      Número
                    </span>
                    {sortField === 'numero' ? (
                      sortOrder === 'desc' ? (
                        <ArrowDown size={13} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUp size={13} className="text-indigo-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-slate-400 opacity-40 group-hover:opacity-100 shrink-0" />
                    )}
                  </div>
                </th>

                {/* Empresa */}
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                  onClick={() => handleSort('empresa')}
                  title="Clique para ordenar por Empresa"
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'empresa' ? 'text-indigo-600 font-bold' : ''}>
                      Empresa
                    </span>
                    {sortField === 'empresa' ? (
                      sortOrder === 'desc' ? (
                        <ArrowDown size={13} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUp size={13} className="text-indigo-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-slate-400 opacity-40 group-hover:opacity-100 shrink-0" />
                    )}
                  </div>
                </th>

                {/* Filial */}
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                  onClick={() => handleSort('filial')}
                  title="Clique para ordenar por Filial"
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'filial' ? 'text-indigo-600 font-bold' : ''}>
                      Filial
                    </span>
                    {sortField === 'filial' ? (
                      sortOrder === 'desc' ? (
                        <ArrowDown size={13} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUp size={13} className="text-indigo-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-slate-400 opacity-40 group-hover:opacity-100 shrink-0" />
                    )}
                  </div>
                </th>

                {/* Emissor / Fornecedor */}
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                  onClick={() => handleSort('emissor')}
                  title="Clique para ordenar por Emissor / Fornecedor"
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'emissor' ? 'text-indigo-600 font-bold' : ''}>
                      Emissor / Fornecedor
                    </span>
                    {sortField === 'emissor' ? (
                      sortOrder === 'desc' ? (
                        <ArrowDown size={13} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUp size={13} className="text-indigo-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-slate-400 opacity-40 group-hover:opacity-100 shrink-0" />
                    )}
                  </div>
                </th>

                {/* N. Pedido */}
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                  onClick={() => handleSort('numeroPedido')}
                  title="Clique para ordenar por N. Pedido"
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'numeroPedido' ? 'text-indigo-600 font-bold' : ''}>
                      N. Pedido
                    </span>
                    {sortField === 'numeroPedido' ? (
                      sortOrder === 'desc' ? (
                        <ArrowDown size={13} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUp size={13} className="text-indigo-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-slate-400 opacity-40 group-hover:opacity-100 shrink-0" />
                    )}
                  </div>
                </th>

                {/* Data Vencimento */}
                <th
                  className="px-3 py-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                  onClick={() => handleSort('dataVencimento')}
                  title="Clique para ordenar por Data de Vencimento"
                >
                  <div className="flex items-center space-x-1">
                    <span className={sortField === 'dataVencimento' ? 'text-indigo-600 font-bold' : ''}>
                      Data Vencimento
                    </span>
                    {sortField === 'dataVencimento' ? (
                      sortOrder === 'desc' ? (
                        <ArrowDown size={13} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUp size={13} className="text-indigo-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-slate-400 opacity-40 group-hover:opacity-100 shrink-0" />
                    )}
                  </div>
                </th>

                {/* Anexos */}
                <th className="px-3 py-3">Anexos</th>

                {/* Valor Total */}
                <th
                  className="px-3 py-3 text-right cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                  onClick={() => handleSort('valorTotalNota')}
                  title="Clique para ordenar por Valor Total"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span className={sortField === 'valorTotalNota' ? 'text-indigo-600 font-bold' : ''}>
                      Valor Total
                    </span>
                    {sortField === 'valorTotalNota' ? (
                      sortOrder === 'desc' ? (
                        <ArrowDown size={13} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUp size={13} className="text-indigo-600 shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-slate-400 opacity-40 group-hover:opacity-100 shrink-0" />
                    )}
                  </div>
                </th>

                {/* Ações */}
                <th className="px-3 py-3 text-center min-w-[140px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              <AnimatePresence mode="popLayout">
                {filteredNotas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-natural-muted">
                      <FileText size={36} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium">Nenhuma nota fiscal encontrada.</p>
                      <p className="text-xs text-natural-muted mt-0.5">
                        Experimente redefinir os filtros ou buscar por outro termo.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredNotas.map((nf) => (
                    <motion.tr
                      key={nf.id}
                      id={`nf-row-${nf.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Data Emissão */}
                      <td className="px-3 py-3 whitespace-nowrap font-mono font-medium text-slate-700">
                        {formatDateBR(nf.dataEmissao)}
                      </td>

                      {/* Número */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="font-mono bg-slate-100 border border-slate-200 font-bold px-2 py-0.5 rounded text-slate-700 text-[11px]">
                          Nº {cleanNumeroNF(nf.numero)}
                        </span>
                      </td>

                      {/* Empresa */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                            nf.empresa === 'Bio Brands'
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                              : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          }`}
                        >
                          {nf.empresa}
                        </span>
                      </td>

                      {/* Filial */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Building size={12} className="text-slate-400 shrink-0" />
                          <span className="text-xs font-bold text-natural-text uppercase tracking-tight" title={nf.filial}>
                            {nf.filial || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Emissor / Fornecedor (Nome e Sobrenome visualmente) */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="font-semibold text-natural-text block truncate" title={nf.emissor}>
                          {getShortEmissorName(nf.emissor)}
                        </span>
                      </td>

                      {/* N. Pedido */}
                      <td className="px-3 py-3 whitespace-nowrap font-mono text-xs">
                        {nf.numeroPedido ? (
                          <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                            {nf.numeroPedido}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Data Vencimento */}
                      <td className="px-3 py-3 whitespace-nowrap font-mono text-xs">
                        {nf.dataVencimento ? (
                          <span className="text-slate-700 font-medium">
                            {formatDateBR(nf.dataVencimento)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Anexos */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          {nf.notaFiscalFile && (
                            <span className="text-[10px] bg-slate-50 border border-slate-200 text-natural-text px-1.5 py-0.5 rounded flex items-center font-mono" title={`Nota Fiscal: ${nf.notaFiscalFile.name}`}>
                              <FileText size={11} className="mr-0.5 text-indigo-500" />
                              NF
                            </span>
                          )}
                          {(nf.boletoFile || (nf.outrosArquivos && nf.outrosArquivos.some(f => f.name.toLowerCase().includes('boleto') || f.name.toLowerCase().includes('fatura')))) && (
                            <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded flex items-center font-mono" title="Boleto Bancário Anexado">
                              <Receipt size={11} className="mr-0.5 text-emerald-600" />
                              Boleto
                            </span>
                          )}
                          {nf.outrosArquivos && nf.outrosArquivos.length > 0 && !nf.boletoFile && !nf.outrosArquivos.some(f => f.name.toLowerCase().includes('boleto')) && (
                            <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center font-mono" title={`${nf.outrosArquivos.length} outros anexos`}>
                              <File size={11} className="mr-0.5 text-amber-500" />
                              +{nf.outrosArquivos.length}
                            </span>
                          )}
                          {nf.enviadoFinanceiro && (
                            <span className="text-[9px] bg-emerald-100 border border-emerald-300 text-emerald-800 font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5" title={`Enviado ao Financeiro em ${nf.dataEnvioFinanceiro ? formatDateBR(nf.dataEnvioFinanceiro.split('T')[0]) : ''}`}>
                              <CheckCircle2 size={10} className="text-emerald-700" />
                              Enviado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Valor Total */}
                      <td className="px-3 py-3 text-right whitespace-nowrap font-mono font-bold text-natural-text">
                        {formatCurrency(nf.valorTotalNota)}
                      </td>

                      {/* Ações */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Botão Enviar ao Financeiro quando a nota está apta */}
                          {isNotaAptaFinanceiro(nf) && (
                            <button
                              id={`btn-send-financeiro-${nf.id}`}
                              onClick={() => handleOpenSendModal(nf)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                                nf.enviadoFinanceiro
                                  ? 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                              }`}
                              title={
                                nf.enviadoFinanceiro
                                  ? `Já enviado ao financeiro (${EMAIL_FINANCEIRO_DESTINO}). Clique para reenviar.`
                                  : `Enviar para o departamento financeiro (${EMAIL_FINANCEIRO_DESTINO})`
                              }
                            >
                              <Send size={11} />
                              <span>{nf.enviadoFinanceiro ? 'Reenviar' : 'Enviar'}</span>
                            </button>
                          )}

                          <button
                            id={`btn-view-details-${nf.id}`}
                            onClick={() => setSelectedNotaForDetails(nf)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Visualizar detalhes da Nota Fiscal"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            id={`btn-duplicate-nf-${nf.id}`}
                            onClick={() => handleDuplicateNota(nf)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title="Duplicar Nota Fiscal (Criar novo registro com Número e Anexos em branco)"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            id={`btn-edit-nf-${nf.id}`}
                            onClick={() => handleOpenForm(nf)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Editar Nota Fiscal"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            id={`btn-delete-nf-${nf.id}`}
                            onClick={() => setNfIdToDelete(nf.id)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Nota Fiscal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          INVOICE DETAILS MODAL
          ========================================== */}
      <AnimatePresence>
        {selectedNotaForDetails && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0" 
              onClick={() => setSelectedNotaForDetails(null)} 
            />
            
            <motion.div
              id="nf-details-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-natural-border shadow-2xl max-w-3xl w-full overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header detailed view */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-natural-border shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
                    <Eye size={18} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        NF Nº {cleanNumeroNF(selectedNotaForDetails.numero)}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        selectedNotaForDetails.empresa === 'Bio Brands' 
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                          : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      }`}>
                        {selectedNotaForDetails.empresa}
                      </span>
                    </div>
                    <h2 className="text-base font-serif italic font-bold text-natural-text truncate max-w-md">
                      {selectedNotaForDetails.emissor}
                    </h2>
                  </div>
                </div>

                <button
                  id="btn-close-details"
                  onClick={() => setSelectedNotaForDetails(null)}
                  className="p-1.5 text-natural-muted hover:text-natural-text hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable details content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Quick Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs font-mono">
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                    <span className="text-natural-muted block uppercase text-[9px] tracking-wider font-bold">Data Emissão</span>
                    <span className="text-natural-text font-bold block truncate">{formatDateBR(selectedNotaForDetails.dataEmissao)}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                    <span className="text-natural-muted block uppercase text-[9px] tracking-wider font-bold">Data Venc.</span>
                    <span className="text-natural-text font-bold block truncate">
                      {selectedNotaForDetails.dataVencimento ? formatDateBR(selectedNotaForDetails.dataVencimento) : 'Não informada'}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                    <span className="text-natural-muted block uppercase text-[9px] tracking-wider font-bold">Filial</span>
                    <span className="text-natural-text font-bold block truncate">{selectedNotaForDetails.filial || 'Não informada'}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                    <span className="text-natural-muted block uppercase text-[9px] tracking-wider font-bold">Nº Contrato</span>
                    <span className="text-indigo-600 font-bold block truncate">{selectedNotaForDetails.contrato || 'Sem contrato'}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                    <span className="text-natural-muted block uppercase text-[9px] tracking-wider font-bold">Nº Pedido</span>
                    <span className="text-natural-text font-bold block truncate">{selectedNotaForDetails.numeroPedido || '-'}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                    <span className="text-natural-muted block uppercase text-[9px] tracking-wider font-bold">Natureza</span>
                    <span className="text-natural-text font-bold block truncate">{selectedNotaForDetails.natureza || '-'}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                    <span className="text-natural-muted block uppercase text-[9px] tracking-wider font-bold">CDC</span>
                    <span className="text-natural-text font-bold block truncate">{selectedNotaForDetails.cdc || '-'}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                    <span className="text-natural-muted block uppercase text-[9px] tracking-wider font-bold text-indigo-600">Valor Total</span>
                    <span className="text-natural-text font-bold block text-sm text-indigo-600 truncate">{formatCurrency(selectedNotaForDetails.valorTotalNota)}</span>
                  </div>
                </div>

                {/* Items Table list */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-natural-text uppercase font-mono tracking-wider">
                    Itens Cadastrados na Nota
                  </h3>

                  <div className="border border-natural-border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-natural-muted font-mono border-b border-natural-border font-semibold">
                        <tr>
                          <th className="px-3.5 py-2.5 w-28">Cód. Totvs</th>
                          <th className="px-3.5 py-2.5 w-14 text-center">Qtd</th>
                          <th className="px-3.5 py-2.5">Descrição do Item</th>
                          <th className="px-3.5 py-2.5 text-right w-28">V. Unitário</th>
                          <th className="px-3.5 py-2.5 text-right w-28">V. Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedNotaForDetails.itens.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-3 font-mono font-semibold text-slate-700">{item.codigoTotvs || '-'}</td>
                            <td className="px-3.5 py-3 text-center font-semibold text-natural-text font-mono">{item.quantidade}</td>
                            <td className="px-3.5 py-3 text-natural-text font-medium">{item.descricao}</td>
                            <td className="px-3.5 py-3 text-right text-natural-text font-mono">{formatCurrency(item.valorUnitario)}</td>
                            <td className="px-3.5 py-3 text-right font-semibold text-natural-text font-mono">{formatCurrency(item.valorTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-natural-border font-mono font-semibold">
                        <tr>
                          <td colSpan={4} className="px-3.5 py-2.5 text-right text-natural-muted">Total Soma de Itens:</td>
                          <td className="px-3.5 py-2.5 text-right text-natural-text font-mono">{formatCurrency(selectedNotaForDetails.valorTotalNota)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Financeiro Status and Action Section */}
                <div className="border border-natural-border rounded-xl p-4 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${
                        selectedNotaForDetails.enviadoFinanceiro 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isNotaAptaFinanceiro(selectedNotaForDetails)
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-600'
                      }`}>
                        {selectedNotaForDetails.enviadoFinanceiro ? <MailCheck size={16} /> : <DollarSign size={16} />}
                      </div>
                      <span className="text-xs font-bold text-natural-text uppercase font-mono tracking-wider">
                        Status do Departamento Financeiro
                      </span>
                    </div>

                    {isNotaAptaFinanceiro(selectedNotaForDetails) && (
                      <button
                        id={`btn-details-send-financeiro-${selectedNotaForDetails.id}`}
                        onClick={() => handleOpenSendModal(selectedNotaForDetails)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                          selectedNotaForDetails.enviadoFinanceiro
                            ? 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        }`}
                      >
                        <Send size={13} />
                        <span>{selectedNotaForDetails.enviadoFinanceiro ? 'Reenviar E-mail' : 'Enviar para o Financeiro'}</span>
                      </button>
                    )}
                  </div>

                  {selectedNotaForDetails.enviadoFinanceiro ? (
                    <div className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200/80 p-3 rounded-lg flex items-start space-x-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold">E-mail já transmitido ao Departamento Financeiro</p>
                        <p className="text-emerald-800">
                          Destinatário: <strong className="font-mono">{selectedNotaForDetails.emailEnvioFinanceiro || EMAIL_FINANCEIRO_DESTINO}</strong> • Data: <span className="font-mono">{selectedNotaForDetails.dataEnvioFinanceiro ? new Date(selectedNotaForDetails.dataEnvioFinanceiro).toLocaleString('pt-BR') : 'Data não registrada'}</span>
                        </p>
                      </div>
                    </div>
                  ) : isNotaAptaFinanceiro(selectedNotaForDetails) ? (
                    <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200/80 p-3 rounded-lg flex items-start space-x-2.5">
                      <CheckCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold">Nota Pronta para Envio</p>
                        <p className="text-amber-800">
                          A nota fiscal e o boleto bancário estão anexados e prontos para envio direto ao e-mail <strong className="font-mono">{EMAIL_FINANCEIRO_DESTINO}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 bg-white border border-slate-200 p-3 rounded-lg flex items-start space-x-2.5">
                      <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-700">Pendente de Anexos para o Financeiro</p>
                        <p className="text-slate-500">
                          Para habilitar o envio automático para o financeiro ({EMAIL_FINANCEIRO_DESTINO}), certifique-se de que tanto o <strong>Documento Fiscal</strong> quanto o <strong>Boleto Bancário</strong> estejam anexados.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Document downloads row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Primary Invoice Document */}
                  <div className="border border-natural-border p-3.5 rounded-xl space-y-2.5 bg-slate-50/40">
                    <div className="flex items-center space-x-1.5">
                      <FileText size={16} className="text-indigo-500" />
                      <span className="text-xs font-semibold text-natural-text">Documento Fiscal (XML/PDF)</span>
                    </div>
                    
                    {selectedNotaForDetails.notaFiscalFile ? (
                      <div className="flex items-center justify-between p-2 bg-white border border-natural-border rounded-lg text-xs font-mono">
                        <div className="truncate pr-1.5">
                          <span className="font-semibold block truncate text-natural-text">{selectedNotaForDetails.notaFiscalFile.name}</span>
                          <span className="text-[9px] text-natural-muted block">{(selectedNotaForDetails.notaFiscalFile.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button
                          id={`btn-dl-primary-${selectedNotaForDetails.id}`}
                          onClick={() => handleSimulateDownload(selectedNotaForDetails.notaFiscalFile!)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Download Arquivo"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs italic text-natural-muted pl-0.5">Sem nota fiscal anexada.</p>
                    )}
                  </div>

                  {/* Boleto Bancário */}
                  <div className="border border-natural-border p-3.5 rounded-xl space-y-2.5 bg-slate-50/40">
                    <div className="flex items-center space-x-1.5">
                      <Receipt size={16} className="text-emerald-600" />
                      <span className="text-xs font-semibold text-natural-text">Boleto Bancário / Fatura</span>
                    </div>

                    {selectedNotaForDetails.boletoFile ? (
                      <div className="flex items-center justify-between p-2 bg-white border border-emerald-200 rounded-lg text-xs font-mono">
                        <div className="truncate pr-1.5">
                          <span className="font-semibold block truncate text-emerald-950">{selectedNotaForDetails.boletoFile.name}</span>
                          <span className="text-[9px] text-emerald-700 block">{(selectedNotaForDetails.boletoFile.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button
                          id={`btn-dl-boleto-${selectedNotaForDetails.id}`}
                          onClick={() => handleSimulateDownload(selectedNotaForDetails.boletoFile!)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Download Boleto"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs italic text-natural-muted pl-0.5">Nenhum boleto anexado.</p>
                    )}
                  </div>

                  {/* Other Documents */}
                  <div className="border border-natural-border p-3.5 rounded-xl space-y-2.5 bg-slate-50/40">
                    <div className="flex items-center space-x-1.5">
                      <File size={16} className="text-amber-500" />
                      <span className="text-xs font-semibold text-natural-text">Outros Anexos</span>
                    </div>

                    {!selectedNotaForDetails.outrosArquivos || selectedNotaForDetails.outrosArquivos.length === 0 ? (
                      <p className="text-xs italic text-natural-muted pl-0.5">Sem outros arquivos.</p>
                    ) : (
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {selectedNotaForDetails.outrosArquivos.map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-1.5 bg-white border border-natural-border rounded-lg text-xs font-mono">
                            <div className="truncate pr-1.5">
                              <span className="font-medium block truncate text-natural-text text-[11px]">{file.name}</span>
                              <span className="text-[9px] text-natural-muted block">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button
                              id={`btn-dl-other-${selectedNotaForDetails.id}-${i}`}
                              onClick={() => handleSimulateDownload(file)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Download Arquivo"
                            >
                              <Download size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments / notes block */}
                {selectedNotaForDetails.observacoes && (
                  <div className="bg-amber-50/30 border border-amber-100/60 p-4 rounded-xl space-y-1 text-xs">
                    <span className="font-bold text-natural-text block">Observações do Registro:</span>
                    <p className="text-natural-text italic leading-relaxed">{selectedNotaForDetails.observacoes}</p>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="bg-slate-50 px-6 py-3.5 border-t border-natural-border flex items-center justify-end space-x-2 shrink-0">
                <button
                  id="btn-duplicate-from-details"
                  onClick={() => {
                    const nota = selectedNotaForDetails;
                    setSelectedNotaForDetails(null);
                    handleDuplicateNota(nota);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Duplicar Nota</span>
                </button>
                <button
                  id="btn-close-details-footer"
                  onClick={() => setSelectedNotaForDetails(null)}
                  className="px-4 py-2 bg-white border border-natural-border rounded-xl text-xs font-semibold text-natural-text hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          INVOICE CREATION / EDIT MODAL
          ========================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setIsFormOpen(false)} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-natural-border shadow-2xl max-w-2xl w-full overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header Form */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-natural-border shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-[9px] font-mono font-bold tracking-widest text-natural-muted uppercase leading-none mb-1">
                    Gestão Fiscal
                  </h3>
                  <span className="text-base font-serif italic text-natural-text font-bold">
                    {editingNota ? 'Editar Nota Fiscal' : 'Cadastrar Nota Fiscal'}
                  </span>
                </div>
              </div>
              <button
                id="btn-close-form-nf"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-natural-muted hover:text-natural-text hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="bg-red-50 border-b border-red-100 px-6 py-2.5 text-xs text-red-600 flex items-center space-x-2 shrink-0">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Scrollable Form Area */}
            <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* 1. Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Nº da Nota Fiscal *
                  </label>
                  <input
                    id="nf-input-numero"
                    type="text"
                    required
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Ex: 000.123.456"
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3.5 py-2 text-xs text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Fornecedor/Emissor *
                  </label>
                  <input
                    id="nf-input-emissor"
                    type="text"
                    required
                    value={emissor}
                    onChange={(e) => setEmissor(e.target.value)}
                    placeholder="Ex: Dell Computadores Ltda"
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3.5 py-2 text-xs text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Data de Emissão *
                  </label>
                  <input
                    id="nf-input-data-emissao"
                    type="date"
                    required
                    value={dataEmissao}
                    onChange={(e) => setDataEmissao(e.target.value)}
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3.5 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Data de Vencimento
                  </label>
                  <input
                    id="nf-input-data-vencimento"
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3.5 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* 2. Empresa Vinculada, Filial e Contrato */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-natural-text">
                    Empresa Pagadora / Vinculada *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="btn-empresa-brands"
                      type="button"
                      onClick={() => handleEmpresaChange('Bio Brands')}
                      className={`p-3 border rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                        empresa === 'Bio Brands'
                          ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 ring-2 ring-indigo-500/20'
                          : 'border-natural-border bg-slate-50 text-natural-text hover:bg-slate-100/50'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">Bio Brands</span>
                        <span className="text-[10px] text-natural-muted block">Operações de marcas de consumo</span>
                      </div>
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        empresa === 'Bio Brands' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                      }`}>
                        {empresa === 'Bio Brands' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>

                    <button
                      id="btn-empresa-scientific"
                      type="button"
                      onClick={() => handleEmpresaChange('Bio Scientific')}
                      className={`p-3 border rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                        empresa === 'Bio Scientific'
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 ring-2 ring-emerald-500/20'
                          : 'border-natural-border bg-slate-50 text-natural-text hover:bg-slate-100/50'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">Bio Scientific</span>
                        <span className="text-[10px] text-natural-muted block">Laboratórios e biotecnologia</span>
                      </div>
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        empresa === 'Bio Scientific' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                      }`}>
                        {empresa === 'Bio Scientific' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Filial e Contrato */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Filial */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Building size={13} className="text-natural-muted" />
                        <span>Filial *</span>
                      </span>
                      <span className="text-[10px] text-natural-muted font-mono">
                        ({filialOptions.length} filiais {empresa})
                      </span>
                    </label>
                    <select
                      id="nf-select-filial"
                      value={filial}
                      onChange={(e) => setFilial(e.target.value)}
                      className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all font-medium"
                    >
                      {filialOptions.map((fil) => (
                        <option key={fil} value={fil}>
                          {fil}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Contrato */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-natural-text">
                      Contrato <span className="text-xs font-normal text-natural-muted">(Opcional)</span>
                    </label>
                    <input
                      id="nf-input-contrato"
                      type="text"
                      value={contrato}
                      onChange={(e) => setContrato(e.target.value)}
                      placeholder="Ex: CTR-2026-089 / Locação"
                      className="w-full bg-slate-50 border border-natural-border rounded-xl px-3.5 py-2 text-xs text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Campos N. Pedido (06 dígitos), Natureza (05 dígitos) e CDC (06 dígitos) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                      <span>Nº Pedido</span>
                      <span className="text-[10px] text-natural-muted font-mono">(06 dígitos)</span>
                    </label>
                    <input
                      id="nf-input-pedido"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={numeroPedido}
                      onChange={(e) => setNumeroPedido(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Ex: 104829"
                      className="w-full bg-slate-50 border border-natural-border rounded-xl px-3.5 py-2 text-xs text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                      <span>Natureza</span>
                      <span className="text-[10px] text-natural-muted font-mono">(05 dígitos)</span>
                    </label>
                    <input
                      id="nf-input-natureza"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={natureza}
                      onChange={(e) => setNatureza(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="Ex: 11020"
                      className="w-full bg-slate-50 border border-natural-border rounded-xl px-3.5 py-2 text-xs text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                      <span>CDC</span>
                      <span className="text-[10px] text-natural-muted font-mono">(06 dígitos)</span>
                    </label>
                    <input
                      id="nf-input-cdc"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={cdc}
                      onChange={(e) => setCdc(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Ex: 020101"
                      className="w-full bg-slate-50 border border-natural-border rounded-xl px-3.5 py-2 text-xs text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Items list with sub-form */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-natural-text uppercase font-mono tracking-wider">
                    Itens da Nota Fiscal
                  </span>
                  <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                    Total Acumulado: {formatCurrency(computedTotalNota)}
                  </span>
                </div>

                {/* Subform to add single item */}
                <div className="bg-slate-50/60 border border-natural-border p-3 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-natural-muted uppercase font-mono block">Inserir Novo Item</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    
                    {/* Código Totvs (10 dígitos) */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[10px] font-bold text-natural-text flex items-center justify-between">
                        <span>Código Totvs</span>
                        <span className="text-[9px] text-natural-muted font-mono">10 díg</span>
                      </label>
                      <input
                        id="temp-item-totvs"
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={tempCodigoTotvs}
                        onChange={(e) => setTempCodigoTotvs(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Ex: 0001048291"
                        className="w-full bg-white border border-natural-border rounded-lg px-2.5 py-1.5 text-xs text-natural-text font-mono focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    {/* Item Description */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="block text-[10px] font-bold text-natural-text">Descrição do Item *</label>
                      <input
                        id="temp-item-desc"
                        type="text"
                        value={tempDescricao}
                        onChange={(e) => setTempDescricao(e.target.value)}
                        placeholder="Ex: Notebook Latitude 3440"
                        className="w-full bg-white border border-natural-border rounded-lg px-2.5 py-1.5 text-xs text-natural-text focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] font-bold text-natural-text">Qtd</label>
                      <input
                        id="temp-item-qtd"
                        type="number"
                        min="1"
                        value={tempQuantidade}
                        onChange={(e) => setTempQuantidade(Number(e.target.value))}
                        className="w-full bg-white border border-natural-border rounded-lg px-2.5 py-1.5 text-xs text-natural-text text-center font-mono focus:outline-hidden"
                      />
                    </div>

                    {/* Unit Value */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] font-bold text-natural-text">V. Unitário (R$)</label>
                      <input
                        id="temp-item-value"
                        type="text"
                        value={tempValorUnitarioStr}
                        onChange={handleValorUnitarioChange}
                        className="w-full bg-white border border-natural-border rounded-lg px-2.5 py-1.5 text-xs text-natural-text text-right font-mono focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        placeholder="R$ 0,00"
                      />
                    </div>

                    {/* Add Button */}
                    <div className="sm:col-span-1">
                      <button
                        id="btn-add-temp-item"
                        type="button"
                        onClick={handleAddItem}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                        title="Adicionar Item"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                  </div>
                </div>

                {/* Grid list of already inserted items */}
                {itens.length === 0 ? (
                  <div className="p-4 border border-dashed border-natural-border text-center rounded-xl text-xs text-natural-muted italic">
                    Nenhum item adicionado à lista. Por favor, adicione pelo menos um item acima.
                  </div>
                ) : (
                  <div className="border border-natural-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-natural-muted font-mono border-b border-natural-border font-semibold">
                        <tr>
                          <th className="px-3 py-2 w-28">Cód. Totvs</th>
                          <th className="px-3 py-2 w-12 text-center">Qtd</th>
                          <th className="px-3 py-2">Descrição</th>
                          <th className="px-3 py-2 text-right">Unitário</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {itens.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/40">
                            <td className="px-3 py-2 text-slate-700 font-mono font-semibold">{item.codigoTotvs || '-'}</td>
                            <td className="px-3 py-2 text-center font-bold text-natural-text font-mono">{item.quantidade}</td>
                            <td className="px-3 py-2 text-natural-text">{item.descricao}</td>
                            <td className="px-3 py-2 text-right text-natural-text font-mono">{formatCurrency(item.valorUnitario)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-natural-text font-mono">{formatCurrency(item.valorTotal)}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                id={`btn-remove-item-${item.id}`}
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                title="Remover Item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 4. DRAG AND DROP FILE UPLOADS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3 border-t border-slate-100">
                
                {/* File Upload A: Nota Fiscal Principal */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                    <span>Nota Fiscal Principal *</span>
                    <span className="text-[9px] text-red-500 bg-red-50 border border-red-100 font-bold px-1.5 py-0.5 rounded uppercase">Obrigatório</span>
                  </label>

                  <div 
                    id="drag-primary-container"
                    onDragEnter={handleDragPrimary}
                    onDragOver={handleDragPrimary}
                    onDragLeave={handleDragPrimary}
                    onDrop={handleDropPrimary}
                    onClick={() => primaryFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[125px] ${
                      dragActivePrimary 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : notaFiscalFile 
                          ? 'border-indigo-300 bg-indigo-50/10' 
                          : 'border-natural-border bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <input
                      id="input-file-primary"
                      ref={primaryFileInputRef}
                      type="file"
                      accept=".pdf,.xml,.jpg,.png"
                      onChange={handleSelectPrimary}
                      className="hidden"
                    />

                    {notaFiscalFile ? (
                      <div className="space-y-1 w-full text-xs font-mono" onClick={(e) => e.stopPropagation()}>
                        <div className="p-1 bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-md inline-flex items-center gap-1 text-[10px]">
                          <CheckCircle size={11} />
                          <span>NF Carregada</span>
                        </div>
                        <p className="font-semibold truncate text-natural-text px-1 text-[11px]">{notaFiscalFile.name}</p>
                        <p className="text-[9px] text-natural-muted">{(notaFiscalFile.size / 1024).toFixed(1)} KB</p>
                        <button
                          id="btn-remove-primary-file"
                          type="button"
                          onClick={handleRemovePrimaryFile}
                          className="text-[10px] text-red-500 hover:text-red-700 underline font-bold pt-0.5 cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={20} className="text-slate-400 mb-1" />
                        <span className="text-xs font-semibold text-indigo-600">Nota Fiscal (PDF/XML)</span>
                        <span className="text-[9px] text-natural-muted mt-0.5">Arraste ou clique</span>
                      </>
                    )}
                  </div>
                </div>

                {/* File Upload B: Boleto Bancário / Cobrança */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                    <span>Boleto Bancário</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-1.5 py-0.5 rounded uppercase">Financeiro</span>
                  </label>

                  <div 
                    id="drag-boleto-container"
                    onDragEnter={handleDragBoleto}
                    onDragOver={handleDragBoleto}
                    onDragLeave={handleDragBoleto}
                    onDrop={handleDropBoleto}
                    onClick={() => boletoFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[125px] ${
                      dragActiveBoleto 
                        ? 'border-emerald-600 bg-emerald-50/50' 
                        : boletoFile 
                          ? 'border-emerald-300 bg-emerald-50/20' 
                          : 'border-natural-border bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <input
                      id="input-file-boleto"
                      ref={boletoFileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.png"
                      onChange={handleSelectBoleto}
                      className="hidden"
                    />

                    {boletoFile ? (
                      <div className="space-y-1 w-full text-xs font-mono" onClick={(e) => e.stopPropagation()}>
                        <div className="p-1 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-md inline-flex items-center gap-1 text-[10px]">
                          <Receipt size={11} />
                          <span>Boleto Carregado</span>
                        </div>
                        <p className="font-semibold truncate text-natural-text px-1 text-[11px]">{boletoFile.name}</p>
                        <p className="text-[9px] text-natural-muted">{(boletoFile.size / 1024).toFixed(1)} KB</p>
                        <button
                          id="btn-remove-boleto-file"
                          type="button"
                          onClick={handleRemoveBoletoFile}
                          className="text-[10px] text-red-500 hover:text-red-700 underline font-bold pt-0.5 cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <>
                        <Receipt size={20} className="text-emerald-600 mb-1" />
                        <span className="text-xs font-semibold text-emerald-700">Boleto / Fatura</span>
                        <span className="text-[9px] text-natural-muted mt-0.5">Habilita envio ao Financeiro</span>
                      </>
                    )}
                  </div>
                </div>

                {/* File Upload C: Other Attachments */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                    <span>Outros Anexos</span>
                    <span className="text-[9px] text-slate-500 bg-slate-100 border border-slate-200 font-bold px-1.5 py-0.5 rounded uppercase">Opcional</span>
                  </label>

                  <div 
                    id="drag-others-container"
                    onDragEnter={handleDragOthers}
                    onDragOver={handleDragOthers}
                    onDragLeave={handleDragOthers}
                    onDrop={handleDropOthers}
                    onClick={() => othersFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[125px] ${
                      dragActiveOthers 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : outrosArquivos.length > 0
                          ? 'border-slate-300 bg-slate-50' 
                          : 'border-natural-border bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <input
                      id="input-file-others"
                      ref={othersFileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.png,.xml,.doc,.docx"
                      onChange={handleSelectOthers}
                      className="hidden"
                    />

                    <Upload size={20} className="text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">Comprovantes / Recibos</span>
                    <span className="text-[9px] text-natural-muted mt-0.5">Múltiplos arquivos</span>

                    {outrosArquivos.length > 0 && (
                      <div className="mt-1.5 w-full text-[10px] font-mono space-y-1" onClick={(e) => e.stopPropagation()}>
                        <div className="border-t border-slate-200/60 pt-1 text-left">
                          <p className="font-bold text-natural-text mb-0.5">Arquivos ({outrosArquivos.length}):</p>
                          <div className="max-h-16 overflow-y-auto space-y-0.5">
                            {outrosArquivos.map((file, i) => (
                              <div key={i} className="flex items-center justify-between bg-white border border-slate-100 px-1 py-0.5 rounded text-[10px]">
                                <span className="truncate max-w-[90px] text-natural-text">{file.name}</span>
                                <button 
                                  id={`btn-remove-other-${i}`}
                                  type="button" 
                                  onClick={() => handleRemoveOtherFile(i)}
                                  className="text-red-500 hover:text-red-700 px-1 font-bold cursor-pointer"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* 5. Additional notes */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-natural-text">
                  Observações de Compra
                </label>
                <textarea
                  id="nf-input-notes"
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Instruções de pagamento, centro de custos, observações adicionais..."
                  className="w-full bg-slate-50 border border-natural-border rounded-xl px-3.5 py-2.5 text-xs text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
                />
              </div>

            </form>

            {/* Footer Form buttons */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs font-mono font-bold text-natural-muted">
                Total Geral: <strong className="text-indigo-600">{formatCurrency(computedTotalNota)}</strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-cancel-nf-form"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-white border border-natural-border rounded-xl text-xs font-semibold text-natural-text hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-nf-submit"
                  type="button"
                  onClick={handleSaveSubmit}
                  className="px-4 py-2.5 bg-natural-primary hover:bg-natural-primary/95 text-white rounded-xl text-xs font-semibold shadow-md shadow-natural-primary/10 transition-colors cursor-pointer"
                >
                  {editingNota ? 'Salvar Alterações' : 'Cadastrar Nota'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ==========================================
          MODAL: ENVIAR AO DEPARTAMENTO FINANCEIRO
          ========================================== */}
      {notaToSendToFinanceiro && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0" 
            onClick={() => {
              if (!isSendingFinanceiroEmail) {
                setNotaToSendToFinanceiro(null);
              }
            }} 
          />
          
          <motion.div
            id="modal-send-financeiro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-natural-border shadow-2xl max-w-lg w-full p-6 relative z-10 space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
                  <MailCheck size={22} />
                </div>
                <div>
                  <h3 className="font-serif italic text-base font-bold text-natural-text">
                    Enviar para o Departamento Financeiro
                  </h3>
                  <p className="text-xs text-natural-muted mt-0.5">
                    Destinatário: <strong className="font-mono text-emerald-800">{EMAIL_FINANCEIRO_DESTINO}</strong>
                  </p>
                </div>
              </div>

              {!isSendingFinanceiroEmail && (
                <button
                  id="btn-close-send-modal"
                  onClick={() => setNotaToSendToFinanceiro(null)}
                  className="p-1.5 text-natural-muted hover:text-natural-text hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Question confirmation prompt */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
                Deseja enviar esta Nota Fiscal e o Boleto anexados para o departamento financeiro?
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Caso confirmado, será disparado um e-mail para <strong className="font-mono">{EMAIL_FINANCEIRO_DESTINO}</strong> contendo o comprovante fiscal, o boleto de pagamento e o descritivo de itens.
              </p>
            </div>

            {/* Invoice & Attachments summary */}
            <div className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div>
                  <span className="text-natural-muted block text-[10px]">Nota Fiscal:</span>
                  <span className="font-bold text-natural-text">Nº {cleanNumeroNF(notaToSendToFinanceiro.numero)}</span>
                </div>
                <div>
                  <span className="text-natural-muted block text-[10px]">Empresa / Filial:</span>
                  <span className="font-bold text-natural-text">{notaToSendToFinanceiro.empresa} ({notaToSendToFinanceiro.filial || '-'})</span>
                </div>
                <div>
                  <span className="text-natural-muted block text-[10px]">Fornecedor:</span>
                  <span className="font-bold text-natural-text truncate block">{notaToSendToFinanceiro.emissor}</span>
                </div>
                <div>
                  <span className="text-natural-muted block text-[10px]">Valor Total:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(notaToSendToFinanceiro.valorTotalNota)}</span>
                </div>
                {notaToSendToFinanceiro.numeroPedido && (
                  <div>
                    <span className="text-natural-muted block text-[10px]">N. Pedido:</span>
                    <span className="font-bold text-natural-text">{notaToSendToFinanceiro.numeroPedido}</span>
                  </div>
                )}
                {notaToSendToFinanceiro.dataVencimento && (
                  <div>
                    <span className="text-natural-muted block text-[10px]">Vencimento:</span>
                    <span className="font-bold text-natural-text">{formatDateBR(notaToSendToFinanceiro.dataVencimento)}</span>
                  </div>
                )}
              </div>

              {/* Anexos confirmados */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-natural-muted uppercase font-mono tracking-wider">
                  Arquivos em Anexo no E-mail
                </span>
                <div className="space-y-1">
                  {/* NF Principal */}
                  <div className="flex items-center justify-between p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs font-mono">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText size={14} className="text-indigo-600 shrink-0" />
                      <span className="truncate font-medium text-slate-800">
                        {notaToSendToFinanceiro.notaFiscalFile?.name || 'NotaFiscal.pdf'}
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded shrink-0">
                      Documento Fiscal
                    </span>
                  </div>

                  {/* Boleto Bancário */}
                  <div className="flex items-center justify-between p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs font-mono">
                    <div className="flex items-center space-x-2 truncate">
                      <Receipt size={14} className="text-emerald-600 shrink-0" />
                      <span className="truncate font-medium text-slate-800">
                        {notaToSendToFinanceiro.boletoFile?.name || 
                          notaToSendToFinanceiro.outrosArquivos?.find(f => f.name.toLowerCase().includes('boleto') || f.name.toLowerCase().includes('fatura'))?.name || 
                          'Boleto_Bancario.pdf'}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded shrink-0">
                      Boleto Bancário
                    </span>
                  </div>

                  {/* Outros arquivos */}
                  {notaToSendToFinanceiro.outrosArquivos && notaToSendToFinanceiro.outrosArquivos.length > 0 && (
                    <p className="text-[10px] text-natural-muted font-mono pl-1">
                      + {notaToSendToFinanceiro.outrosArquivos.length} anexo(s) adicional(is)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Simulated Transmission Steps progress */}
            {isSendingFinanceiroEmail && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px] font-bold text-natural-text">
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin text-emerald-600" />
                    Transmitindo e-mail corporativo...
                  </span>
                  <span className="text-emerald-700">{sendFinanceiroStep * 25}%</span>
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-300 ease-out" 
                    style={{ width: `${sendFinanceiroStep * 25}%` }} 
                  />
                </div>

                <div className="text-[10px] text-natural-muted space-y-0.5">
                  <p className={sendFinanceiroStep >= 1 ? 'text-emerald-700 font-bold' : ''}>
                    {sendFinanceiroStep >= 1 ? '✓' : '•'} 1. Conexão segura estabelecida com servidor de e-mail
                  </p>
                  <p className={sendFinanceiroStep >= 2 ? 'text-emerald-700 font-bold' : ''}>
                    {sendFinanceiroStep >= 2 ? '✓' : '•'} 2. Anexando Nota Fiscal e Boleto Bancário
                  </p>
                  <p className={sendFinanceiroStep >= 3 ? 'text-emerald-700 font-bold' : ''}>
                    {sendFinanceiroStep >= 3 ? '✓' : '•'} 3. Enviando mensagem para {EMAIL_FINANCEIRO_DESTINO}
                  </p>
                  <p className={sendFinanceiroStep >= 4 ? 'text-emerald-700 font-bold' : ''}>
                    {sendFinanceiroStep >= 4 ? '✓' : '•'} 4. Confirmação de recebimento registrada!
                  </p>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
              <button
                id="btn-cancel-send-financeiro"
                type="button"
                disabled={isSendingFinanceiroEmail}
                onClick={() => setNotaToSendToFinanceiro(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-natural-text rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-send-financeiro"
                type="button"
                disabled={isSendingFinanceiroEmail}
                onClick={handleConfirmSendToFinanceiro}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSendingFinanceiroEmail ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Enviando E-mail...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Confirmar e Enviar E-mail</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRMATION DIALOG
          ========================================== */}
      {nfIdToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setNfIdToDelete(null)} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-natural-border shadow-2xl max-w-sm w-full p-6 relative z-10 space-y-4"
          >
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-xl border border-red-100">
                <Trash2 size={18} />
              </div>
              <h3 className="font-serif italic text-base font-bold text-natural-text">
                Confirmar Exclusão
              </h3>
            </div>

            <p className="text-xs text-natural-muted leading-relaxed">
              Você tem certeza de que deseja excluir permanentemente esta Nota Fiscal? Esta ação é irreversível e removerá todos os itens e arquivos anexados.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                id="btn-delete-cancel"
                onClick={() => setNfIdToDelete(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-natural-text rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                id="btn-delete-confirm-action"
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
