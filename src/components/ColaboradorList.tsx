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
  Filter,
  Users
} from 'lucide-react';
import { Colaborador } from '../types';
import { SETORES, formatLocalDate } from '../data';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ColaboradorListProps {
  colaboradores: Colaborador[];
  searchQuery: string;
  onEdit: (colaborador: Colaborador) => void;
  onDelete: (id: string) => void;
  userSettings: { empresa: string };
  onAddNew: () => void;
}

type SortField = 'nomeCompleto' | 'cargo' | 'setor' | 'dataAdmissao';
type SortOrder = 'asc' | 'desc';

export default function ColaboradorList({
  colaboradores,
  searchQuery,
  onEdit,
  onDelete,
  userSettings,
  onAddNew,
}: ColaboradorListProps) {
  // Filters state
  const [selectedSector, setSelectedSector] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('nomeCompleto');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Detail Modal / Panel for single Colaborador
  const [activeDetailsColab, setActiveDetailsColab] = useState<Colaborador | null>(null);

  // Filter & Sort collaborateurs
  const filteredAndSortedColaboradores = useMemo(() => {
    let result = [...colaboradores];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.nomeCompleto.toLowerCase().includes(q) ||
          c.exibicao.toLowerCase().includes(q) ||
          c.cpf.includes(q) ||
          c.rg.includes(q) ||
          c.cargo.toLowerCase().includes(q) ||
          c.setor.toLowerCase().includes(q) ||
          (c.empresa && c.empresa.toLowerCase().includes(q)) ||
          (c.filial && c.filial.toLowerCase().includes(q))
      );
    }

    // 2. Sector Filter
    if (selectedSector !== 'Todos') {
      result = result.filter((c) => c.setor === selectedSector);
    }

    // 3. Status Filter
    if (selectedStatus !== 'Todos') {
      result = result.filter((c) => c.status === selectedStatus);
    }

    // 4. Sorting
    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      
      if (sortField === 'dataAdmissao') {
        valA = new Date(valA).getTime().toString();
        valB = new Date(valB).getTime().toString();
      }

      if (sortOrder === 'asc') {
        return valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
      } else {
        return valB.localeCompare(valA, 'pt-BR', { sensitivity: 'base' });
      }
    });

    return result;
  }, [colaboradores, searchQuery, selectedSector, selectedStatus, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
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
    doc.text(`Filtros Aplicados - Setor: ${selectedSector} | Status: ${selectedStatus}`, 15, 48);

    // Prepare table data
    const tableHeaders = [['Nome Completo', 'CPF', 'RG', 'Cargo', 'Setor', 'Empresa / Filial', 'Admissão', 'Status']];
    const tableRows = filteredAndSortedColaboradores.map((c) => [
      c.nomeCompleto,
      c.cpf,
      c.rg,
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
    doc.text(c.telefone || 'Não informado', 52, 200);

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

        <div className="flex items-center space-x-2.5 shrink-0">
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
            onClick={exportFullListPDF}
            className={`font-semibold text-xs py-2.5 px-5 rounded-full inline-flex items-center space-x-2 transition-all cursor-pointer border ${
              filteredAndSortedColaboradores.length === 0
                ? 'bg-natural-light border-natural-border text-natural-muted cursor-not-allowed'
                : 'bg-white hover:bg-natural-light text-natural-text border-natural-border shadow-xs'
            }`}
          >
            <FileDown size={14} />
            <span>Exportar Lista (PDF)</span>
          </button>
        </div>
      </div>

      {/* Advanced Quick Filters Panel */}
      <div className="bg-white border border-natural-border rounded-2xl p-4 md:p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-natural-text font-bold text-xs uppercase tracking-wider">
          <Filter size={14} className="text-natural-primary" />
          <span>Filtros Rápidos</span>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {/* Sector Selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">Setor Corporativo</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                id="filter-sector-todos"
                onClick={() => setSelectedSector('Todos')}
                className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  selectedSector === 'Todos'
                    ? 'bg-natural-accent/30 border-natural-accent text-natural-primary font-semibold'
                    : 'bg-natural-light border-natural-border text-natural-text hover:bg-natural-light-gray'
                }`}
              >
                Todos Setores
              </button>
              {SETORES.map((sec) => (
                <button
                  key={sec}
                  id={`filter-sector-${sec.toLowerCase()}`}
                  onClick={() => setSelectedSector(sec)}
                  className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    selectedSector === sec
                      ? 'bg-natural-accent/30 border-natural-accent text-natural-primary font-semibold'
                      : 'bg-natural-light border-natural-border text-natural-text hover:bg-natural-light-gray'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1 min-w-[150px]">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">Status</span>
            <div className="flex gap-1.5">
              {['Todos', 'Ativo', 'Inativo'].map((st) => (
                <button
                  key={st}
                  id={`filter-status-${st.toLowerCase()}`}
                  onClick={() => setSelectedStatus(st)}
                  className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all cursor-pointer flex-1 text-center ${
                    selectedStatus === st
                      ? 'bg-natural-accent/30 border-natural-accent text-natural-primary font-semibold'
                      : 'bg-natural-light border-natural-border text-natural-text hover:bg-natural-light-gray'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Directory Counters */}
      <div className="flex items-center justify-between text-xs text-natural-muted font-medium">
        <span>
          Mostrando <span className="font-semibold text-natural-text">{filteredAndSortedColaboradores.length}</span> de <span className="font-semibold text-natural-text">{colaboradores.length}</span> cadastrados
        </span>
        {searchQuery && (
          <span>
            Filtro de pesquisa ativo para: <span className="text-natural-primary font-semibold italic">"{searchQuery}"</span>
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
                    <th className="py-4 px-5">Colaborador</th>
                    <th className="py-4 px-4 cursor-pointer hover:bg-natural-light/50 transition-colors" onClick={() => handleSort('cargo')}>
                      <div className="flex items-center space-x-1">
                        <span>Cargo</span>
                        <ArrowUpDown size={12} className="text-natural-muted" />
                      </div>
                    </th>
                    <th className="py-4 px-4 cursor-pointer hover:bg-natural-light/50 transition-colors" onClick={() => handleSort('setor')}>
                      <div className="flex items-center space-x-1">
                        <span>Setor</span>
                        <ArrowUpDown size={12} className="text-natural-muted" />
                      </div>
                    </th>
                    <th className="py-4 px-4">Documentos (CPF / RG)</th>
                    <th className="py-4 px-4">Data Nasc.</th>
                    <th className="py-4 px-4">Status</th>
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
                            <span className="text-[11px] text-natural-muted block mt-0.5 font-medium">
                              Ref: {c.exibicao} {c.empresa && `| ${c.empresa} (${c.filial})`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cargo */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-natural-text">{c.cargo}</span>
                      </td>

                      {/* Setor */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-natural-light text-natural-primary border border-natural-border">
                          {c.setor}
                        </span>
                      </td>

                      {/* Credentials */}
                      <td className="py-3.5 px-4 space-y-0.5 font-mono text-[11px] text-natural-muted">
                        <div className="block"><span className="text-natural-muted font-sans">CPF:</span> {c.cpf}</div>
                        <div className="block"><span className="text-natural-muted font-sans">RG:</span> {c.rg}</div>
                      </td>

                      {/* Birth Date */}
                      <td className="py-3.5 px-4 text-natural-muted font-medium">
                        {formatLocalDate(c.dataNascimento)}
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
                      <span className="text-[11px] text-natural-muted block">
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
                    <span className="text-natural-muted block font-medium">Nascimento</span>
                    <span className="font-semibold text-natural-text block">{formatLocalDate(c.dataNascimento)}</span>
                  </div>
                  <div>
                    <span className="text-natural-muted block font-medium">CPF</span>
                    <span className="font-mono text-natural-text block">{c.cpf}</span>
                  </div>
                  <div>
                    <span className="text-natural-muted block font-medium">RG</span>
                    <span className="font-mono text-natural-text block">{c.rg}</span>
                  </div>
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
                    <span className="font-mono font-semibold text-natural-text">{activeDetailsColab.rg}</span>
                  </div>
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
                  <div className="flex items-center space-x-2 text-natural-text py-0.5">
                    <Phone size={13} className="text-natural-primary shrink-0" />
                    <span className="text-natural-muted font-medium">Telefone:</span>
                    <span className="font-semibold text-natural-text flex-1 text-right">{activeDetailsColab.telefone || 'Não informado'}</span>
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

    </div>
  );
}
