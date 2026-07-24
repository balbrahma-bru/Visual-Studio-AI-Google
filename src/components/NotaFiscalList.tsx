import React, { useState, useMemo, useRef } from 'react';
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
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotaFiscal, NotaFiscalItem, NotaFiscalAnexo, UserSettings } from '../types';

interface NotaFiscalListProps {
  notasFiscais: NotaFiscal[];
  onSave: (nota: NotaFiscal) => void;
  onDelete: (id: string) => void;
  userSettings: UserSettings;
}

export default function NotaFiscalList({ notasFiscais, onSave, onDelete, userSettings }: NotaFiscalListProps) {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('All');

  // Modal and details view states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNota, setEditingNota] = useState<NotaFiscal | null>(null);
  const [selectedNotaForDetails, setSelectedNotaForDetails] = useState<NotaFiscal | null>(null);
  const [nfIdToDelete, setNfIdToDelete] = useState<string | null>(null);

  // Form Fields State
  const [numero, setNumero] = useState('');
  const [emissor, setEmissor] = useState('');
  const [dataEmissao, setDataEmissao] = useState('');
  const [empresa, setEmpresa] = useState<'Bio Brands' | 'Bio Scientific'>('Bio Brands');
  const [observacoes, setObservacoes] = useState('');
  
  // File attachments state
  const [notaFiscalFile, setNotaFiscalFile] = useState<NotaFiscalAnexo | null>(null);
  const [outrosArquivos, setOutrosArquivos] = useState<NotaFiscalAnexo[]>([]);
  
  // Current items being added/edited in the invoice
  const [itens, setItens] = useState<NotaFiscalItem[]>([]);
  
  // Temporary fields for adding a single item
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
  const [dragActiveOthers, setDragActiveOthers] = useState(false);

  // File input refs
  const primaryFileInputRef = useRef<HTMLInputElement>(null);
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
      setEmpresa(nota.empresa);
      setObservacoes(nota.observacoes || '');
      setNotaFiscalFile(nota.notaFiscalFile || null);
      setOutrosArquivos(nota.outrosArquivos || []);
      setItens(nota.itens || []);
    } else {
      setEditingNota(null);
      setNumero('');
      setEmissor('');
      setDataEmissao(new Date().toISOString().split('T')[0]);
      setEmpresa('Bio Brands');
      setObservacoes('');
      setNotaFiscalFile(null);
      setOutrosArquivos([]);
      setItens([]);
    }
    
    // Clear temp item
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
      descricao: tempDescricao.trim(),
      quantidade: tempQuantidade,
      valorUnitario: tempValorUnitario,
      valorTotal: Number((tempQuantidade * tempValorUnitario).toFixed(2))
    };

    setItens(prev => [...prev, newItem]);
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
      dataCadastro: editingNota ? editingNota.dataCadastro : new Date().toISOString(),
      valorTotalNota: Number(computedTotalNota.toFixed(2)),
      empresa,
      itens,
      notaFiscalFile,
      outrosArquivos,
      observacoes: observacoes.trim()
    };

    onSave(payload);
    setIsFormOpen(false);
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

  // Filter and search invoices
  const filteredNotas = useMemo(() => {
    return notasFiscais
      .filter(nf => {
        // 1. Search Query
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
          nf.numero.toLowerCase().includes(query) ||
          cleanNumeroNF(nf.numero).toLowerCase().includes(query) ||
          nf.emissor.toLowerCase().includes(query) ||
          (nf.observacoes && nf.observacoes.toLowerCase().includes(query));

        // 2. Company Filter
        const matchesEmpresa = selectedEmpresa === 'All' || nf.empresa === selectedEmpresa;

        return matchesSearch && matchesEmpresa;
      })
      .sort((a, b) => {
        // Sort by dataEmissao descending (most recent date first)
        const timeA = new Date(a.dataEmissao).getTime() || 0;
        const timeB = new Date(b.dataEmissao).getTime() || 0;
        if (timeB !== timeA) {
          return timeB - timeA;
        }
        return new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime();
      });
  }, [notasFiscais, searchQuery, selectedEmpresa]);

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
      {/* ==========================================
          HEADER SECTION (Title & Stats Banner)
          ========================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0 bg-white border border-natural-border p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <FileText size={20} />
            </div>
            <h1 className="text-xl font-serif italic font-bold tracking-tight text-natural-text">
              Gestão de Notas Fiscais
            </h1>
          </div>
          <p className="text-xs text-natural-muted leading-relaxed">
            Registre notas fiscais de hardware, recalcule itens, faça upload de boletos de cobrança e controle compras por empresa.
          </p>
        </div>

        <button
          id="btn-register-nf"
          onClick={() => handleOpenForm(null)}
          className="bg-natural-primary hover:bg-natural-primary/95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-natural-primary/10 hover:shadow-lg hover:shadow-natural-primary/15 transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus size={16} />
          Cadastrar Nota Fiscal
        </button>
      </div>

      {/* ==========================================
          STATS CARDS GRID
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-natural-border p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-wider text-natural-muted uppercase">
              Total Acumulado
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
              Notas Registradas
            </span>
            <div className="text-xl font-serif italic font-bold text-natural-text font-mono">
              {stats.count}
            </div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
            <FileSpreadsheet size={20} />
          </div>
        </div>

        <div className="bg-white border border-natural-border p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-wider text-natural-muted uppercase">
              Qtd Itens Adquiridos
            </span>
            <div className="text-xl font-serif italic font-bold text-natural-text font-mono">
              {stats.itemsCount}
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
            <ShoppingCart size={20} />
          </div>
        </div>
      </div>

      {/* ==========================================
          FILTERS & SEARCH BAR
          ========================================== */}
      <div className="bg-white border border-natural-border rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          
          {/* Search box */}
          <div className="md:col-span-8 relative">
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
          <div className="md:col-span-4">
            <select
              id="filter-nf-empresa"
              value={selectedEmpresa}
              onChange={(e) => setSelectedEmpresa(e.target.value)}
              className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
            >
              <option value="All">Todas Empresas (Filtro)</option>
              <option value="Bio Brands">Bio Brands</option>
              <option value="Bio Scientific">Bio Scientific</option>
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
                <th className="px-4 py-3.5">Número</th>
                <th className="px-4 py-3.5">Empresa</th>
                <th className="px-4 py-3.5">Emissor / Fornecedor</th>
                <th className="px-4 py-3.5">
                  <div className="flex items-center space-x-1" title="Ordenado da nota mais recente para a mais antiga">
                    <span>Data Emissão</span>
                    <ArrowDown size={12} className="text-indigo-600" />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-center">Itens</th>
                <th className="px-4 py-3.5">Anexos</th>
                <th className="px-4 py-3.5 text-right">Valor Total</th>
                <th className="px-4 py-3.5 text-center w-36">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              <AnimatePresence mode="popLayout">
                {filteredNotas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-natural-muted">
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
                      {/* Número */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono bg-slate-100 border border-slate-200 font-bold px-2 py-0.5 rounded text-slate-700 text-[11px]">
                          Nº {cleanNumeroNF(nf.numero)}
                        </span>
                      </td>

                      {/* Empresa */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
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

                      {/* Emissor */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-natural-text block truncate max-w-[200px]" title={nf.emissor}>
                          {nf.emissor}
                        </span>
                      </td>

                      {/* Data Emissão */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-natural-muted">
                        {formatDateBR(nf.dataEmissao)}
                      </td>

                      {/* Qtd Itens */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap font-mono">
                        <span className="bg-slate-100 text-natural-text font-bold px-2 py-0.5 rounded-full text-[11px]">
                          {nf.itens.length} {nf.itens.length === 1 ? 'item' : 'itens'}
                        </span>
                      </td>

                      {/* Anexos */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {nf.notaFiscalFile && (
                            <span className="text-[10px] bg-slate-50 border border-slate-200 text-natural-text px-2 py-0.5 rounded flex items-center font-mono" title={nf.notaFiscalFile.name}>
                              <FileText size={11} className="mr-1 text-indigo-500" />
                              NF
                            </span>
                          )}
                          {nf.outrosArquivos && nf.outrosArquivos.length > 0 && (
                            <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center font-mono">
                              <File size={11} className="mr-1 text-amber-500" />
                              +{nf.outrosArquivos.length}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Valor Total */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap font-mono font-bold text-natural-text">
                        {formatCurrency(nf.valorTotalNota)}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            id={`btn-view-details-${nf.id}`}
                            onClick={() => setSelectedNotaForDetails(nf)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="Visualizar detalhes da Nota"
                          >
                            <Eye size={13} />
                            <span>Visualizar</span>
                          </button>
                          <button
                            id={`btn-edit-nf-${nf.id}`}
                            onClick={() => handleOpenForm(nf)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Editar Nota Fiscal"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            id={`btn-delete-nf-${nf.id}`}
                            onClick={() => setNfIdToDelete(nf.id)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Nota Fiscal"
                          >
                            <Trash2 size={13} />
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                    <span className="text-natural-muted block uppercase text-[9px] tracking-wider font-bold">Data Emissão</span>
                    <span className="text-natural-text font-bold block">{formatDateBR(selectedNotaForDetails.dataEmissao)}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                    <span className="text-natural-muted block uppercase text-[9px] tracking-wider font-bold">Data Cadastro Sistema</span>
                    <span className="text-natural-text font-bold block">{new Date(selectedNotaForDetails.dataCadastro).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                    <span className="text-natural-muted block uppercase text-[9px] tracking-wider font-bold text-indigo-600">Valor Total Geral</span>
                    <span className="text-natural-text font-bold block text-sm text-indigo-600">{formatCurrency(selectedNotaForDetails.valorTotalNota)}</span>
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
                          <th className="px-4 py-2.5 w-16 text-center">Qtd</th>
                          <th className="px-4 py-2.5">Descrição do Item</th>
                          <th className="px-4 py-2.5 text-right">V. Unitário</th>
                          <th className="px-4 py-2.5 text-right w-32">V. Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedNotaForDetails.itens.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-center font-semibold text-natural-text font-mono">{item.quantidade}</td>
                            <td className="px-4 py-3 text-natural-text font-medium">{item.descricao}</td>
                            <td className="px-4 py-3 text-right text-natural-text font-mono">{formatCurrency(item.valorUnitario)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-natural-text font-mono">{formatCurrency(item.valorTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-natural-border font-mono font-semibold">
                        <tr>
                          <td colSpan={3} className="px-4 py-2.5 text-right text-natural-muted">Total Soma de Itens:</td>
                          <td className="px-4 py-2.5 text-right text-natural-text font-mono">{formatCurrency(selectedNotaForDetails.valorTotalNota)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Document downloads row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Invoice Document */}
                  <div className="border border-natural-border p-4 rounded-xl space-y-3 bg-slate-50/40">
                    <div className="flex items-center space-x-2">
                      <FileText size={18} className="text-indigo-500" />
                      <span className="text-xs font-semibold text-natural-text">Documento Fiscal Principal (XML/PDF)</span>
                    </div>
                    
                    {selectedNotaForDetails.notaFiscalFile ? (
                      <div className="flex items-center justify-between p-2.5 bg-white border border-natural-border rounded-lg text-xs font-mono">
                        <div className="truncate pr-2">
                          <span className="font-semibold block truncate text-natural-text">{selectedNotaForDetails.notaFiscalFile.name}</span>
                          <span className="text-[10px] text-natural-muted block">{(selectedNotaForDetails.notaFiscalFile.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button
                          id={`btn-dl-primary-${selectedNotaForDetails.id}`}
                          onClick={() => handleSimulateDownload(selectedNotaForDetails.notaFiscalFile!)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Download Arquivo"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs italic text-natural-muted pl-1">Sem arquivo fiscal cadastrado.</p>
                    )}
                  </div>

                  {/* Other Documents & Boletos */}
                  <div className="border border-natural-border p-4 rounded-xl space-y-3 bg-slate-50/40">
                    <div className="flex items-center space-x-2">
                      <File size={18} className="text-amber-500" />
                      <span className="text-xs font-semibold text-natural-text">Boletos e Outros Anexos</span>
                    </div>

                    {!selectedNotaForDetails.outrosArquivos || selectedNotaForDetails.outrosArquivos.length === 0 ? (
                      <p className="text-xs italic text-natural-muted pl-1 py-1">Nenhum boleto ou anexo adicional anexado.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {selectedNotaForDetails.outrosArquivos.map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white border border-natural-border rounded-lg text-xs font-mono">
                            <div className="truncate pr-2">
                              <span className="font-medium block truncate text-natural-text">{file.name}</span>
                              <span className="text-[9px] text-natural-muted block">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button
                              id={`btn-dl-other-${selectedNotaForDetails.id}-${i}`}
                              onClick={() => handleSimulateDownload(file)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Download Arquivo"
                            >
                              <Download size={12} />
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
              <div className="bg-slate-50 px-6 py-3.5 border-t border-natural-border flex items-center justify-end shrink-0">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              </div>

              {/* 2. Empresa Vinculada Selection */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="block text-xs font-bold text-natural-text">
                  Empresa Pagadora / Vinculada *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="btn-empresa-brands"
                    type="button"
                    onClick={() => setEmpresa('Bio Brands')}
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
                    onClick={() => setEmpresa('Bio Scientific')}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    
                    {/* Item Description */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="block text-[10px] font-bold text-natural-text">Descrição do Item</label>
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
                    <div className="md:col-span-2 space-y-1">
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
                    <div className="md:col-span-3 space-y-1">
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
                    <div className="md:col-span-1">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                
                {/* File Upload A: Nota Fiscal Principal */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                    <span>Nota Fiscal Principal (PDF/XML) *</span>
                    <span className="text-[9px] text-red-500 bg-red-50 border border-red-100 font-bold px-1.5 py-0.5 rounded uppercase">Obrigatório</span>
                  </label>

                  <div 
                    id="drag-primary-container"
                    onDragEnter={handleDragPrimary}
                    onDragOver={handleDragPrimary}
                    onDragLeave={handleDragPrimary}
                    onDrop={handleDropPrimary}
                    onClick={() => primaryFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                      dragActivePrimary 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : notaFiscalFile 
                          ? 'border-emerald-300 bg-emerald-50/10' 
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
                      <div className="space-y-1.5 w-full text-xs font-mono" onClick={(e) => e.stopPropagation()}>
                        <div className="p-1.5 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg inline-flex items-center gap-1">
                          <CheckCircle size={12} />
                          <span>Pronto para Enviar</span>
                        </div>
                        <p className="font-semibold truncate text-natural-text px-2">{notaFiscalFile.name}</p>
                        <p className="text-[10px] text-natural-muted">{(notaFiscalFile.size / 1024).toFixed(1)} KB</p>
                        <button
                          id="btn-remove-primary-file"
                          type="button"
                          onClick={handleRemovePrimaryFile}
                          className="text-[10px] text-red-500 hover:text-red-700 underline font-bold pt-1 cursor-pointer"
                        >
                          Remover Arquivo
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-slate-400 mb-1.5" />
                        <span className="text-xs font-semibold text-indigo-600">Arraste ou clique para enviar a Nota</span>
                        <span className="text-[10px] text-natural-muted mt-0.5">Suporta PDF, XML ou Imagens</span>
                      </>
                    )}
                  </div>
                </div>

                {/* File Upload B: Other Attachments (Boletos) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                    <span>Boletos e Outros Arquivos (Opcional)</span>
                    <span className="text-[9px] text-slate-500 bg-slate-100 border border-slate-200 font-bold px-1.5 py-0.5 rounded uppercase">Anexos</span>
                  </label>

                  <div 
                    id="drag-others-container"
                    onDragEnter={handleDragOthers}
                    onDragOver={handleDragOthers}
                    onDragLeave={handleDragOthers}
                    onDrop={handleDropOthers}
                    onClick={() => othersFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                      dragActiveOthers 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : outrosArquivos.length > 0
                          ? 'border-indigo-300 bg-indigo-50/10' 
                          : 'border-natural-border bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <input
                      id="input-file-others"
                      ref={othersFileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.png"
                      onChange={handleSelectOthers}
                      className="hidden"
                    />

                    <Upload size={24} className="text-slate-400 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">Adicione boletos de pagamento</span>
                    <span className="text-[10px] text-natural-muted mt-0.5">Clique ou arraste múltiplos arquivos</span>

                    {outrosArquivos.length > 0 && (
                      <div className="mt-2.5 w-full text-[10px] font-mono space-y-1" onClick={(e) => e.stopPropagation()}>
                        <div className="border-t border-slate-200/60 pt-2 text-left">
                          <p className="font-bold text-natural-text mb-1">Arquivos adicionados ({outrosArquivos.length}):</p>
                          <div className="max-h-20 overflow-y-auto space-y-1">
                            {outrosArquivos.map((file, i) => (
                              <div key={i} className="flex items-center justify-between bg-white border border-slate-100 p-1 rounded">
                                <span className="truncate max-w-[140px] text-natural-text">{file.name}</span>
                                <button 
                                  id={`btn-remove-other-${i}`}
                                  type="button" 
                                  onClick={() => handleRemoveOtherFile(i)}
                                  className="text-red-500 hover:text-red-700 px-1 font-bold"
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
