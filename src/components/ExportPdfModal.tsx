import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileDown, 
  CheckSquare, 
  Square, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  SlidersHorizontal,
  FileText,
  Building,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  GripVertical,
  ListOrdered,
  MoveHorizontal
} from 'lucide-react';
import { Colaborador } from '../types';
import { formatLocalDate, formatCPF, formatRG, formatTelefone } from '../data';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ColumnKey = 
  | 'nomeCompleto'
  | 'exibicao'
  | 'cpf'
  | 'rg'
  | 'matricula'
  | 'cargo'
  | 'setor'
  | 'empresa'
  | 'filial'
  | 'empresaFilial'
  | 'dataAdmissao'
  | 'tempoCasa'
  | 'dataNascimento'
  | 'idade'
  | 'email'
  | 'telefone'
  | 'status';

export interface ColumnDefinition {
  id: ColumnKey;
  label: string;
  category: 'identificacao' | 'profissional' | 'contato' | 'pessoal';
  description: string;
  defaultWidth: number;
  getValue: (c: Colaborador) => string;
}

// Helpers for age and tenure
function calculateAge(birthDateStr?: string): string {
  if (!birthDateStr) return '-';
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} anos` : '-';
}

function calculateTenure(admissionDateStr?: string): string {
  if (!admissionDateStr) return '-';
  const adm = new Date(admissionDateStr);
  if (isNaN(adm.getTime())) return '-';
  const today = new Date();
  
  let years = today.getFullYear() - adm.getFullYear();
  let months = today.getMonth() - adm.getMonth();
  if (today.getDate() < adm.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return 'Recente';
  if (years === 0 && months === 0) return '< 1 mês';
  if (years === 0) return `${months} m`;
  if (months === 0) return `${years} a`;
  return `${years}a ${months}m`;
}

export const AVAILABLE_COLUMNS: ColumnDefinition[] = [
  // 1. Identificação & Documentos
  {
    id: 'nomeCompleto',
    label: 'Nome Completo',
    category: 'identificacao',
    description: 'Nome completo registrado do colaborador',
    defaultWidth: 42,
    getValue: (c) => c.nomeCompleto || '-'
  },
  {
    id: 'exibicao',
    label: 'Nome de Exibição / Apelido',
    category: 'identificacao',
    description: 'Nome usual / crachá de identificação',
    defaultWidth: 28,
    getValue: (c) => c.exibicao || '-'
  },
  {
    id: 'cpf',
    label: 'CPF',
    category: 'identificacao',
    description: 'Cadastro de Pessoa Física formatado',
    defaultWidth: 28,
    getValue: (c) => c.cpf ? formatCPF(c.cpf) : '-'
  },
  {
    id: 'rg',
    label: 'RG',
    category: 'identificacao',
    description: 'Registro Geral com órgão emissor',
    defaultWidth: 26,
    getValue: (c) => c.rg ? formatRG(c.rg) : '-'
  },
  {
    id: 'matricula',
    label: 'Matrícula',
    category: 'identificacao',
    description: 'Código de registro interno do colaborador',
    defaultWidth: 22,
    getValue: (c) => c.matricula || '-'
  },

  // 2. Profissional & Alocação
  {
    id: 'cargo',
    label: 'Cargo / Função',
    category: 'profissional',
    description: 'Função desempenhada na empresa',
    defaultWidth: 35,
    getValue: (c) => c.cargo || '-'
  },
  {
    id: 'setor',
    label: 'Setor Corporativo',
    category: 'profissional',
    description: 'Departamento ou setor de atuação',
    defaultWidth: 28,
    getValue: (c) => c.setor || '-'
  },
  {
    id: 'empresa',
    label: 'Empresa',
    category: 'profissional',
    description: 'Razão social / Empresa do grupo (ex: Bio Brands / Bio Scientific)',
    defaultWidth: 28,
    getValue: (c) => c.empresa || '-'
  },
  {
    id: 'filial',
    label: 'Filial / Unidade',
    category: 'profissional',
    description: 'Unidade física ou filial de lotação',
    defaultWidth: 28,
    getValue: (c) => c.filial || '-'
  },
  {
    id: 'empresaFilial',
    label: 'Empresa / Filial (Unificada)',
    category: 'profissional',
    description: 'Exibe Empresa e Filial juntas na mesma coluna',
    defaultWidth: 42,
    getValue: (c) => c.empresa && c.filial ? `${c.empresa} (${c.filial})` : (c.empresa || c.filial || '-')
  },
  {
    id: 'dataAdmissao',
    label: 'Data de Admissão',
    category: 'profissional',
    description: 'Data de início na corporação (DD/MM/AAAA)',
    defaultWidth: 24,
    getValue: (c) => formatLocalDate(c.dataAdmissao) || '-'
  },
  {
    id: 'tempoCasa',
    label: 'Tempo de Casa',
    category: 'profissional',
    description: 'Período total trabalhado desde a admissão',
    defaultWidth: 22,
    getValue: (c) => calculateTenure(c.dataAdmissao)
  },
  {
    id: 'status',
    label: 'Status',
    category: 'profissional',
    description: 'Situação cadastral (Ativo / Inativo)',
    defaultWidth: 20,
    getValue: (c) => c.status || 'Ativo'
  },

  // 3. Contatos
  {
    id: 'email',
    label: 'E-mail Funcional',
    category: 'contato',
    description: 'Endereço eletrônico corporativo',
    defaultWidth: 42,
    getValue: (c) => c.email || '-'
  },
  {
    id: 'telefone',
    label: 'Telefone / WhatsApp',
    category: 'contato',
    description: 'Contato telefônico formatado',
    defaultWidth: 28,
    getValue: (c) => c.telefone ? formatTelefone(c.telefone) : '-'
  },

  // 4. Pessoal
  {
    id: 'dataNascimento',
    label: 'Data de Nascimento',
    category: 'pessoal',
    description: 'Data de aniversário (DD/MM/AAAA)',
    defaultWidth: 24,
    getValue: (c) => formatLocalDate(c.dataNascimento) || '-'
  },
  {
    id: 'idade',
    label: 'Idade',
    category: 'pessoal',
    description: 'Idade em anos calculada automaticamente',
    defaultWidth: 18,
    getValue: (c) => calculateAge(c.dataNascimento)
  }
];

// Presets for quick selection
export const DEFAULT_COLUMNS: ColumnKey[] = [
  'nomeCompleto',
  'cpf',
  'rg',
  'cargo',
  'setor',
  'empresaFilial',
  'dataAdmissao',
  'status'
];

export const PRESETS: { id: string; name: string; description: string; columns: ColumnKey[] }[] = [
  {
    id: 'padrao',
    name: 'Padrão Atual (8 colunas)',
    description: 'Nome, CPF, RG, Cargo, Setor, Empresa/Filial, Admissão e Status',
    columns: ['nomeCompleto', 'cpf', 'rg', 'cargo', 'setor', 'empresaFilial', 'dataAdmissao', 'status']
  },
  {
    id: 'completo',
    name: 'Completo Cadastral (12 colunas)',
    description: 'Dados pessoais, documentos, empresa, filial, admissão e tempo de casa',
    columns: ['nomeCompleto', 'cpf', 'rg', 'matricula', 'cargo', 'setor', 'empresa', 'filial', 'dataAdmissao', 'tempoCasa', 'idade', 'status']
  },
  {
    id: 'contatos',
    name: 'Contatos & Comunicação (7 colunas)',
    description: 'Nome, Crachá, Cargo, Setor, E-mail, Telefone e Filial',
    columns: ['nomeCompleto', 'exibicao', 'cargo', 'setor', 'email', 'telefone', 'filial']
  },
  {
    id: 'gestao',
    name: 'Gestão & Unidades (8 colunas)',
    description: 'Matrícula, Nome, Cargo, Setor, Empresa, Filial, Admissão e Status',
    columns: ['matricula', 'nomeCompleto', 'cargo', 'setor', 'empresa', 'filial', 'dataAdmissao', 'status']
  },
  {
    id: 'compacto',
    name: 'Compacto Executivo (6 colunas)',
    description: 'Nome, Cargo, Setor, Empresa/Filial, Admissão e Status',
    columns: ['nomeCompleto', 'cargo', 'setor', 'empresaFilial', 'dataAdmissao', 'status']
  }
];

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradores: Colaborador[];
  userSettings: { empresa: string };
  appliedFilters: {
    empresa?: string;
    setor: string;
    filial: string;
    status: string;
    search?: string;
  };
}

export function ExportPdfModal({
  isOpen,
  onClose,
  colaboradores,
  userSettings,
  appliedFilters
}: ExportPdfModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [reportTitle, setReportTitle] = useState('RELATÓRIO CONSOLIDADO DE COLABORADORES');
  const [includeFiltersSummary, setIncludeFiltersSummary] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'identificacao' | 'profissional' | 'contato' | 'pessoal'>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // Toggle single column
  const toggleColumn = (colId: ColumnKey) => {
    setSelectedColumns((prev) => {
      if (prev.includes(colId)) {
        if (prev.length <= 1) return prev; // Keep at least 1
        return prev.filter((id) => id !== colId);
      } else {
        return [...prev, colId];
      }
    });
  };

  // Quick Select All
  const handleSelectAll = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.map((c) => c.id));
  };

  // Quick Clear All (Leaves first column selected)
  const handleClearAll = () => {
    setSelectedColumns(['nomeCompleto']);
  };

  // Apply Preset
  const handleApplyPreset = (presetColumns: ColumnKey[]) => {
    setSelectedColumns(presetColumns);
    if (presetColumns.length > 6) {
      setOrientation('landscape');
    }
  };

  // Reset to default
  const handleResetDefault = () => {
    setSelectedColumns(DEFAULT_COLUMNS);
    setOrientation('landscape');
    setReportTitle('RELATÓRIO CONSOLIDADO DE COLABORADORES');
    setIncludeFiltersSummary(true);
  };

  // Filter columns by active category tab
  const displayedColumns = useMemo(() => {
    if (activeTab === 'all') return AVAILABLE_COLUMNS;
    return AVAILABLE_COLUMNS.filter((col) => col.category === activeTab);
  }, [activeTab]);

  // Selected column objects in EXACT active order
  const activeColumnDefs = useMemo(() => {
    const colMap = new Map(AVAILABLE_COLUMNS.map((col) => [col.id, col]));
    return selectedColumns
      .map((id) => colMap.get(id))
      .filter((col): col is ColumnDefinition => Boolean(col));
  }, [selectedColumns]);

  // Reordering functions
  const moveColumnLeft = (index: number) => {
    if (index <= 0) return;
    setSelectedColumns((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveColumnRight = (index: number) => {
    if (index >= selectedColumns.length - 1) return;
    setSelectedColumns((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Sort alphabetically
  const handleSortAlphabetically = () => {
    setSelectedColumns((prev) => {
      const colMap = new Map(AVAILABLE_COLUMNS.map((col) => [col.id, col]));
      return [...prev].sort((a, b) => {
        const labelA = colMap.get(a)?.label || '';
        const labelB = colMap.get(b)?.label || '';
        return labelA.localeCompare(labelB, 'pt-BR');
      });
    });
  };

  // Sort by default catalog order
  const handleSortByDefaultCatalog = () => {
    const catalogOrder = AVAILABLE_COLUMNS.map((c) => c.id);
    setSelectedColumns((prev) => {
      return [...prev].sort((a, b) => catalogOrder.indexOf(a) - catalogOrder.indexOf(b));
    });
  };

  // Drag and Drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    setSelectedColumns((prev) => {
      const next = [...prev];
      const [movedItem] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, movedItem);
      return next;
    });
    setDraggedIndex(null);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: AVAILABLE_COLUMNS.length,
      identificacao: AVAILABLE_COLUMNS.filter((c) => c.category === 'identificacao').length,
      profissional: AVAILABLE_COLUMNS.filter((c) => c.category === 'profissional').length,
      contato: AVAILABLE_COLUMNS.filter((c) => c.category === 'contato').length,
      pessoal: AVAILABLE_COLUMNS.filter((c) => c.category === 'pessoal').length
    };
    return counts;
  }, []);

  // Category selected counts
  const categorySelectedCounts = useMemo(() => {
    return {
      identificacao: AVAILABLE_COLUMNS.filter((c) => c.category === 'identificacao' && selectedColumns.includes(c.id)).length,
      profissional: AVAILABLE_COLUMNS.filter((c) => c.category === 'profissional' && selectedColumns.includes(c.id)).length,
      contato: AVAILABLE_COLUMNS.filter((c) => c.category === 'contato' && selectedColumns.includes(c.id)).length,
      pessoal: AVAILABLE_COLUMNS.filter((c) => c.category === 'pessoal' && selectedColumns.includes(c.id)).length
    };
  }, [selectedColumns]);

  // Generate PDF
  const handleGeneratePdf = () => {
    if (selectedColumns.length === 0 || colaboradores.length === 0) return;
    setIsGenerating(true);

    try {
      const isLandscape = orientation === 'landscape';
      const doc = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
      const pageWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;
      const today = new Date().toLocaleDateString('pt-BR');

      // 1. Header Banner - Elegant Blue Accent
      doc.setFillColor(14, 165, 233); // Sky Blue #0EA5E9
      doc.rect(0, 0, pageWidth, 38, 'F');

      // 2. Header Content
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(userSettings.empresa.toUpperCase(), 14, 16);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(reportTitle.toUpperCase(), 14, 24);

      doc.setFontSize(9);
      doc.text(`Data de Emissão: ${today} | Colaboradores Listados: ${colaboradores.length} | Colunas: ${activeColumnDefs.length}`, 14, 30);

      // 3. Filter info line (if requested)
      let startTableY = 44;
      if (includeFiltersSummary) {
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        
        const filterTexts: string[] = [];
        if (appliedFilters.empresa && appliedFilters.empresa !== 'Todos') filterTexts.push(`Empresa: ${appliedFilters.empresa}`);
        if (appliedFilters.setor && appliedFilters.setor !== 'Todos') filterTexts.push(`Setor: ${appliedFilters.setor}`);
        if (appliedFilters.filial && appliedFilters.filial !== 'Todos') filterTexts.push(`Filial: ${appliedFilters.filial}`);
        if (appliedFilters.status && appliedFilters.status !== 'Todos') filterTexts.push(`Status: ${appliedFilters.status}`);
        if (appliedFilters.search && appliedFilters.search.trim()) filterTexts.push(`Busca: "${appliedFilters.search}"`);

        const filterSummaryStr = filterTexts.length > 0
          ? `Filtros Aplicados: ${filterTexts.join(' | ')}`
          : 'Filtros: Todos os registros ativos e inativos';

        doc.text(filterSummaryStr, 14, startTableY);
        startTableY += 6;
      }

      // 4. Prepare Headers & Rows
      const tableHeaders = [activeColumnDefs.map((col) => col.label)];
      const tableRows = colaboradores.map((c) => {
        return activeColumnDefs.map((col) => col.getValue(c));
      });

      // 5. Dynamic column widths calculation to fit nicely
      const totalRequestedWidth = activeColumnDefs.reduce((acc, col) => acc + col.defaultWidth, 0);
      const availableTableWidth = pageWidth - 28; // Margins: 14 left, 14 right
      const widthScaleFactor = availableTableWidth / totalRequestedWidth;

      const columnStylesConfig: { [key: number]: { cellWidth: number; halign?: 'left' | 'center' | 'right' } } = {};
      activeColumnDefs.forEach((col, idx) => {
        const adjustedWidth = Math.max(16, Math.round(col.defaultWidth * widthScaleFactor));
        columnStylesConfig[idx] = { 
          cellWidth: adjustedWidth,
          halign: (col.id === 'status' || col.id === 'idade' || col.id === 'matricula' || col.id === 'tempoCasa' || col.id === 'dataAdmissao' || col.id === 'dataNascimento') 
            ? 'center' 
            : 'left'
        };
      });

      // 6. Font size adjustment based on number of columns
      const dynamicFontSize = activeColumnDefs.length > 10 ? 7.5 : activeColumnDefs.length > 7 ? 8.5 : 9;
      const dynamicHeaderFontSize = activeColumnDefs.length > 10 ? 8 : activeColumnDefs.length > 7 ? 9 : 9.5;

      // 7. Render AutoTable
      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: startTableY,
        theme: 'striped',
        pageBreak: 'auto',
        rowPageBreak: 'auto',
        showHead: 'everyPage',
        styles: {
          overflow: 'linebreak',
          cellPadding: 2,
          valign: 'middle',
          fontSize: dynamicFontSize,
          textColor: [15, 23, 42],
          cellWidth: 'auto',
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [14, 165, 233], // Blue
          textColor: [255, 255, 255],
          fontSize: dynamicHeaderFontSize,
          fontStyle: 'bold',
          halign: 'left',
          valign: 'middle',
          cellPadding: 2.5
        },
        bodyStyles: {
          fontSize: dynamicFontSize,
          textColor: [15, 23, 42],
          cellPadding: 2,
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate-50
        },
        columnStyles: columnStylesConfig,
        margin: { top: 16, left: 14, right: 14, bottom: 16 },
        didDrawPage: (data) => {
          // Footer
          const str = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // Slate-400
          doc.text(
            `${userSettings.empresa} - Sistema Integrado de Gestão`,
            14,
            pageHeight - 8
          );
          doc.text(str, pageWidth - 14 - doc.getTextWidth(str), pageHeight - 8);
        }
      });

      // 8. Save and download
      const cleanFileName = `relatorio-colaboradores-${userSettings.empresa.toLowerCase().replace(/\s+/g, '-')}-${today.replace(/\//g, '-')}.pdf`;
      doc.save(cleanFileName);
      onClose();
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-natural-border shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-pdf-modal-title"
      >
        {/* MODAL HEADER */}
        <div className="p-5 md:p-6 border-b border-natural-border bg-gradient-to-r from-natural-light via-white to-sky-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500 text-white rounded-2xl shadow-xs">
              <FileDown size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="export-pdf-modal-title" className="font-serif italic font-bold text-natural-text text-xl">
                  Customizar Relatório PDF
                </h2>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200 font-mono">
                  {selectedColumns.length} de {AVAILABLE_COLUMNS.length} colunas
                </span>
              </div>
              <p className="text-xs text-natural-muted mt-0.5">
                Selecione as colunas desejadas, configure a orientação e exporte o documento customizado.
              </p>
            </div>
          </div>

          <button
            id="close-export-pdf-modal-btn"
            onClick={onClose}
            className="text-natural-muted hover:text-natural-text hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
            title="Fechar janela"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* PRESETS QUICK SELECTOR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-sky-500" />
                Modelos Rápidos Pré-configurados
              </span>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw size={11} />
                Restaurar Padrão
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PRESETS.map((preset) => {
                const isCurrent = 
                  selectedColumns.length === preset.columns.length &&
                  preset.columns.every((c) => selectedColumns.includes(c));

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.columns)}
                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-200/60 shadow-xs'
                        : 'bg-natural-light/60 hover:bg-natural-light border-natural-border hover:border-sky-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isCurrent ? 'text-sky-900' : 'text-natural-text'}`}>
                          {preset.name}
                        </span>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-natural-muted leading-snug line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMNS SELECTION SECTION */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-natural-border">
              <span className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-sky-500" />
                Selecione as Colunas para Impressão
              </span>

              {/* Quick actions for all */}
              <div className="flex items-center space-x-3 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare size={13} />
                  Selecionar Todas ({AVAILABLE_COLUMNS.length})
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-500 hover:text-slate-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Square size={13} />
                  Limpar
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-natural-text text-white font-bold shadow-xs'
                    : 'bg-natural-light text-natural-muted hover:text-natural-text border border-natural-border'
                }`}
              >
                Todas ({categoryCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('identificacao')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'identificacao'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-natural-light text-natural-muted hover:text-natural-text border border-natural-border'
                }`}
              >
                <User size={12} />
                <span>Identificação</span>
                <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                  {categorySelectedCounts.identificacao}/{categoryCounts.identificacao}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('profissional')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'profissional'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-natural-light text-natural-muted hover:text-natural-text border border-natural-border'
                }`}
              >
                <Building size={12} />
                <span>Profissional</span>
                <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                  {categorySelectedCounts.profissional}/{categoryCounts.profissional}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contato')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'contato'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-natural-light text-natural-muted hover:text-natural-text border border-natural-border'
                }`}
              >
                <Phone size={12} />
                <span>Contatos</span>
                <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                  {categorySelectedCounts.contato}/{categoryCounts.contato}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pessoal')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'pessoal'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-natural-light text-natural-muted hover:text-natural-text border border-natural-border'
                }`}
              >
                <Calendar size={12} />
                <span>Pessoal / Idade</span>
                <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                  {categorySelectedCounts.pessoal}/{categoryCounts.pessoal}
                </span>
              </button>
            </div>

            {/* Grid of Columns Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {displayedColumns.map((col) => {
                const isSelected = selectedColumns.includes(col.id);
                const orderIndex = selectedColumns.indexOf(col.id);

                return (
                  <div
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-200 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-natural-border opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-md bg-sky-500 text-white flex items-center justify-center">
                          <CheckCircle2 size={13} className="stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-md border border-slate-300 bg-white" />
                      )}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-natural-text' : 'text-slate-600'}`}>
                          {col.label}
                        </span>
                        {isSelected ? (
                          <span className="text-[9px] text-sky-800 bg-sky-100 font-bold px-1.5 py-0.2 rounded font-mono shrink-0 border border-sky-200">
                            #{orderIndex + 1}
                          </span>
                        ) : DEFAULT_COLUMNS.includes(col.id) ? (
                          <span className="text-[9px] text-slate-500 bg-slate-100 font-semibold px-1.5 py-0.2 rounded shrink-0">
                            Padrão
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-natural-muted leading-tight line-clamp-1">
                        {col.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ORDEM DAS COLUNAS NO RELATÓRIO (DRAG & DROP / ARROWS / SORT) */}
          <div className="bg-gradient-to-br from-sky-50/50 via-white to-sky-50/20 border border-sky-200/80 rounded-2xl p-4 md:p-5 space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-sky-100">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ListOrdered size={14} className="text-sky-600" />
                  Ordem das Colunas no PDF ({selectedColumns.length})
                </span>
                <p className="text-[11px] text-natural-muted">
                  Ordem de impressão da esquerda para a direita. Use as setas <strong>◀ ▶</strong> ou arraste as etiquetas para reposicionar.
                </p>
              </div>

              {/* Quick sort actions */}
              <div className="flex items-center space-x-2 text-xs shrink-0">
                <button
                  type="button"
                  onClick={handleSortByDefaultCatalog}
                  className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 font-semibold rounded-lg border border-sky-200 inline-flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                  title="Restaurar a ordem cadastral recomendada"
                >
                  <RotateCcw size={11} />
                  Ordem Padrão
                </button>
                <button
                  type="button"
                  onClick={handleSortAlphabetically}
                  className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 font-semibold rounded-lg border border-sky-200 inline-flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                  title="Ordenar colunas em ordem alfabética (A-Z)"
                >
                  <ArrowUpDown size={11} />
                  Ordem A-Z
                </button>
              </div>
            </div>

            {/* List of reorderable column badges / cards */}
            <div className="flex flex-wrap gap-2 pt-1">
              {activeColumnDefs.map((col, index) => {
                const isFirst = index === 0;
                const isLast = index === selectedColumns.length - 1;
                const isDragged = draggedIndex === index;

                return (
                  <div
                    key={col.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`group inline-flex items-center bg-white border rounded-xl pl-2 pr-1.5 py-1.5 shadow-2xs transition-all select-none cursor-grab active:cursor-grabbing ${
                      isDragged
                        ? 'opacity-40 border-dashed border-sky-500 scale-95'
                        : 'border-slate-200 hover:border-sky-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Drag Grip + Sequence Number */}
                    <div className="flex items-center space-x-1 mr-1.5">
                      <GripVertical size={13} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold flex items-center justify-center font-mono">
                        {index + 1}
                      </span>
                    </div>

                    {/* Column Label */}
                    <span className="text-xs font-semibold text-natural-text mr-2 truncate max-w-[130px] sm:max-w-[170px]" title={col.label}>
                      {col.label}
                    </span>

                    {/* Reorder Buttons */}
                    <div className="flex items-center space-x-0.5 ml-auto border-l border-slate-100 pl-1.5">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveColumnLeft(index);
                        }}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isFirst
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50 active:scale-95'
                        }`}
                        title="Mover para a esquerda (mais cedo no relatório)"
                      >
                        <ChevronLeft size={13} />
                      </button>

                      <button
                        type="button"
                        disabled={isLast}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveColumnRight(index);
                        }}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isLast
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50 active:scale-95'
                        }`}
                        title="Mover para a direita (mais tarde no relatório)"
                      >
                        <ChevronRight size={13} />
                      </button>

                      {/* Remove Button */}
                      {selectedColumns.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleColumn(col.id);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-0.5"
                          title="Remover coluna do relatório"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PAGE CONFIGURATION & LAYOUT OPTIONS */}
          <div className="bg-natural-light/60 border border-natural-border rounded-2xl p-4 md:p-5 space-y-4">
            <span className="text-[11px] font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-sky-500" />
              Configurações de Layout da Página
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Orientation selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-natural-text block">
                  Orientação da Página (A4)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-white border-sky-400 ring-2 ring-sky-200/60 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-natural-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-natural-text">Paisagem</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">Horizontal</span>
                    </div>
                    <p className="text-[10px] text-natural-muted">
                      Recomendado para 6 ou mais colunas selecionadas.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-white border-sky-400 ring-2 ring-sky-200/60 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-natural-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-natural-text">Retrato</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">Vertical</span>
                    </div>
                    <p className="text-[10px] text-natural-muted">
                      Ideal para relatórios com poucas colunas (até 5).
                    </p>
                  </button>
                </div>
              </div>

              {/* Title and summary options */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="input-report-title" className="text-xs font-semibold text-natural-text block">
                    Título do Documento
                  </label>
                  <input
                    id="input-report-title"
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full bg-white border border-natural-border rounded-xl px-3 py-2 text-xs font-medium text-natural-text focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                    placeholder="Nome do relatório..."
                  />
                </div>

                <label className="flex items-center space-x-2 text-xs text-natural-text cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={includeFiltersSummary}
                    onChange={(e) => setIncludeFiltersSummary(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <span>Imprimir resumo dos filtros ativos no cabeçalho</span>
                </label>
              </div>

            </div>

            {/* Validation warning if portrait with too many columns */}
            {orientation === 'portrait' && selectedColumns.length > 7 && (
              <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                <p>
                  Você selecionou <strong>{selectedColumns.length} colunas</strong> no formato <strong>Retrato (Vertical)</strong>. Para garantir a melhor legibilidade sem truncamento, sugerimos alternar para <strong>Paisagem (Horizontal)</strong>.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 md:p-5 border-t border-natural-border bg-natural-light/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-natural-muted text-center sm:text-left">
            Total de <strong>{colaboradores.length} colaboradores</strong> serão exportados com <strong>{selectedColumns.length} colunas</strong>.
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              id="cancel-export-pdf-btn"
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-full border border-natural-border bg-white hover:bg-slate-50 text-natural-text font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="confirm-generate-pdf-btn"
              type="button"
              disabled={selectedColumns.length === 0 || isGenerating}
              onClick={handleGeneratePdf}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-full text-white font-semibold text-xs inline-flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs ${
                selectedColumns.length === 0 || isGenerating
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-600 active:scale-98'
              }`}
            >
              <FileDown size={15} />
              <span>{isGenerating ? 'Gerando Documento...' : 'Gerar e Baixar PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
