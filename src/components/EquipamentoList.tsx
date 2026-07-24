import React, { useState, useMemo } from 'react';
import { 
  Cpu, 
  Laptop, 
  Smartphone, 
  Server, 
  Wifi, 
  Router, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  X, 
  Check, 
  AlertTriangle, 
  UserCheck, 
  UserMinus, 
  Layers, 
  Tag, 
  Calendar,
  HelpCircle,
  FileText,
  Bookmark,
  CheckCircle,
  Hash,
  Activity,
  History,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Equipamento, Colaborador, UserSettings } from '../types';
import { EQUIPAMENTO_TIPOS, EQUIPAMENTO_STATUSES, formatLocalDate } from '../data';

interface EquipamentoListProps {
  equipamentos: Equipamento[];
  colaboradores: Colaborador[];
  onSave: (equipamento: Equipamento) => void;
  onDelete: (id: string) => void;
  userSettings: UserSettings;
}

export default function EquipamentoList({
  equipamentos,
  colaboradores,
  onSave,
  onDelete,
  userSettings
}: EquipamentoListProps) {
  // Navigation & UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('All');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('All');
  
  // Modal for editing/registering
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipamento, setEditingEquipamento] = useState<Equipamento | null>(null);

  // Form local state
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<Equipamento['tipo']>('Laptop');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [patrimonio, setPatrimonio] = useState('');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [status, setStatus] = useState<Equipamento['status']>('Ativo');
  const [colaboradorId, setColaboradorId] = useState<string>('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [empresa, setEmpresa] = useState<Equipamento['empresa']>('Bio Brands');
  const [formError, setFormError] = useState('');

  // Delete confirmation state
  const [eqIdToDelete, setEqIdToDelete] = useState<string | null>(null);

  // History modal state
  const [selectedEqForHistory, setSelectedEqForHistory] = useState<Equipamento | null>(null);

  // Date/Time formatter helper
  const formatFullDateTime = (isoString: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch (e) {
      return isoString;
    }
  };

  // Load form when editing starts
  const handleOpenForm = (eq: Equipamento | null) => {
    if (eq) {
      setEditingEquipamento(eq);
      setNome(eq.nome || '');
      setTipo(eq.tipo || 'Laptop');
      setNumeroSerie(eq.numeroSerie || '');
      setPatrimonio(eq.patrimonio || '');
      setMarcaModelo(eq.marcaModelo || '');
      setStatus(eq.status || 'Ativo');
      setColaboradorId(eq.colaboradorId || '');
      setDataAquisicao(eq.dataAquisicao || '');
      setObservacoes(eq.observacoes || '');
      setEmpresa(eq.empresa || 'Bio Brands');
    } else {
      setEditingEquipamento(null);
      setNome('');
      setTipo('Laptop');
      setNumeroSerie('');
      setPatrimonio('');
      setMarcaModelo('');
      setStatus('Ativo');
      setColaboradorId('');
      setDataAquisicao(new Date().toISOString().split('T')[0]);
      setObservacoes('');
      setEmpresa('Bio Brands');
    }
    setFormError('');
    setIsFormOpen(true);
  };

  // Quick helper to get device icons
  const getDeviceIcon = (deviceType: Equipamento['tipo']) => {
    switch (deviceType) {
      case 'Desktop': return <Cpu size={18} />;
      case 'Laptop': return <Laptop size={18} />;
      case 'Smartphone': return <Smartphone size={18} />;
      case 'Servidor': return <Server size={18} />;
      case 'Roteador': return <Router size={18} />;
      case 'Wifi': return <Wifi size={18} />;
      default: return <Cpu size={18} />;
    }
  };

  // Quick helper for status color badges
  const getStatusBadgeClass = (s: Equipamento['status']) => {
    switch (s) {
      case 'Ativo':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Inativo':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Em Manutenção':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Baixado':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Submit Form Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nome.trim() || !numeroSerie.trim() || !patrimonio.trim() || !marcaModelo.trim() || !dataAquisicao) {
      setFormError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    // Check patrimonio uniqueness (ignoring the current device if editing)
    const duplicatePatrimonio = equipamentos.some(
      eq => eq.patrimonio.trim().toLowerCase() === patrimonio.trim().toLowerCase() && 
      (!editingEquipamento || eq.id !== editingEquipamento.id)
    );

    if (duplicatePatrimonio) {
      setFormError(`O código de patrimônio "${patrimonio}" já está cadastrado em outro equipamento.`);
      return;
    }

    const payload: Equipamento = {
      id: editingEquipamento ? editingEquipamento.id : `eq-${Date.now()}`,
      nome: nome.trim(),
      tipo,
      numeroSerie: numeroSerie.trim().toUpperCase(),
      patrimonio: patrimonio.trim().toUpperCase(),
      marcaModelo: marcaModelo.trim(),
      status,
      colaboradorId: colaboradorId ? colaboradorId : null,
      dataAquisicao,
      observacoes: observacoes.trim(),
      empresa
    };

    onSave(payload);
    setIsFormOpen(false);
  };

  // Quick action: Unlink collaborator from card
  const handleQuickUnlink = (eq: Equipamento) => {
    const updated: Equipamento = {
      ...eq,
      colaboradorId: null
    };
    onSave(updated);
  };

  // Map of collaborators for quick lookup
  const colabMap = useMemo(() => {
    const m = new Map<string, Colaborador>();
    colaboradores.forEach(c => m.set(c.id, c));
    return m;
  }, [colaboradores]);

  // Statistics Computations
  const stats = useMemo(() => {
    const total = equipamentos.length;
    const ativos = equipamentos.filter(e => e.status === 'Ativo').length;
    const vinculados = equipamentos.filter(e => e.colaboradorId).length;
    const infra = equipamentos.filter(e => ['Servidor', 'Roteador', 'Wifi'].includes(e.tipo)).length;
    const manutencao = equipamentos.filter(e => e.status === 'Em Manutenção').length;

    return { total, ativos, vinculados, infra, manutencao };
  }, [equipamentos]);

  // Active / Filtered list
  const filteredEquipamentos = useMemo(() => {
    return equipamentos.filter(eq => {
      // 1. Search Query
      const matchesSearch = 
        eq.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.numeroSerie.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.patrimonio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.marcaModelo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (eq.colaboradorId && colabMap.get(eq.colaboradorId)?.nomeCompleto.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Type Filter
      const matchesType = selectedType === 'All' || eq.tipo === selectedType;

      // 3. Status Filter
      const matchesStatus = selectedStatus === 'All' || eq.status === selectedStatus;

      // 4. Assignment Filter
      let matchesAssignment = true;
      if (selectedAssignment === 'Vinculados') {
        matchesAssignment = !!eq.colaboradorId;
      } else if (selectedAssignment === 'Disponiveis') {
        matchesAssignment = !eq.colaboradorId;
      }

      // 5. Empresa Filter
      const matchesEmpresa = selectedEmpresa === 'All' || eq.empresa === selectedEmpresa;

      return matchesSearch && matchesType && matchesStatus && matchesAssignment && matchesEmpresa;
    });
  }, [equipamentos, searchQuery, selectedType, selectedStatus, selectedAssignment, selectedEmpresa, colabMap]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-natural-primary uppercase block">
            Inventário Corporativo de TI
          </span>
          <h1 className="text-3xl font-serif italic font-bold text-natural-text mt-1">
            Gestão de Equipamentos
          </h1>
          <p className="text-xs text-natural-muted mt-1 leading-relaxed max-w-2xl">
            Visualize, filtre e cadastre ativos de tecnologia como laptops, desktops, celulares, servidores e roteadores. Vincule-os aos colaboradores responsáveis com controle de auditoria de patrimônio.
          </p>
        </div>

        <button
          id="btn-add-equipamento"
          onClick={() => handleOpenForm(null)}
          className="bg-natural-primary hover:bg-natural-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-natural-primary/15 flex items-center justify-center space-x-2 shrink-0 cursor-pointer border border-natural-primary self-start md:self-center"
        >
          <Plus size={15} />
          <span>Cadastrar Equipamento</span>
        </button>
      </div>

      {/* Stats Cards Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Devices */}
        <div className="bg-white p-4 rounded-2xl border border-natural-border shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <Cpu size={20} />
          </div>
          <div>
            <span className="text-[10px] text-natural-muted font-bold uppercase tracking-wider block">
              Total de Ativos
            </span>
            <span className="text-xl font-bold text-natural-text block leading-tight mt-0.5">
              {stats.total}
            </span>
          </div>
        </div>

        {/* Active Devices */}
        <div className="bg-white p-4 rounded-2xl border border-natural-border shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-natural-muted font-bold uppercase tracking-wider block">
              Equipamentos Ativos
            </span>
            <span className="text-xl font-bold text-natural-text block leading-tight mt-0.5">
              {stats.ativos}
            </span>
          </div>
        </div>

        {/* Assigned Devices */}
        <div className="bg-white p-4 rounded-2xl border border-natural-border shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] text-natural-muted font-bold uppercase tracking-wider block">
              Vinculados a Pessoas
            </span>
            <span className="text-xl font-bold text-natural-text block leading-tight mt-0.5">
              {stats.vinculados}
            </span>
          </div>
        </div>

        {/* Infrastructure Devices */}
        <div className="bg-white p-4 rounded-2xl border border-natural-border shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Server size={20} />
          </div>
          <div>
            <span className="text-[10px] text-natural-muted font-bold uppercase tracking-wider block">
              Servidores & Rede
            </span>
            <span className="text-xl font-bold text-natural-text block leading-tight mt-0.5">
              {stats.infra}
            </span>
          </div>
        </div>

        {/* Maintenance Devices */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-natural-border shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[10px] text-natural-muted font-bold uppercase tracking-wider block">
              Em Manutenção
            </span>
            <span className="text-xl font-bold text-natural-text block leading-tight mt-0.5">
              {stats.manutencao}
            </span>
          </div>
        </div>

      </div>

      {/* Search, Filter and Actions Toolbar */}
      <div className="bg-white rounded-2xl border border-natural-border p-5 space-y-4 shadow-xs">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          
          {/* Search box (4 columns) */}
          <div className="md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-natural-muted">
              <Search size={16} />
            </div>
            <input
              id="search-equipamentos"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, série, patrimônio..."
              className="w-full bg-slate-50 border border-natural-border rounded-xl pl-10 pr-4 py-2 text-xs text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                id="clear-search-eq"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-natural-muted hover:text-natural-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Empresa Filter (2 columns) */}
          <div className="md:col-span-2">
            <select
              id="filter-eq-empresa"
              value={selectedEmpresa}
              onChange={(e) => setSelectedEmpresa(e.target.value)}
              className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
            >
              <option value="All">Todas Empresas</option>
              <option value="Bio Brands">Bio Brands</option>
              <option value="Bio Scientific">Bio Scientific</option>
            </select>
          </div>

          {/* Type Filter (2 columns) */}
          <div className="md:col-span-2">
            <select
              id="filter-eq-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
            >
              <option value="All font-sans">Todos os Tipos</option>
              {EQUIPAMENTO_TIPOS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Status Filter (2 columns) */}
          <div className="md:col-span-2">
            <select
              id="filter-eq-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
            >
              <option value="All">Todos Status</option>
              {EQUIPAMENTO_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Assignment Filter (2 columns) */}
          <div className="md:col-span-2">
            <select
              id="filter-eq-assignment"
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
            >
              <option value="All">Todos Vínculos</option>
              <option value="Vinculados">Vinculados</option>
              <option value="Disponiveis">Disponíveis</option>
            </select>
          </div>

        </div>

      </div>

      {/* Grid List of Equipments */}
      {filteredEquipamentos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-natural-border p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
          <div className="p-4 bg-slate-50 text-natural-muted rounded-full inline-flex border border-natural-border">
            <Cpu size={36} />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif italic text-lg font-semibold text-natural-text">
              Nenhum equipamento encontrado
            </h3>
            <p className="text-xs text-natural-muted leading-relaxed">
              Tente reajustar seus filtros de busca, tipo de hardware ou status corporativo de ativo para obter novos resultados.
            </p>
          </div>
          <button
            id="btn-reset-filters-eq"
            onClick={() => {
              setSearchQuery('');
              setSelectedType('All');
              setSelectedStatus('All');
              setSelectedAssignment('All');
              setSelectedEmpresa('All');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-natural-text rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredEquipamentos.map((eq) => {
              const matchedColab = eq.colaboradorId ? colabMap.get(eq.colaboradorId) : null;
              
              return (
                <motion.div
                  key={eq.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl border border-natural-border hover:border-natural-primary/30 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  
                  {/* Top Bar of Card */}
                  <div className="p-5 border-b border-slate-50 flex-1 space-y-4">
                    
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                          {getDeviceIcon(eq.tipo)}
                        </div>
                        <div>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] bg-slate-100 border border-slate-200 font-mono text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">
                              {eq.tipo}
                            </span>
                            <span className="text-[9px] bg-indigo-50 border border-indigo-100 font-mono text-indigo-600 font-bold px-1.5 py-0.5 rounded uppercase">
                              {eq.empresa}
                            </span>
                          </div>
                          <h3 className="font-serif italic text-sm font-bold text-natural-text block truncate mt-1">
                            {eq.nome}
                          </h3>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`text-[9px] border font-bold px-1.5 py-0.5 rounded-full ${getStatusBadgeClass(eq.status)}`}>
                        {eq.status}
                      </span>
                    </div>

                    {/* Metadata Specs Grid */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-[11px] font-mono">
                      
                      <div className="flex justify-between items-center text-natural-muted">
                        <span className="flex items-center"><Tag size={12} className="mr-1" /> Patrimônio:</span>
                        <span className="text-natural-text font-bold uppercase">{eq.patrimonio}</span>
                      </div>

                      <div className="flex justify-between items-center text-natural-muted">
                        <span className="flex items-center"><Layers size={12} className="mr-1" /> Empresa:</span>
                        <span className="text-natural-text font-semibold">{eq.empresa}</span>
                      </div>

                      <div className="flex justify-between items-center text-natural-muted">
                        <span className="flex items-center"><Hash size={12} className="mr-1" /> N/Série:</span>
                        <span className="text-natural-text font-semibold uppercase truncate max-w-[140px]">{eq.numeroSerie}</span>
                      </div>

                      <div className="flex justify-between items-center text-natural-muted">
                        <span className="flex items-center"><Bookmark size={12} className="mr-1" /> Modelo:</span>
                        <span className="text-natural-text truncate max-w-[140px]" title={eq.marcaModelo}>{eq.marcaModelo}</span>
                      </div>

                      <div className="flex justify-between items-center text-natural-muted border-t border-slate-200/50 pt-1.5 mt-1.5">
                        <span className="flex items-center"><Calendar size={12} className="mr-1" /> Aquisição:</span>
                        <span className="text-natural-text">{formatLocalDate(eq.dataAquisicao)}</span>
                      </div>

                    </div>

                    {/* Collaborator Assignment section */}
                    <div className="pt-2 border-t border-dashed border-slate-100">
                      <span className="text-[9px] font-bold text-natural-muted uppercase tracking-wider block mb-2">
                        Responsável Atribuído:
                      </span>

                      {matchedColab ? (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50/40 border border-sky-100/50">
                          <div className="flex items-center space-x-2">
                            <div className={`w-7 h-7 rounded-lg ${matchedColab.avatarColor || 'bg-slate-300'} flex items-center justify-center font-bold text-xs font-serif`}>
                              {matchedColab.exibicao.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-natural-text block truncate leading-tight">
                                {matchedColab.exibicao}
                              </span>
                              <span className="text-[10px] text-natural-muted block truncate mt-0.5 leading-none">
                                {matchedColab.email}
                              </span>
                            </div>
                          </div>
                          
                          {/* Quick unlink */}
                          <button
                            id={`unlink-btn-${eq.id}`}
                            onClick={() => handleQuickUnlink(eq)}
                            title="Desvincular colaborador"
                            className="p-1 text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <UserMinus size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                          <span className="text-[10px] text-natural-muted italic flex items-center justify-center">
                            <HelpCircle size={12} className="mr-1.5 text-slate-400" />
                            Equipamento Disponível no Estoque
                          </span>
                        </div>
                      )}
                    </div>

                    {eq.observacoes && (
                      <p className="text-[10px] text-slate-400 italic line-clamp-2 leading-relaxed pt-1">
                        &ldquo;{eq.observacoes}&rdquo;
                      </p>
                    )}

                  </div>

                  {/* Actions Bar (Footer of Card) */}
                  <div className="bg-slate-50 px-5 py-3 border-t border-natural-border flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-natural-muted font-mono">
                      ID: {eq.id}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        id={`btn-history-eq-${eq.id}`}
                        onClick={() => setSelectedEqForHistory(eq)}
                        className="p-1.5 bg-white text-slate-600 hover:text-indigo-600 border border-natural-border hover:border-indigo-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        title="Ver histórico de movimentações"
                      >
                        <History size={13} />
                        <span className="text-[10px] font-semibold">Histórico</span>
                      </button>
                      <button
                        id={`btn-edit-eq-${eq.id}`}
                        onClick={() => handleOpenForm(eq)}
                        className="p-1.5 bg-white text-natural-text hover:text-natural-primary border border-natural-border hover:border-natural-primary/20 rounded-lg transition-colors cursor-pointer"
                        title="Editar especificações"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        id={`btn-delete-eq-${eq.id}`}
                        onClick={() => setEqIdToDelete(eq.id)}
                        className="p-1.5 bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-lg transition-colors cursor-pointer"
                        title="Excluir equipamento"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ==========================================
          EQUIPMENT REGISTER & EDIT DRAWER (MODAL)
          ========================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-end p-0 md:p-4">
          
          {/* Form Backdrop click */}
          <div className="absolute inset-0" onClick={() => setIsFormOpen(false)} />

          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.2 }}
            className="bg-white w-full max-w-xl h-full md:h-auto md:max-h-[90vh] md:rounded-2xl border border-natural-border shadow-2xl overflow-hidden flex flex-col relative z-10"
          >
            {/* Header */}
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-natural-accent rounded-lg text-natural-primary">
                  <Cpu size={16} />
                </div>
                <div>
                  <h3 className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                    Formulário de Hardware
                  </h3>
                  <span className="text-sm font-serif italic text-white font-semibold">
                    {editingEquipamento ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
                  </span>
                </div>
              </div>
              <button
                id="btn-close-form"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields Area */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-xs font-semibold">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Basic Fields: Nome & Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Nome do Ativo *
                  </label>
                  <input
                    id="eq-form-nome"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Notebook Lenovo ThinkPad"
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Tipo de Equipamento *
                  </label>
                  <select
                    id="eq-form-tipo"
                    required
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as Equipamento['tipo'])}
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
                  >
                    {EQUIPAMENTO_TIPOS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* 2. Serial Number & Patrimonio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Código de Patrimônio (Tag) *
                  </label>
                  <input
                    id="eq-form-patrimonio"
                    type="text"
                    required
                    value={patrimonio}
                    onChange={(e) => setPatrimonio(e.target.value)}
                    placeholder="PAT-2026-XXXX"
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Número de Série *
                  </label>
                  <input
                    id="eq-form-ns"
                    type="text"
                    required
                    value={numeroSerie}
                    onChange={(e) => setNumeroSerie(e.target.value)}
                    placeholder="LEN-7392AJ92"
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all font-mono uppercase"
                  />
                </div>

              </div>

              {/* 3. Brand/Model & Purchase Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Marca e Modelo Detalhado *
                  </label>
                  <input
                    id="eq-form-marca"
                    type="text"
                    required
                    value={marcaModelo}
                    onChange={(e) => setMarcaModelo(e.target.value)}
                    placeholder="Lenovo L14 Gen 3 AMD R5 16GB"
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Data de Aquisição *
                  </label>
                  <input
                    id="eq-form-data"
                    type="date"
                    required
                    value={dataAquisicao}
                    onChange={(e) => setDataAquisicao(e.target.value)}
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all font-mono"
                  />
                </div>

              </div>

              {/* 4. Empresa, Status & Assign Collaborator */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 border-t border-slate-100">
                
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Empresa Vinculada *
                  </label>
                  <select
                    id="eq-form-empresa"
                    required
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value as 'Bio Brands' | 'Bio Scientific')}
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
                  >
                    <option value="Bio Brands">Bio Brands</option>
                    <option value="Bio Scientific">Bio Scientific</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text">
                    Status Operacional *
                  </label>
                  <select
                    id="eq-form-status"
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Equipamento['status'])}
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
                  >
                    {EQUIPAMENTO_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-natural-text flex items-center justify-between">
                    <span>Vincular Colaborador</span>
                  </label>
                  <select
                    id="eq-form-colab"
                    value={colaboradorId}
                    onChange={(e) => setColaboradorId(e.target.value)}
                    className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    <option value="">-- Nenhum (Estoque) --</option>
                    {colaboradores
                      .filter(c => c.status === 'Ativo')
                      .map(colab => (
                        <option key={colab.id} value={colab.id}>
                          {colab.nomeCompleto} ({colab.setor})
                        </option>
                      ))}
                  </select>
                </div>

              </div>

              {/* 5. Remarks Observations */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-natural-text">
                  Observações e Termo de Responsabilidade
                </label>
                <textarea
                  id="eq-form-obs"
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Entregue lacrado, licença do Office inclusa, carregador rápido..."
                  className="w-full bg-slate-50 border border-natural-border rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  id="btn-cancel-form-eq"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-white border border-natural-border rounded-xl text-xs font-semibold text-natural-text hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-form-eq"
                  type="submit"
                  className="px-4 py-2 bg-natural-primary hover:bg-natural-hover text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer border border-natural-primary shadow-xs"
                >
                  <Check size={14} />
                  <span>{editingEquipamento ? 'Salvar Alterações' : 'Confirmar Cadastro'}</span>
                </button>
              </div>

            </form>

          </motion.div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRMATION MODAL
          ========================================== */}
      {eqIdToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setEqIdToDelete(null)} />
          
          <div className="bg-white rounded-2xl border border-natural-border shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150 relative z-10">
            <div className="p-6 text-center space-y-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-full inline-flex border border-rose-100">
                <Trash2 size={28} />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-serif italic text-base font-bold text-natural-text">
                  Excluir Equipamento?
                </h3>
                <p className="text-xs text-natural-muted leading-relaxed">
                  Tem certeza de que deseja remover permanentemente este ativo de hardware do inventário? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end space-x-2 border-t border-slate-100">
              <button
                id="btn-cancel-delete-eq"
                onClick={() => setEqIdToDelete(null)}
                className="px-3.5 py-1.5 bg-white border border-natural-border rounded-lg text-xs font-semibold text-natural-text hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-eq"
                onClick={() => {
                  onDelete(eqIdToDelete);
                  setEqIdToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          EQUIPMENT HISTORY MODAL
          ========================================== */}
      {selectedEqForHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setSelectedEqForHistory(null)} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-natural-border shadow-2xl max-w-lg w-full overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <History size={16} />
                </div>
                <div>
                  <h3 className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase leading-none mb-1">
                    Histórico do Equipamento
                  </h3>
                  <span className="text-sm font-serif italic text-white font-semibold">
                    {selectedEqForHistory.nome}
                  </span>
                </div>
              </div>
              <button
                id="btn-close-history"
                onClick={() => setSelectedEqForHistory(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Specs bar */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-2.5 flex justify-between text-xs font-mono shrink-0">
              <span className="text-natural-muted">Patrimônio: <strong className="text-natural-text uppercase">{selectedEqForHistory.patrimonio}</strong></span>
              <span className="text-natural-muted">Série: <strong className="text-natural-text uppercase">{selectedEqForHistory.numeroSerie}</strong></span>
            </div>

            {/* Timeline content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!selectedEqForHistory.historico || selectedEqForHistory.historico.length === 0 ? (
                <div className="text-center py-12 text-natural-muted">
                  <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs italic">Nenhum registro de movimentação encontrado.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6">
                  {selectedEqForHistory.historico.slice().reverse().map((h, index) => {
                    // Check action type for dynamic colors
                    const isStatusAction = h.acao.includes('Status') || h.acao.includes('manutenção') || h.acao.includes('Manutenção');
                    const isVinculoAction = h.acao.includes('Vínculo') || h.acao.includes('Responsável') || h.acao.includes('Atribuição');
                    const isCadastroAction = h.acao.includes('Cadastro') || h.acao.includes('Ativo');
                    
                    let bulletBg = 'bg-slate-300';
                    let bulletBorder = 'border-slate-100';
                    let actionBadge = 'bg-slate-100 text-slate-700 border-slate-200';

                    if (isStatusAction) {
                      bulletBg = 'bg-amber-400';
                      bulletBorder = 'border-amber-100';
                      actionBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                    } else if (isVinculoAction) {
                      bulletBg = 'bg-indigo-500';
                      bulletBorder = 'border-indigo-100';
                      actionBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                    } else if (isCadastroAction) {
                      bulletBg = 'bg-emerald-500';
                      bulletBorder = 'border-emerald-100';
                      actionBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    }

                    return (
                      <div key={h.id || index} className="relative group">
                        
                        {/* Timeline Bullet */}
                        <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${bulletBg} ${bulletBorder} ring-4 ring-white z-10 transition-transform duration-300 group-hover:scale-110`} />

                        {/* Event Card */}
                        <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl p-3.5 space-y-2 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${actionBadge}`}>
                              {h.acao}
                            </span>
                            
                            <div className="flex items-center text-[10px] text-natural-muted font-mono">
                              <Clock size={11} className="mr-1" />
                              {formatFullDateTime(h.data)}
                            </div>
                          </div>

                          <p className="text-xs text-natural-text font-normal leading-relaxed">
                            {h.descricao}
                          </p>

                          <div className="pt-1.5 border-t border-dashed border-slate-200/60 flex items-center justify-between text-[10px] text-natural-muted font-mono">
                            <span>Operador:</span>
                            <span className="font-semibold text-natural-text">{h.usuario}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                id="btn-close-history-footer"
                onClick={() => setSelectedEqForHistory(null)}
                className="px-4 py-2 bg-white border border-natural-border rounded-xl text-xs font-semibold text-natural-text hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Fechar Histórico
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
