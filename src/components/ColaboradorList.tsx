import React, { useState, useMemo } from 'react';
import { 
  FileDown, 
  Edit, 
  Trash2, 
  Eye, 
  Layers, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  User,
  UserPlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Users,
  Building,
  Building2,
  MapPin,
  Activity,
  ChevronDown,
  RotateCcw,
  Search,
  X,
  Database
} from 'lucide-react';
import { Colaborador } from '../types';
import { SETORES, formatLocalDate, formatTelefone, normalizeEmpresa, normalizeFilial } from '../data';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportPdfModal } from './ExportPdfModal';
import MySQLColaboradoresSyncModal from './MySQLColaboradoresSyncModal';

interface ColaboradorListProps {
  colaboradores: Colaborador[];
  searchQuery: string;
  onEdit: (colaborador: Colaborador) => void;
  onDelete: (id: string) => void;
  userSettings: { empresa: string };
  onAddNew: () => void;
  onUpdateColaboradores?: (colaboradores: Colaborador[]) => void;
  selectedEmpresa?: string;
  setSelectedEmpresa?: (empresa: string) => void;
  selectedSector?: string;
  setSelectedSector?: (sector: string) => void;
  selectedFilial?: string;
  setSelectedFilial?: (filial: string) => void;
  selectedStatus?: string;
  setSelectedStatus?: (status: string) => void;
  sortField?: SortField;
  setSortField?: (field: SortField) => void;
  sortOrder?: SortOrder;
  setSortOrder?: (order: SortOrder) => void;
}

type SortField = 'nomeCompleto' | 'cargo' | 'setor' | 'dataAdmissao' | 'filial' | 'status';
type SortOrder = 'asc' | 'desc';

export default function ColaboradorList({
  colaboradores,
  searchQuery,
  onEdit,
  onDelete,
  userSettings,
  onAddNew,
  onUpdateColaboradores,
  selectedEmpresa: propSelectedEmpresa,
  setSelectedEmpresa: propSetSelectedEmpresa,
  selectedSector: propSelectedSector,
  setSelectedSector: propSetSelectedSector,
  selectedFilial: propSelectedFilial,
  setSelectedFilial: propSetSelectedFilial,
  selectedStatus: propSelectedStatus,
  setSelectedStatus: propSetSelectedStatus,
  sortField: propSortField,
  setSortField: propSetSortField,
  sortOrder: propSortOrder,
  setSortOrder: propSetSortOrder,
}: ColaboradorListProps) {
  // Filters state (internal fallback)
  const [internalEmpresa, setInternalEmpresa] = useState<string>('Todos');
  const [internalSector, setInternalSector] = useState<string>('Todos');
  const [internalFilial, setInternalFilial] = useState<string>('Todos');
  const [internalStatus, setInternalStatus] = useState<string>('Ativo');

  const selectedEmpresa = propSelectedEmpresa ?? internalEmpresa;
  const setSelectedEmpresa = propSetSelectedEmpresa ?? setInternalEmpresa;

  const selectedSector = propSelectedSector ?? internalSector;
  const setSelectedSector = propSetSelectedSector ?? setInternalSector;

  const selectedFilial = propSelectedFilial ?? internalFilial;
  const setSelectedFilial = propSetSelectedFilial ?? setInternalFilial;

  const selectedStatus = propSelectedStatus ?? internalStatus;
  const setSelectedStatus = propSetSelectedStatus ?? setInternalStatus;

  // Compute unique Empresas from colaboradores with status 'Ativo' ONLY (Grouped case-insensitively and space-normalized)
  const ALL_EMPRESAS = useMemo(() => {
    const activeColabs = colaboradores.filter(
      (c) => (c.status || '').trim().toLowerCase() === 'ativo'
    );
    const map = new Map<string, string>();
    activeColabs.forEach((c) => {
      if (c.empresa) {
        const trimmed = c.empresa.trim().replace(/\s+/g, ' ');
        if (trimmed) {
          const norm = normalizeEmpresa(trimmed);
          const key = norm.toLowerCase();
          if (!map.has(key)) {
            map.set(key, norm);
          }
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a === 'Bio Brands') return -1;
      if (b === 'Bio Brands') return 1;
      if (a === 'Bio Scientific') return -1;
      if (b === 'Bio Scientific') return 1;
      if (a === 'Terceiros') return -1;
      if (b === 'Terceiros') return 1;
      return a.localeCompare(b, 'pt-BR');
    });
  }, [colaboradores]);

  // Compute unique Sectors from colaboradores with status 'Ativo' ONLY (Grouped case-insensitively)
  const ALL_SETORES = useMemo(() => {
    const activeColabs = colaboradores.filter(
      (c) => (c.status || '').trim().toLowerCase() === 'ativo'
    );
    const map = new Map<string, string>();
    activeColabs.forEach((c) => {
      if (c.setor) {
        const trimmed = c.setor.trim().replace(/\s+/g, ' ');
        if (trimmed) {
          const key = trimmed.toLowerCase();
          if (!map.has(key)) {
            const match = SETORES.find((s) => s.toLowerCase() === key);
            map.set(key, match || trimmed);
          }
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [colaboradores]);

  // Compute unique Filiais from colaboradores with status 'Ativo' ONLY (Grouped case-insensitively and space-normalized)
  const ALL_FILIAIS = useMemo(() => {
    const activeColabs = colaboradores.filter(
      (c) => (c.status || '').trim().toLowerCase() === 'ativo'
    );
    const map = new Map<string, string>();
    activeColabs.forEach((c) => {
      if (c.filial) {
        const trimmed = c.filial.trim().replace(/\s+/g, ' ');
        if (trimmed) {
          const key = trimmed.toUpperCase();
          if (!map.has(key)) {
            map.set(key, key);
          }
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [colaboradores]);

  // Normalized values for select components
  const normalizedSelectedEmpresa = useMemo(() => {
    if (selectedEmpresa === 'Todos') return 'Todos';
    const match = ALL_EMPRESAS.find(
      (e) => e.trim().toLowerCase() === selectedEmpresa.trim().toLowerCase()
    );
    return match || selectedEmpresa;
  }, [selectedEmpresa, ALL_EMPRESAS]);

  const normalizedSelectedSector = useMemo(() => {
    if (selectedSector === 'Todos') return 'Todos';
    const match = ALL_SETORES.find(
      (s) => s.trim().toLowerCase() === selectedSector.trim().toLowerCase()
    );
    return match || selectedSector;
  }, [selectedSector, ALL_SETORES]);

  const normalizedSelectedFilial = useMemo(() => {
    if (selectedFilial === 'Todos') return 'Todos';
    const match = ALL_FILIAIS.find(
      (f) => f.trim().toUpperCase() === selectedFilial.trim().toUpperCase()
    );
    return match || selectedFilial;
  }, [selectedFilial, ALL_FILIAIS]);

  // Compute active empresa counts grouped by canonical empresa
  const empresaCounts = useMemo(() => {
    const map: Record<string, number> = {};
    colaboradores.forEach((c) => {
      if ((c.status || '').trim().toLowerCase() === 'ativo' && c.empresa) {
        const norm = normalizeEmpresa(c.empresa);
        const key = norm.toLowerCase();
        if (key) {
          map[key] = (map[key] || 0) + 1;
        }
      }
    });
    return map;
  }, [colaboradores]);

  // Compute active sector counts grouped by canonical sector
  const sectorCounts = useMemo(() => {
    const map: Record<string, number> = {};
    colaboradores.forEach((c) => {
      if ((c.status || '').trim().toLowerCase() === 'ativo' && c.setor) {
        const key = c.setor.trim().replace(/\s+/g, ' ').toLowerCase();
        if (key) {
          map[key] = (map[key] || 0) + 1;
        }
      }
    });
    return map;
  }, [colaboradores]);

  // Compute active filial counts grouped by canonical uppercase filial
  const filialCounts = useMemo(() => {
    const map: Record<string, number> = {};
    colaboradores.forEach((c) => {
      if ((c.status || '').trim().toLowerCase() === 'ativo' && c.filial) {
        const key = c.filial.trim().replace(/\s+/g, ' ').toUpperCase();
        if (key) {
          map[key] = (map[key] || 0) + 1;
        }
      }
    });
    return map;
  }, [colaboradores]);

  // Local name filter inside Filtros Rápidos
  const [nameFilter, setNameFilter] = useState('');

  // Number of active filters
  const activeFiltersCount = 
    (nameFilter.trim() ? 1 : 0) + 
    (selectedEmpresa !== 'Todos' ? 1 : 0) + 
    (selectedSector !== 'Todos' ? 1 : 0) + 
    (selectedFilial !== 'Todos' ? 1 : 0) + 
    (selectedStatus !== 'Todos' ? 1 : 0);
  
  // Sorting state (internal fallback)
  const [internalSortField, setInternalSortField] = useState<SortField>('nomeCompleto');
  const [internalSortOrder, setInternalSortOrder] = useState<SortOrder>('asc');

  const sortField = propSortField ?? internalSortField;
  const setSortField = propSetSortField ?? setInternalSortField;

  const sortOrder = propSortOrder ?? internalSortOrder;
  const setSortOrder = propSetSortOrder ?? setInternalSortOrder;

  // Detail Modal / Panel for single Colaborador
  const [activeDetailsColab, setActiveDetailsColab] = useState<Colaborador | null>(null);

  // Custom Export PDF Modal
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);

  // MySQL tb_colaboradores sync modal
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isMySQLSourceActive, setIsMySQLSourceActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('colab_source_mysql') === 'true';
    } catch {
      return false;
    }
  });

  // Filter & Sort collaborateurs
  const filteredAndSortedColaboradores = useMemo(() => {
    let result = [...colaboradores];

    // 1. Search Query Filter (Global Header)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.nomeCompleto.toLowerCase().includes(q) ||
          c.exibicao.toLowerCase().includes(q) ||
          (c.cpf && c.cpf.includes(q)) ||
          (c.rg && c.rg.includes(q)) ||
          (c.matricula && c.matricula.toLowerCase().includes(q)) ||
          c.cargo.toLowerCase().includes(q) ||
          c.setor.toLowerCase().includes(q) ||
          (c.empresa && c.empresa.toLowerCase().includes(q)) ||
          (c.filial && c.filial.toLowerCase().includes(q))
      );
    }

    // 1.5 Local Name Filter ("Localizar Colaborador" in Filtros Rápidos)
    if (nameFilter.trim()) {
      const nameQ = nameFilter.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.nomeCompleto.toLowerCase().includes(nameQ) ||
          c.exibicao.toLowerCase().includes(nameQ)
      );
    }

    // 1.8 Empresa Filter (Grouped case-insensitively & normalized)
    if (selectedEmpresa !== 'Todos') {
      const targetEmp = normalizeEmpresa(selectedEmpresa).toLowerCase();
      result = result.filter(
        (c) => normalizeEmpresa(c.empresa).toLowerCase() === targetEmp
      );
    }

    // 2. Sector Filter
    if (selectedSector !== 'Todos') {
      const targetSec = selectedSector.trim().replace(/\s+/g, ' ').toLowerCase();
      result = result.filter(
        (c) => (c.setor || '').trim().replace(/\s+/g, ' ').toLowerCase() === targetSec
      );
    }

    // 2.5 Filial Filter (Grouped case-insensitively & normalized)
    if (selectedFilial !== 'Todos') {
      const targetFilial = selectedFilial.trim().replace(/\s+/g, ' ').toUpperCase();
      result = result.filter(
        (c) => (c.filial || '').trim().replace(/\s+/g, ' ').toUpperCase() === targetFilial
      );
    }

    // 3. Status Filter
    if (selectedStatus !== 'Todos') {
      const targetStatus = selectedStatus.trim().toLowerCase();
      result = result.filter((c) => (c.status || '').trim().toLowerCase() === targetStatus);
    }

    // 4. Sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'dataAdmissao') {
        const timeA = new Date(a.dataAdmissao || '').getTime() || 0;
        const timeB = new Date(b.dataAdmissao || '').getTime() || 0;
        comparison = timeA - timeB;
      } else {
        const valA = (a[sortField] || '').trim();
        const valB = (b[sortField] || '').trim();
        comparison = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
      }

      if (comparison === 0) {
        return (a.nomeCompleto || '').localeCompare(b.nomeCompleto || '', 'pt-BR', { sensitivity: 'base' });
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [colaboradores, searchQuery, nameFilter, selectedEmpresa, selectedSector, selectedFilial, selectedStatus, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'dataAdmissao' ? 'desc' : 'asc');
    }
  };

  // ==========================================
  // EXPORT TO PDF FUNCTIONS
  // ==========================================

  // 1. Export entire table list of colaboradores
  const exportFullListPDF = () => {
    if (filteredAndSortedColaboradores.length === 0) return;

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const today = new Date().toLocaleDateString('pt-BR');

    // Header styling - Blue Accent Theme
    doc.setFillColor(14, 165, 233); 
    doc.rect(0, 0, 297, 40, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(userSettings.empresa.toUpperCase(), 15, 18);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('RELATÓRIO CONSOLIDADO DE COLABORADORES', 15, 26);
    doc.text(`Data de Geração: ${today} | Total de Registros: ${filteredAndSortedColaboradores.length}`, 15, 32);

    // Filter information banner
    doc.setTextColor(100, 116, 139); // dusty slate
    doc.setFontSize(9);
    doc.text(`Filtros Aplicados - Setor: ${selectedSector} | Filial: ${selectedFilial} | Status: ${selectedStatus}`, 15, 48);

    // Prepare table data
    const tableHeaders = [['Nome Completo', 'CPF', 'RG', 'Cargo', 'Setor', 'Empresa / Filial', 'Admissão', 'Status']];
    const tableRows = filteredAndSortedColaboradores.map((c) => [
      c.nomeCompleto,
      c.cpf || '-',
      c.rg || '-',
      c.cargo,
      c.setor,
      c.empresa && c.filial ? `${c.empresa} (${c.filial})` : '-',
      formatLocalDate(c.dataAdmissao),
      c.status
    ]);

    // Render Table
    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 52,
      theme: 'striped',
      headStyles: {
        fillColor: [14, 165, 233], // Blue Accent
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [15, 23, 42],
      },
      columnStyles: {
        0: { cellWidth: 45 }, // Name column
        1: { cellWidth: 32 },
        2: { cellWidth: 28 },
        3: { cellWidth: 40 },
        4: { cellWidth: 30 },
        5: { cellWidth: 47 }, // Empresa / Filial
        6: { cellWidth: 25 },
        7: { cellWidth: 20 },
      },
      margin: { left: 15, right: 15 }
    });

    // Save File
    doc.save(`relatorio-colaboradores-${userSettings.empresa.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  // 2. Export single employee registration card
  const exportIndividualPDF = (c: Colaborador) => {
    const doc = new jsPDF('p', 'mm', 'a4'); // Portrait orientation
    const today = new Date().toLocaleDateString('pt-BR');

    // 1. Decorative border
    doc.setDrawColor(186, 230, 253); // Blue border
    doc.rect(8, 8, 194, 281);

    // 2. Header background - Blue Theme
    doc.setFillColor(14, 165, 233); 
    doc.rect(10, 10, 190, 32, 'F');

    // 3. Header Texts
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(userSettings.empresa.toUpperCase(), 18, 22);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('FICHA CADASTRAL DO COLABORADOR', 18, 30);
    doc.setFontSize(9);
    doc.text(`Identificador Único: ${c.id.toUpperCase()}`, 18, 36);

    // 4. Photo Placeholder or Badge on top right of header
    doc.setFillColor(255, 255, 255);
    doc.rect(160, 14, 24, 24, 'F');
    doc.setTextColor(14, 165, 233); // Blue text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const initials = c.nomeCompleto.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
    doc.text(initials, 168, 29);

    // Content Styling
    doc.setTextColor(15, 23, 42); // slate-900 text

    // Section 1: Informações Pessoais
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. DADOS PESSOAIS', 18, 55);
    doc.setDrawColor(14, 165, 233); // Blue divider
    doc.line(18, 57, 190, 57);

    // Personal details table/grid
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Nome Completo:', 18, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(c.nomeCompleto, 52, 66);

    doc.setFont('helvetica', 'bold');
    doc.text('Nome de Exibição:', 18, 74);
    doc.setFont('helvetica', 'normal');
    doc.text(c.exibicao, 52, 74);

    doc.setFont('helvetica', 'bold');
    doc.text('CPF:', 18, 82);
    doc.setFont('helvetica', 'normal');
    doc.text(c.cpf, 52, 82);

    doc.setFont('helvetica', 'bold');
    doc.text('RG:', 18, 90);
    doc.setFont('helvetica', 'normal');
    doc.text(c.rg, 52, 90);

    doc.setFont('helvetica', 'bold');
    doc.text('Data de Nascimento:', 18, 98);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatLocalDate(c.dataNascimento)}`, 52, 98);

    // Section 2: Informações Profissionais
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. INFORMAÇÕES PROFISSIONAIS', 18, 115);
    doc.setDrawColor(14, 165, 233);
    doc.line(18, 117, 190, 117);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Cargo atual:', 18, 126);
    doc.setFont('helvetica', 'normal');
    doc.text(c.cargo, 52, 126);

    doc.setFont('helvetica', 'bold');
    doc.text('Setor corporativo:', 18, 134);
    doc.setFont('helvetica', 'normal');
    doc.text(c.setor, 52, 134);

    doc.setFont('helvetica', 'bold');
    doc.text('Data de Admissão:', 18, 142);
    doc.setFont('helvetica', 'normal');
    doc.text(formatLocalDate(c.dataAdmissao), 52, 142);

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', 18, 150);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.status === 'Ativo' ? 16 : 100, c.status === 'Ativo' ? 124 : 116, c.status === 'Ativo' ? 65 : 139);
    doc.text(c.status.toUpperCase(), 52, 150);
    doc.setTextColor(15, 23, 42); // reset color

    doc.setFont('helvetica', 'bold');
    doc.text('Empresa:', 18, 158);
    doc.setFont('helvetica', 'normal');
    doc.text(c.empresa || '-', 52, 158);

    doc.setFont('helvetica', 'bold');
    doc.text('Filial:', 18, 166);
    doc.setFont('helvetica', 'normal');
    doc.text(c.filial || '-', 52, 166);

    // Section 3: Contatos e Endereços
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. CONTATOS CORPORATIVOS', 18, 182);
    doc.setDrawColor(14, 165, 233);
    doc.line(18, 184, 190, 184);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('E-mail funcional:', 18, 192);
    doc.setFont('helvetica', 'normal');
    doc.text(c.email, 52, 192);

    doc.setFont('helvetica', 'bold');
    doc.text('Telefone / WhatsApp:', 18, 200);
    doc.setFont('helvetica', 'normal');
    const phoneDisplay = c.telefone ? formatTelefone(c.telefone).replace(/\n/g, ' / ') : 'Não informado';
    doc.text(phoneDisplay, 52, 200);

    // Section 4: Termo de Responsabilidade e Assinaturas
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARAÇÃO DE RESPONSABILIDADE', 18, 218);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    
    const statement = 'Declaro para os devidos fins que as informações prestadas acima são verídicas e condizentes com os documentos originais apresentados pelo colaborador no ato de sua admissão nesta corporação, sendo mantidos sob sigilo corporativo conforme a Lei Geral de Proteção de Dados (LGPD).';
    const splitStatement = doc.splitTextToSize(statement, 172);
    doc.text(splitStatement, 18, 224);

    // Signatures
    doc.setDrawColor(100, 116, 139); 
    doc.line(25, 258, 90, 258);
    doc.line(115, 258, 180, 258);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Assinatura do Colaborador', 37, 263);
    doc.text('Representante de RH / Empresa', 123, 263);

    doc.setFont('helvetica', 'normal');
    doc.text(`CPF: ${c.cpf}`, 43, 267);
    doc.text(userSettings.empresa, 134, 267);

    // Document timestamp at bottom
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text(`Documento autenticado eletronicamente. Gerado em ${today} às ${new Date().toLocaleTimeString('pt-BR')}.`, 18, 278);

    // Save individual file
    doc.save(`ficha-${c.exibicao.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Quick Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif italic font-bold text-natural-text text-2xl tracking-tight">
            Colaboradores
          </h1>
          <p className="text-sm text-natural-muted">
            Filtre, edite ou exporte documentos cadastrais da equipe.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 flex-wrap gap-y-2">
          <button
            id="btn-sync-mysql-colabs"
            onClick={() => setIsSyncModalOpen(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs py-2.5 px-4 rounded-full inline-flex items-center space-x-1.5 transition-all cursor-pointer border border-indigo-200 shadow-2xs hover:border-indigo-300"
            title="Carregar colaboradores com status ativo = 1 da tabela tb_colaborador no MySQL (100.24.209.39)"
          >
            <Database size={14} className="text-indigo-600" />
            <span className="hidden sm:inline">MySQL</span>
            <span>tb_colaborador</span>
            <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              ativo = 1
            </span>
          </button>

          <button
            id="add-new-colab-btn"
            onClick={onAddNew}
            className="bg-natural-primary hover:bg-natural-hover text-white font-semibold text-xs py-2.5 px-5 rounded-full inline-flex items-center space-x-2 transition-all cursor-pointer border border-natural-primary shadow-xs"
          >
            <UserPlus size={14} />
            <span>Novo Colaborador</span>
          </button>

          <button
            id="export-full-list-pdf-btn"
            disabled={filteredAndSortedColaboradores.length === 0}
            onClick={() => setIsExportPdfModalOpen(true)}
            className={`font-semibold text-xs py-2.5 px-5 rounded-full inline-flex items-center space-x-2 transition-all cursor-pointer border ${
              filteredAndSortedColaboradores.length === 0
                ? 'bg-natural-light border-natural-border text-natural-muted cursor-not-allowed'
                : 'bg-white hover:bg-natural-light text-natural-text border-natural-border shadow-xs hover:border-sky-300'
            }`}
          >
            <FileDown size={14} className="text-sky-600" />
            <span>Exportar Lista (PDF)</span>
          </button>
        </div>
      </div>

      {/* MySQL tb_colaborador banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl border border-indigo-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Database size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-xs font-bold text-white tracking-tight">
                Origem MySQL: <code className="text-indigo-300 font-mono">tb_colaborador</code>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ativo = 1
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                100.24.209.39:3306 (root)
              </span>
              {isMySQLSourceActive && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Sincronizado
                </span>
              )}
            </div>
            <p className="text-[11px] text-indigo-200/80 leading-relaxed mt-0.5">
              {isMySQLSourceActive
                ? `Exibindo a lista de colaboradores ativos recuperada da tabela tb_colaborador do banco MySQL.`
                : `Conecte-se e carregue os colaboradores com status ativo = 1 diretamente da tabela tb_colaborador.`}
            </p>
          </div>
        </div>

        <button
          id="btn-sync-colabs-action"
          onClick={() => setIsSyncModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Database size={13} />
          <span>{isMySQLSourceActive ? 'Sincronizar Novamente' : 'Carregar do MySQL (ativo = 1)'}</span>
        </button>
      </div>

      {/* Advanced Quick Filters Panel */}
      <div className="bg-white border border-natural-border rounded-2xl p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-natural-text font-bold text-xs uppercase tracking-wider">
            <Filter size={15} className="text-natural-primary" />
            <span>Filtros Rápidos</span>
            {activeFiltersCount > 0 && (
              <span className="bg-natural-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'ativo' : 'ativos'}
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              id="btn-reset-quick-filters"
              onClick={() => {
                setNameFilter('');
                setSelectedEmpresa('Todos');
                setSelectedSector('Todos');
                setSelectedFilial('Todos');
                setSelectedStatus('Todos');
              }}
              className="text-[11px] font-semibold text-natural-primary hover:text-natural-hover flex items-center space-x-1.5 transition-colors cursor-pointer bg-natural-light hover:bg-natural-light-gray border border-natural-border px-2.5 py-1 rounded-lg"
            >
              <RotateCcw size={12} />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Localizar Colaborador Input */}
          <div className="space-y-1.5">
            <label htmlFor="input-filter-nome" className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center space-x-1.5">
              <Search size={13} className="text-natural-primary" />
              <span>Localizar</span>
            </label>
            <div className="relative">
              <input
                id="input-filter-nome"
                type="text"
                placeholder="Nome..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className={`w-full bg-natural-light border rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-natural-text transition-all focus:outline-hidden ${
                  nameFilter.trim()
                    ? 'border-natural-primary ring-2 ring-natural-accent/30 bg-natural-accent/10 font-semibold'
                    : 'border-natural-border hover:border-natural-primary/50 focus:border-natural-primary focus:ring-2 focus:ring-natural-accent/20'
                }`}
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-natural-muted">
                <Search size={14} />
              </div>
              {nameFilter && (
                <button
                  type="button"
                  id="btn-clear-name-filter"
                  onClick={() => setNameFilter('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-natural-muted hover:text-natural-text transition-colors cursor-pointer"
                  title="Limpar busca de nome"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Empresa Listbox */}
          <div className="space-y-1.5">
            <label htmlFor="select-listbox-empresa" className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center space-x-1.5">
              <Building2 size={13} className="text-natural-primary" />
              <span>Empresa (Ativas)</span>
            </label>
            <div className="relative">
              <select
                id="select-listbox-empresa"
                value={normalizedSelectedEmpresa}
                onChange={(e) => setSelectedEmpresa(e.target.value)}
                className={`w-full appearance-none bg-natural-light border rounded-xl px-3.5 py-2.5 pr-9 text-xs font-medium text-natural-text transition-all focus:outline-hidden cursor-pointer ${
                  selectedEmpresa !== 'Todos'
                    ? 'border-natural-primary ring-2 ring-natural-accent/30 bg-natural-accent/10 font-semibold'
                    : 'border-natural-border hover:border-natural-primary/50 focus:border-natural-primary focus:ring-2 focus:ring-natural-accent/20'
                }`}
              >
                <option value="Todos">Todas as Empresas ({ALL_EMPRESAS.length})</option>
                {ALL_EMPRESAS.map((emp) => {
                  const key = emp.toLowerCase();
                  const count = empresaCounts[key] || 0;
                  return (
                    <option key={emp} value={emp}>
                      {emp} {count > 0 ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-natural-muted">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Sector Listbox */}
          <div className="space-y-1.5">
            <label htmlFor="select-listbox-setor" className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center space-x-1.5">
              <Building size={13} className="text-natural-primary" />
              <span>Setor (Ativos)</span>
            </label>
            <div className="relative">
              <select
                id="select-listbox-setor"
                value={normalizedSelectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className={`w-full appearance-none bg-natural-light border rounded-xl px-3.5 py-2.5 pr-9 text-xs font-medium text-natural-text transition-all focus:outline-hidden cursor-pointer ${
                  selectedSector !== 'Todos'
                    ? 'border-natural-primary ring-2 ring-natural-accent/30 bg-natural-accent/10 font-semibold'
                    : 'border-natural-border hover:border-natural-primary/50 focus:border-natural-primary focus:ring-2 focus:ring-natural-accent/20'
                }`}
              >
                <option value="Todos">Todos os Setores ({ALL_SETORES.length})</option>
                {ALL_SETORES.map((sec) => {
                  const key = sec.trim().replace(/\s+/g, ' ').toLowerCase();
                  const count = sectorCounts[key] || 0;
                  return (
                    <option key={sec} value={sec}>
                      {sec} {count > 0 ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-natural-muted">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Filial Listbox */}
          <div className="space-y-1.5">
            <label htmlFor="select-listbox-filial" className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center space-x-1.5">
              <MapPin size={13} className="text-natural-primary" />
              <span>Unidade / Filial (Ativas)</span>
            </label>
            <div className="relative">
              <select
                id="select-listbox-filial"
                value={normalizedSelectedFilial}
                onChange={(e) => setSelectedFilial(e.target.value)}
                className={`w-full appearance-none bg-natural-light border rounded-xl px-3.5 py-2.5 pr-9 text-xs font-medium text-natural-text transition-all focus:outline-hidden cursor-pointer ${
                  selectedFilial !== 'Todos'
                    ? 'border-natural-primary ring-2 ring-natural-accent/30 bg-natural-accent/10 font-semibold'
                    : 'border-natural-border hover:border-natural-primary/50 focus:border-natural-primary focus:ring-2 focus:ring-natural-accent/20'
                }`}
              >
                <option value="Todos">Todas as Filiais ({ALL_FILIAIS.length})</option>
                {ALL_FILIAIS.map((filial) => {
                  const key = filial.trim().replace(/\s+/g, ' ').toUpperCase();
                  const count = filialCounts[key] || 0;
                  return (
                    <option key={filial} value={filial}>
                      {filial} {count > 0 ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-natural-muted">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Status Listbox */}
          <div className="space-y-1.5">
            <label htmlFor="select-listbox-status" className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center space-x-1.5">
              <Activity size={13} className="text-natural-primary" />
              <span>Status</span>
            </label>
            <div className="relative">
              <select
                id="select-listbox-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`w-full appearance-none bg-natural-light border rounded-xl px-3.5 py-2.5 pr-9 text-xs font-medium text-natural-text transition-all focus:outline-hidden cursor-pointer ${
                  selectedStatus !== 'Todos'
                    ? 'border-natural-primary ring-2 ring-natural-accent/30 bg-natural-accent/10 font-semibold'
                    : 'border-natural-border hover:border-natural-primary/50 focus:border-natural-primary focus:ring-2 focus:ring-natural-accent/20'
                }`}
              >
                <option value="Todos">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-natural-muted">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Counters */}
      <div className="flex items-center justify-between text-xs text-natural-muted font-medium">
        <span>
          Mostrando <span className="font-semibold text-natural-text">{filteredAndSortedColaboradores.length}</span> de <span className="font-semibold text-natural-text">{colaboradores.length}</span> cadastrados
        </span>
        {(searchQuery || nameFilter) && (
          <span>
            Filtro ativo: <span className="text-natural-primary font-semibold italic">"{nameFilter || searchQuery}"</span>
          </span>
        )}
      </div>

      {/* Directory Main List */}
      {filteredAndSortedColaboradores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-natural-border p-12 text-center shadow-xs">
          <div className="p-3 bg-natural-light text-natural-muted border border-natural-border rounded-full inline-block mb-3">
            <Users size={32} />
          </div>
          <h3 className="font-serif italic font-bold text-natural-text text-base">Nenhum resultado encontrado</h3>
          <p className="text-natural-muted text-xs max-w-sm mx-auto mt-1 leading-relaxed">
            Nenhum colaborador corresponde aos termos de pesquisa ou filtros selecionados. Tente ajustar os parâmetros.
          </p>
          <button
            id="clear-filters-btn"
            onClick={() => {
              setSelectedSector('Todos');
              setSelectedFilial('Todos');
              setSelectedStatus('Todos');
            }}
            className="mt-4 bg-natural-light hover:bg-natural-light-gray border border-natural-border text-natural-text text-xs font-semibold py-2 px-4 rounded-full transition-colors cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block bg-white border border-natural-border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-natural-light border-b border-natural-border text-natural-muted font-bold text-[11px] uppercase tracking-wider">
                    {/* Colaborador */}
                    <th
                      className="py-4 px-5 cursor-pointer hover:bg-natural-light/50 transition-colors select-none group"
                      onClick={() => handleSort('nomeCompleto')}
                      title="Clique para ordenar por Nome"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className={sortField === 'nomeCompleto' ? 'text-natural-primary font-bold' : ''}>Colaborador</span>
                        {sortField === 'nomeCompleto' ? (
                          sortOrder === 'desc' ? (
                            <ArrowDown size={13} className="text-natural-primary shrink-0" />
                          ) : (
                            <ArrowUp size={13} className="text-natural-primary shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-natural-muted opacity-40 group-hover:opacity-100 shrink-0" />
                        )}
                      </div>
                    </th>



                    {/* Setor */}
                    <th
                      className="py-4 px-4 cursor-pointer hover:bg-natural-light/50 transition-colors select-none group"
                      onClick={() => handleSort('setor')}
                      title="Clique para ordenar por Setor"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className={sortField === 'setor' ? 'text-natural-primary font-bold' : ''}>Setor</span>
                        {sortField === 'setor' ? (
                          sortOrder === 'desc' ? (
                            <ArrowDown size={13} className="text-natural-primary shrink-0" />
                          ) : (
                            <ArrowUp size={13} className="text-natural-primary shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-natural-muted opacity-40 group-hover:opacity-100 shrink-0" />
                        )}
                      </div>
                    </th>

                    {/* Filial */}
                    <th
                      className="py-4 px-4 cursor-pointer hover:bg-natural-light/50 transition-colors select-none group"
                      onClick={() => handleSort('filial')}
                      title="Clique para ordenar por Filial"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className={sortField === 'filial' ? 'text-natural-primary font-bold' : ''}>Filial</span>
                        {sortField === 'filial' ? (
                          sortOrder === 'desc' ? (
                            <ArrowDown size={13} className="text-natural-primary shrink-0" />
                          ) : (
                            <ArrowUp size={13} className="text-natural-primary shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-natural-muted opacity-40 group-hover:opacity-100 shrink-0" />
                        )}
                      </div>
                    </th>

                    {/* Celular */}
                    <th className="py-4 px-4">Celular</th>

                    {/* Status */}
                    <th
                      className="py-4 px-4 cursor-pointer hover:bg-natural-light/50 transition-colors select-none group"
                      onClick={() => handleSort('status')}
                      title="Clique para ordenar por Status"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className={sortField === 'status' ? 'text-natural-primary font-bold' : ''}>Status</span>
                        {sortField === 'status' ? (
                          sortOrder === 'desc' ? (
                            <ArrowDown size={13} className="text-natural-primary shrink-0" />
                          ) : (
                            <ArrowUp size={13} className="text-natural-primary shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-natural-muted opacity-40 group-hover:opacity-100 shrink-0" />
                        )}
                      </div>
                    </th>

                    <th className="py-4 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-natural-border text-xs text-natural-text">
                  {filteredAndSortedColaboradores.map((c) => (
                    <tr key={c.id} className="hover:bg-natural-light/30 transition-colors group">
                      {/* Name / Display avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-full ${c.avatarColor || 'bg-natural-primary text-white'} flex items-center justify-center font-bold text-sm tracking-wide shrink-0 border border-black/5 shadow-xs`}>
                            {c.nomeCompleto.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-natural-text block truncate group-hover:text-natural-primary transition-colors">
                              {c.nomeCompleto}
                            </span>
                            {c.exibicao && (
                              <span className="text-[11px] text-natural-muted block mt-0.5 font-medium">
                                {c.exibicao}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>



                      {/* Setor */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-natural-light text-natural-primary border border-natural-border">
                          {c.setor}
                        </span>
                      </td>

                      {/* Filial */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-natural-text">
                          {c.filial || '-'}
                        </span>
                      </td>

                      {/* Celular */}
                      <td className="py-3.5 px-4 font-mono text-natural-text font-medium">
                        {c.telefone ? (
                          <div className="space-y-0.5">
                            {c.telefone
                              .split(/\s*(?:\/|,|\n)\s*/)
                              .filter(Boolean)
                              .map((tel, idx) => (
                                <div key={idx} className="whitespace-nowrap">
                                  {tel}
                                </div>
                              ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {c.status === 'Ativo' ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-natural-muted bg-natural-light border border-natural-border px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-natural-muted"></span>
                            <span>Inativo</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          
                          {/* View details */}
                          <button
                            id={`colab-view-details-${c.id}`}
                            onClick={() => setActiveDetailsColab(c)}
                            title="Visualizar Detalhes"
                            className="p-1.5 rounded-lg text-natural-muted hover:text-natural-text hover:bg-natural-light transition-all cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Print individual PDF */}
                          <button
                            id={`colab-pdf-${c.id}`}
                            onClick={() => exportIndividualPDF(c)}
                            title="Exportar Ficha PDF"
                            className="p-1.5 rounded-lg text-natural-primary hover:text-white hover:bg-natural-primary transition-all cursor-pointer"
                          >
                            <FileDown size={15} />
                          </button>

                          {/* Edit */}
                          <button
                            id={`colab-edit-${c.id}`}
                            onClick={() => onEdit(c)}
                            title="Editar Cadastro"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50/50 transition-all cursor-pointer"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            id={`colab-delete-${c.id}`}
                            onClick={() => onDelete(c.id)}
                            title="Remover Registro"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50/50 transition-all cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE RESPONSIVE CARD VIEW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {filteredAndSortedColaboradores.map((c) => (
              <div 
                key={c.id} 
                className="bg-white border border-natural-border rounded-xl p-5 shadow-xs space-y-4 hover:border-natural-accent transition-all"
              >
                {/* Header card details */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full ${c.avatarColor || 'bg-natural-primary text-white'} flex items-center justify-center font-bold text-sm shrink-0 border border-black/5`}>
                      {c.nomeCompleto.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-natural-text text-sm leading-snug">
                        {c.nomeCompleto}
                      </h4>
                      {c.exibicao && (
                        <span className="text-[11px] text-natural-muted block mt-0.5 font-medium">
                          {c.exibicao}
                        </span>
                      )}
                      <span className="text-[11px] text-natural-muted block mt-1">
                        Setor: <strong className="text-natural-text">{c.setor}</strong>
                      </span>
                      {c.empresa && (
                        <span className="text-[11px] text-natural-muted block mt-0.5">
                          Empresa: <strong className="text-natural-text">{c.empresa} ({c.filial})</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {c.status === 'Ativo' ? (
                    <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-natural-muted bg-natural-light px-2 py-0.5 rounded-full text-[10px] font-bold">
                      Inativo
                    </span>
                  )}
                </div>

                {/* Body details */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-natural-border text-[11px] leading-relaxed">
                  <div>
                    <span className="text-natural-muted block font-medium">Cargo</span>
                    <span className="font-semibold text-natural-text block truncate">{c.cargo}</span>
                  </div>
                  <div>
                    <span className="text-natural-muted block font-medium">Celular</span>
                    <div className="font-mono font-semibold text-natural-text block leading-snug space-y-0.5 mt-0.5">
                      {c.telefone ? (
                        c.telefone
                          .split(/\s*(?:\/|,|\n)\s*/)
                          .filter(Boolean)
                          .map((tel, idx) => (
                            <div key={idx}>{tel}</div>
                          ))
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-natural-muted block font-medium">Filial</span>
                    <span className="font-semibold text-natural-text block truncate">{c.filial || '-'}</span>
                  </div>
                  {c.matricula && (
                    <div>
                      <span className="text-natural-muted block font-medium">Matrícula</span>
                      <span className="font-mono text-natural-text block">{c.matricula}</span>
                    </div>
                  )}
                </div>

                {/* Footer action buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-natural-border">
                  <span className="text-[10px] text-natural-muted font-medium">ID: {c.id.slice(0, 8)}</span>
                  
                  <div className="flex space-x-1.5">
                    {/* View */}
                    <button
                      id={`colab-mobile-view-${c.id}`}
                      onClick={() => setActiveDetailsColab(c)}
                      className="p-1.5 rounded-lg border border-natural-border text-natural-muted hover:bg-natural-light transition-all cursor-pointer"
                    >
                      <Eye size={14} />
                    </button>

                    {/* PDF */}
                    <button
                      id={`colab-mobile-pdf-${c.id}`}
                      onClick={() => exportIndividualPDF(c)}
                      className="p-1.5 rounded-lg border border-natural-border text-natural-primary hover:bg-natural-light-gray transition-all cursor-pointer"
                    >
                      <FileDown size={14} />
                    </button>

                    {/* Edit */}
                    <button
                      id={`colab-mobile-edit-${c.id}`}
                      onClick={() => onEdit(c)}
                      className="p-1.5 rounded-lg border border-natural-border text-amber-600 hover:bg-amber-50/50 transition-all cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      id={`colab-mobile-delete-${c.id}`}
                      onClick={() => onDelete(c.id)}
                      className="p-1.5 rounded-lg border border-natural-border text-rose-600 hover:bg-rose-50/50 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SINGLE EMPLOYEE COMPREHENSIVE DETAILS DRAWER/MODAL */}
      {activeDetailsColab && (
        <div className="fixed inset-0 bg-natural-primary/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-natural-border animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-natural-primary text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${activeDetailsColab.avatarColor || 'bg-natural-hover text-white'} flex items-center justify-center font-bold border border-white/10`}>
                  {activeDetailsColab.nomeCompleto.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif italic font-bold text-sm tracking-tight">{activeDetailsColab.nomeCompleto}</h3>
                  <span className="text-[10px] text-natural-accent font-medium font-mono">{activeDetailsColab.id.toUpperCase()}</span>
                </div>
              </div>
              <button
                id="close-details-modal-btn"
                onClick={() => setActiveDetailsColab(null)}
                className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              
              {/* Section 1: Pessoais */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-natural-primary uppercase tracking-wider block">Dados Pessoais</span>
                <div className="bg-natural-light rounded-xl p-3.5 border border-natural-border text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-natural-border">
                    <span className="text-natural-muted font-medium">Nome Completo:</span>
                    <span className="font-semibold text-natural-text">{activeDetailsColab.nomeCompleto}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-natural-border">
                    <span className="text-natural-muted font-medium">Nome Crachá:</span>
                    <span className="font-semibold text-natural-text">{activeDetailsColab.exibicao}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-natural-border">
                    <span className="text-natural-muted font-medium">CPF:</span>
                    <span className="font-mono font-semibold text-natural-text">{activeDetailsColab.cpf}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-natural-border">
                    <span className="text-natural-muted font-medium">RG:</span>
                    <span className="font-mono font-semibold text-natural-text">{activeDetailsColab.rg || '-'}</span>
                  </div>
                  {activeDetailsColab.matricula && (
                    <div className="flex justify-between py-1 border-b border-natural-border">
                      <span className="text-natural-muted font-medium">Matrícula:</span>
                      <span className="font-mono font-semibold text-natural-text">{activeDetailsColab.matricula}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-natural-muted font-medium">Nascimento:</span>
                    <span className="font-semibold text-natural-text">{formatLocalDate(activeDetailsColab.dataNascimento)}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Profissionais */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-natural-primary uppercase tracking-wider block">Dados de Contrato</span>
                <div className="bg-natural-light rounded-xl p-3.5 border border-natural-border text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-natural-border">
                    <span className="text-natural-muted font-medium">Cargo:</span>
                    <span className="font-semibold text-natural-text">{activeDetailsColab.cargo}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-natural-border">
                    <span className="text-natural-muted font-medium">Setor:</span>
                    <span className="font-semibold text-natural-text">{activeDetailsColab.setor}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-natural-border">
                    <span className="text-natural-muted font-medium">Data Admissão:</span>
                    <span className="font-semibold text-natural-text">{formatLocalDate(activeDetailsColab.dataAdmissao)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-natural-border">
                    <span className="text-natural-muted font-medium">Empresa:</span>
                    <span className="font-semibold text-natural-text">{activeDetailsColab.empresa || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-natural-border">
                    <span className="text-natural-muted font-medium">Filial:</span>
                    <span className="font-semibold text-natural-text">{activeDetailsColab.filial || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-natural-muted font-medium">Status Operacional:</span>
                    <span className={`font-bold ${activeDetailsColab.status === 'Ativo' ? 'text-emerald-700' : 'text-natural-muted'}`}>
                      {activeDetailsColab.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Contatos */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-natural-primary uppercase tracking-wider block">Canais de Contato</span>
                <div className="bg-natural-light rounded-xl p-3.5 border border-natural-border text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-natural-text py-0.5">
                    <Mail size={13} className="text-natural-primary shrink-0" />
                    <span className="text-natural-muted font-medium">E-mail:</span>
                    <span className="font-semibold text-natural-text truncate flex-1 text-right">{activeDetailsColab.email}</span>
                  </div>
                  <div className="flex items-start space-x-2 text-natural-text py-0.5">
                    <Phone size={13} className="text-natural-primary shrink-0 mt-0.5" />
                    <span className="text-natural-muted font-medium">Telefone(s):</span>
                    <div className="font-semibold text-natural-text flex-1 text-right space-y-0.5 font-mono">
                      {activeDetailsColab.telefone ? (
                        activeDetailsColab.telefone
                          .split(/\s*(?:\/|,|\n)\s*/)
                          .filter(Boolean)
                          .map((tel, idx) => (
                            <div key={idx}>{tel}</div>
                          ))
                      ) : (
                        'Não informado'
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-natural-light px-6 py-4 border-t border-natural-border flex items-center justify-between">
              <button
                id="modal-pdf-export-btn"
                onClick={() => {
                  exportIndividualPDF(activeDetailsColab);
                  setActiveDetailsColab(null);
                }}
                className="bg-natural-primary hover:bg-natural-hover text-white text-xs font-semibold py-2 px-5 rounded-full inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <FileDown size={14} />
                <span>Exportar Ficha (PDF)</span>
              </button>
              
              <button
                id="close-details-modal-bottom-btn"
                onClick={() => setActiveDetailsColab(null)}
                className="bg-white border border-natural-border text-natural-text hover:bg-natural-light text-xs font-semibold py-2 px-5 rounded-full transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Dynamic Column Customizer for PDF Export */}
      <ExportPdfModal
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
        colaboradores={filteredAndSortedColaboradores}
        userSettings={userSettings}
        appliedFilters={{
          empresa: selectedEmpresa,
          setor: selectedSector,
          filial: selectedFilial,
          status: selectedStatus,
          search: searchQuery || nameFilter
        }}
      />

      {/* MySQL tb_colaboradores Sync Modal */}
      <MySQLColaboradoresSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        currentActiveCount={filteredAndSortedColaboradores.length}
        initialColaboradores={colaboradores}
        onApplyColaboradores={(newColabs) => {
          if (onUpdateColaboradores) {
            onUpdateColaboradores(newColabs);
          }
          try {
            localStorage.setItem('colab_source_mysql', 'true');
            localStorage.setItem('colaboradores_registry', JSON.stringify(newColabs));
          } catch {}
          setIsMySQLSourceActive(true);
          setSelectedStatus('Ativo');
        }}
      />

    </div>
  );
}
