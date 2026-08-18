import React, { useMemo, useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  Calendar, 
  Layers, 
  TrendingUp, 
  UserPlus2, 
  UserCheck2,
  Building2,
  Store,
  MapPin,
  BarChart3,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import { Colaborador } from '../types';

interface DashboardProps {
  colaboradores: Colaborador[];
  onAddClick: () => void;
}

// Preset distinct brand colors for companies
const EMPRESA_COLORS: { [key: string]: string } = {
  'Bio Brands': '#0EA5E9',       // Sky Blue
  'Bio Scientific': '#10B981',   // Emerald Green
  'Terceiros': '#8B5CF6',        // Violet Purple
  'Não Informada': '#94A3B8',    // Slate Gray
  'Outras': '#F59E0B'            // Amber
};

const COLOR_PALETTE = ['#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];

export default function Dashboard({ colaboradores, onAddClick }: DashboardProps) {
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('all');
  const [chartLayoutMode, setChartLayoutMode] = useState<'stacked' | 'grouped'>('stacked');
  const [secondaryViewTab, setSecondaryViewTab] = useState<'empresa' | 'filial' | 'status'>('empresa');

  // Stat calculations
  const stats = useMemo(() => {
    const total = colaboradores.length;
    const colaboradoresAtivos = colaboradores.filter(c => c.status === 'Ativo');
    const ativos = colaboradoresAtivos.length;
    const inativos = total - ativos;
    
    // Average age calculation on active collaborators
    let avgAge = 0;
    if (colaboradoresAtivos.length > 0) {
      const ages = colaboradoresAtivos.map(c => {
        if (!c.dataNascimento) return 0;
        const birthDate = new Date(c.dataNascimento);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
      }).filter(age => age > 0);
      
      if (ages.length > 0) {
        avgAge = Math.round(ages.reduce((sum, a) => sum + a, 0) / ages.length);
      }
    }

    // 1. Discover all unique companies among active collaborators
    const empresasSet = new Set<string>();
    colaboradoresAtivos.forEach(c => {
      const emp = (c.empresa || '').trim();
      empresasSet.add(emp || 'Não Informada');
    });

    const empresasList = Array.from(empresasSet).sort((a, b) => {
      if (a === 'Bio Brands') return -1;
      if (b === 'Bio Brands') return 1;
      if (a === 'Bio Scientific') return -1;
      if (b === 'Bio Scientific') return 1;
      return a.localeCompare(b);
    });

    // Summary counts per company (active only)
    const activePerEmpresa: { [empresa: string]: number } = {};
    empresasList.forEach(emp => {
      activePerEmpresa[emp] = colaboradoresAtivos.filter(c => ((c.empresa || '').trim() || 'Não Informada') === emp).length;
    });

    // Empresa chart data for pie/donut
    const empresaChartData = empresasList.map((emp, index) => ({
      name: emp,
      value: activePerEmpresa[emp] || 0,
      color: EMPRESA_COLORS[emp] || COLOR_PALETTE[index % COLOR_PALETTE.length]
    })).filter(item => item.value > 0);

    // 2. Discover all unique filiais among active collaborators
    const filialMap: { [filial: string]: { total: number; empresa: string } } = {};
    colaboradoresAtivos.forEach(c => {
      const filialName = (c.filial || '').trim() || 'Matriz / Sede';
      const empresaName = (c.empresa || '').trim() || 'Não Informada';
      if (!filialMap[filialName]) {
        filialMap[filialName] = { total: 0, empresa: empresaName };
      }
      filialMap[filialName].total += 1;
    });

    const filialChartData = Object.keys(filialMap).map(filial => ({
      name: filial,
      quantidade: filialMap[filial].total,
      empresa: filialMap[filial].empresa
    })).sort((a, b) => b.quantidade - a.quantidade);

    const totalFiliaisAtivas = filialChartData.length;
    const topFilial = filialChartData[0] || null;

    // 3. Sector Distribution Data - FILTERED STRICTLY BY ACTIVE EMPLOYEES AND SEPARATED BY COMPANY
    const sectorMap: { 
      [sector: string]: { 
        totalAtivos: number; 
        byEmpresa: { [empresa: string]: number };
      } 
    } = {};

    colaboradoresAtivos.forEach(c => {
      const sector = (c.setor || '').trim() || 'Não Definido';
      const empresa = (c.empresa || '').trim() || 'Não Informada';

      if (!sectorMap[sector]) {
        sectorMap[sector] = {
          totalAtivos: 0,
          byEmpresa: {}
        };
        empresasList.forEach(emp => {
          sectorMap[sector].byEmpresa[emp] = 0;
        });
      }

      sectorMap[sector].byEmpresa[empresa] = (sectorMap[sector].byEmpresa[empresa] || 0) + 1;
      sectorMap[sector].totalAtivos += 1;
    });

    // Build chart data formatted for Recharts
    const sectorChartData = Object.keys(sectorMap).map(sector => {
      const row: Record<string, string | number> = {
        name: sector,
        totalAtivos: sectorMap[sector].totalAtivos
      };

      empresasList.forEach(emp => {
        row[emp] = sectorMap[sector].byEmpresa[emp] || 0;
      });

      return row;
    }).sort((a, b) => (b.totalAtivos as number) - (a.totalAtivos as number));

    // Filtered sector chart data when a single company is selected
    const filteredSectorChartData = selectedEmpresa === 'all'
      ? sectorChartData
      : sectorChartData
          .map(item => ({
            name: item.name,
            totalAtivos: (item[selectedEmpresa] as number) || 0,
            [selectedEmpresa]: (item[selectedEmpresa] as number) || 0
          }))
          .filter(item => item.totalAtivos > 0)
          .sort((a, b) => b.totalAtivos - a.totalAtivos);

    // Active sectors count
    const totalSetoresAtivos = Object.keys(sectorMap).length;

    // Status Distribution Data
    const statusChartData = [
      { name: 'Ativo', value: ativos },
      { name: 'Inativo', value: inativos }
    ].filter(item => item.value > 0);

    return {
      total,
      ativos,
      inativos,
      avgAge,
      empresasList,
      activePerEmpresa,
      empresaChartData,
      filialChartData,
      totalFiliaisAtivas,
      topFilial,
      sectorMap,
      sectorChartData,
      filteredSectorChartData,
      totalSetoresAtivos,
      statusChartData,
      topActiveSector: sectorChartData[0] || null
    };
  }, [colaboradores, selectedEmpresa]);

  // Colors for Pie Chart
  const STATUS_COLORS = ['#10B981', '#94A3B8']; // Emerald for Active, Slate for Inactive

  // Helper to get company color
  const getEmpresaColor = (empresa: string, index: number) => {
    return EMPRESA_COLORS[empresa] || COLOR_PALETTE[index % COLOR_PALETTE.length];
  };

  if (colaboradores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-white rounded-2xl border border-natural-border p-8 shadow-xs">
        <div className="p-4 bg-natural-light text-natural-primary rounded-full mb-4 border border-natural-border">
          <Users size={48} />
        </div>
        <h2 className="font-serif italic font-bold text-natural-text text-xl tracking-tight mb-2">
          Nenhum colaborador cadastrado
        </h2>
        <p className="text-natural-muted max-w-sm text-sm mb-6 leading-relaxed">
          Cadastre os primeiros funcionários da empresa para visualizar as estatísticas e gráficos da equipe.
        </p>
        <button
          id="dashboard-first-colab-btn"
          onClick={onAddClick}
          className="bg-natural-primary hover:bg-natural-hover text-white font-medium text-sm py-2.5 px-5 rounded-full inline-flex items-center space-x-2 transition-all cursor-pointer"
        >
          <UserPlus2 size={16} />
          <span>Adicionar Primeiro Colaborador</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif italic font-bold text-natural-text text-2xl tracking-tight">
            Painel Geral
          </h1>
          <p className="text-sm text-natural-muted">
            Visão analítica em tempo real da distribuição dos colaboradores da empresa.
          </p>
        </div>
        
        <button
          id="dashboard-new-colab-btn"
          onClick={onAddClick}
          className="bg-natural-primary hover:bg-natural-hover text-white font-medium text-xs py-2.5 px-5 rounded-full inline-flex items-center space-x-2 transition-all shrink-0 shadow-xs cursor-pointer"
        >
          <UserPlus2 size={14} />
          <span>Novo Cadastro</span>
        </button>
      </div>

      {/* KPI Stats Cards - Colaboradores Ativos primeiro, Colaboradores por Empresa, Colaboradores por Filial, Média de Idade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* KPI 1 (PRIMEIRO): Colaboradores Ativos */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="space-y-1.5 pl-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">
              Colaboradores Ativos
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-light text-natural-text block font-mono">
                {stats.ativos}
              </span>
              <span className="text-xs text-natural-muted font-normal">
                / {stats.total} total
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {stats.total > 0 ? `${Math.round((stats.ativos / stats.total) * 100)}%` : '0%'} da equipe em atividade
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <UserCheck2 size={24} />
          </div>
        </div>

        {/* KPI 2: Colaboradores por Empresa */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
              Colaboradores por Empresa
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-light text-natural-text block font-mono">
                {stats.empresasList.length}
              </span>
              <span className="text-xs text-natural-muted font-normal">
                {stats.empresasList.length === 1 ? 'empresa' : 'empresas'}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-1 text-[10px] text-natural-muted">
              {stats.empresasList.slice(0, 2).map((emp, i) => (
                <span key={emp} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getEmpresaColor(emp, i) }} />
                  {emp.split(' ')[0]}: {stats.activePerEmpresa[emp] || 0}
                </span>
              ))}
              {stats.empresasList.length > 2 && (
                <span className="text-[10px] text-slate-500 font-medium">+{stats.empresasList.length - 2}</span>
              )}
            </div>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <Building2 size={24} />
          </div>
        </div>

        {/* KPI 3: Colaboradores por Filial */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
              Colaboradores por Filial
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-light text-natural-text block font-mono">
                {stats.totalFiliaisAtivas}
              </span>
              <span className="text-xs text-natural-muted font-normal">
                {stats.totalFiliaisAtivas === 1 ? 'unidade ativa' : 'unidades ativas'}
              </span>
            </div>
            <span className="text-[10px] text-natural-muted font-medium block truncate max-w-[170px]" title={stats.topFilial ? `${stats.topFilial.name}: ${stats.topFilial.quantidade} ativos` : 'Nenhuma'}>
              {stats.topFilial ? `Principal: ${stats.topFilial.name} (${stats.topFilial.quantidade})` : 'Sem filiais ativas'}
            </span>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl border border-violet-100">
            <Store size={24} />
          </div>
        </div>

        {/* KPI 4: Média de Idade */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
              Média de Idade
            </span>
            <span className="text-3xl font-light text-natural-text block font-mono">
              {stats.avgAge} <span className="text-sm font-normal text-natural-muted">anos</span>
            </span>
            <span className="text-[10px] text-natural-muted font-medium block">
              Colaboradores em atividade
            </span>
          </div>
          <div className="p-3 bg-natural-light text-natural-primary rounded-xl border border-natural-light-gray">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sector Bar Chart (Separated by Empresa & Filtered for Active Only) - taking 7/12 cols */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-natural-border shadow-xs lg:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            {/* Header with Title & Active Filter Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif italic font-bold text-natural-text text-sm md:text-base">
                    Distribuição por Setor
                  </h3>
                  {/* Explicit Active Filter Badge */}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Somente Ativos
                  </span>
                </div>
                <p className="text-[11px] text-natural-muted mt-0.5">
                  Quantidade de colaboradores <strong className="text-emerald-700 font-medium">ativos</strong> por setor e empresa.
                </p>
              </div>

              {/* View layout mode toggle when viewing all companies */}
              {selectedEmpresa === 'all' && stats.empresasList.length > 1 && (
                <div className="flex items-center bg-natural-light p-0.5 rounded-lg border border-natural-border shrink-0 self-start sm:self-auto text-[11px]">
                  <button
                    id="chart-mode-stacked"
                    onClick={() => setChartLayoutMode('stacked')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      chartLayoutMode === 'stacked' 
                        ? 'bg-white text-natural-primary shadow-xs font-semibold' 
                        : 'text-natural-muted hover:text-natural-text'
                    }`}
                    title="Visualização Empilhada"
                  >
                    Empilhado
                  </button>
                  <button
                    id="chart-mode-grouped"
                    onClick={() => setChartLayoutMode('grouped')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      chartLayoutMode === 'grouped' 
                        ? 'bg-white text-natural-primary shadow-xs font-semibold' 
                        : 'text-natural-muted hover:text-natural-text'
                    }`}
                    title="Visualização Lado a Lado"
                  >
                    Comparativo
                  </button>
                </div>
              )}
            </div>

            {/* Filter Pills by Empresa */}
            <div className="flex items-center flex-wrap gap-1.5 pb-2 border-b border-natural-border/60 mb-3">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider flex items-center gap-1 mr-1">
                <Building2 size={12} className="text-natural-primary" />
                Empresa:
              </span>

              <button
                id="filter-empresa-all"
                onClick={() => setSelectedEmpresa('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedEmpresa === 'all'
                    ? 'bg-natural-primary text-white shadow-xs font-bold'
                    : 'bg-natural-light hover:bg-natural-hover/20 text-natural-text border border-natural-border'
                }`}
              >
                <span>Todas as Empresas</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedEmpresa === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {stats.ativos}
                </span>
              </button>

              {stats.empresasList.map((emp, index) => {
                const count = stats.activePerEmpresa[emp] || 0;
                const isSelected = selectedEmpresa === emp;
                const color = getEmpresaColor(emp, index);

                return (
                  <button
                    key={emp}
                    id={`filter-empresa-${emp.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setSelectedEmpresa(emp)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'text-white shadow-xs font-bold'
                        : 'bg-natural-light hover:bg-natural-hover/20 text-natural-text border border-natural-border'
                    }`}
                    style={isSelected ? { backgroundColor: color } : {}}
                  >
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: isSelected ? '#ffffff' : color }}
                    />
                    <span className="truncate max-w-[130px]">{emp}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Chart Area */}
            <div className="w-full h-72">
              {stats.filteredSectorChartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-xs text-natural-muted space-y-1">
                  <Layers size={24} className="text-slate-300 mb-1" />
                  <p>Nenhum colaborador ativo encontrado para este filtro.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.filteredSectorChartData}
                    margin={{ top: 20, right: 10, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748B', fontSize: 11 }} 
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis 
                      allowDecimals={false} 
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: '#F1F5F9' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        const totalAtivos = data.totalAtivos || 0;

                        return (
                          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs space-y-2 min-w-[190px]">
                            <div className="border-b border-slate-100 pb-1.5">
                              <span className="font-bold text-natural-text block text-sm">{label}</span>
                              <span className="text-[10px] text-emerald-700 font-semibold font-mono">
                                Total: {totalAtivos} colaborador{totalAtivos !== 1 ? 'es' : ''} ativo{totalAtivos !== 1 ? 's' : ''}
                              </span>
                            </div>

                            <div className="space-y-1 pt-0.5">
                              {selectedEmpresa === 'all' ? (
                                stats.empresasList.map((emp, i) => {
                                  const val = data[emp] || 0;
                                  if (val === 0) return null;
                                  return (
                                    <div key={emp} className="flex items-center justify-between text-[11px]">
                                      <div className="flex items-center space-x-1.5">
                                        <span 
                                          className="w-2 h-2 rounded-full" 
                                          style={{ backgroundColor: getEmpresaColor(emp, i) }}
                                        />
                                        <span className="text-slate-600 font-medium">{emp}</span>
                                      </div>
                                      <span className="font-bold font-mono text-slate-800">{val}</span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="flex items-center justify-between text-[11px]">
                                  <div className="flex items-center space-x-1.5">
                                    <span 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: getEmpresaColor(selectedEmpresa, 0) }}
                                    />
                                    <span className="text-slate-600 font-medium">{selectedEmpresa}</span>
                                  </div>
                                  <span className="font-bold font-mono text-slate-800">
                                    {data[selectedEmpresa] || 0}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />

                    {selectedEmpresa === 'all' ? (
                      stats.empresasList.map((emp, index) => (
                        <Bar
                          key={emp}
                          dataKey={emp}
                          name={emp}
                          stackId={chartLayoutMode === 'stacked' ? 'a' : undefined}
                          fill={getEmpresaColor(emp, index)}
                          radius={chartLayoutMode === 'stacked' ? (index === stats.empresasList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]) : [4, 4, 0, 0]}
                          maxBarSize={chartLayoutMode === 'stacked' ? 45 : 24}
                        />
                      ))
                    ) : (
                      <Bar
                        dataKey={selectedEmpresa}
                        name={selectedEmpresa}
                        fill={getEmpresaColor(selectedEmpresa, 0)}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                    )}

                    {selectedEmpresa === 'all' && stats.empresasList.length > 1 && (
                      <Legend
                        verticalAlign="top"
                        align="right"
                        height={28}
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{ fontSize: '10px', color: '#64748B', paddingBottom: '4px' }}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Mini breakdown footer summary */}
          {stats.filteredSectorChartData.length > 0 && (
            <div className="pt-3 border-t border-natural-border/60 flex items-center justify-between text-[11px] text-natural-muted">
              <span>
                Mostrando <strong className="text-natural-text font-semibold">{stats.filteredSectorChartData.length}</strong> setores com colaboradores ativos.
              </span>
              <span className="font-mono text-emerald-700 font-bold">
                {selectedEmpresa === 'all' ? `${stats.ativos} ativos no total` : `${stats.activePerEmpresa[selectedEmpresa] || 0} ativos em ${selectedEmpresa}`}
              </span>
            </div>
          )}
        </div>

        {/* Secondary Analytics: Colaboradores por Empresa / Filial / Proporção - taking 5/12 cols */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-natural-border shadow-xs lg:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            {/* Tab switch header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-serif italic font-bold text-natural-text text-sm md:text-base">
                  {secondaryViewTab === 'empresa' && 'Colaboradores por Empresa'}
                  {secondaryViewTab === 'filial' && 'Colaboradores por Filial'}
                  {secondaryViewTab === 'status' && 'Proporção de Status'}
                </h3>
                <p className="text-[11px] text-natural-muted">
                  {secondaryViewTab === 'empresa' && 'Detalhamento de ativos por empresa do grupo'}
                  {secondaryViewTab === 'filial' && 'Distribuição de ativos por filial / unidade'}
                  {secondaryViewTab === 'status' && 'Proporção de ativos e inativos na base'}
                </p>
              </div>

              {/* Sub tabs */}
              <div className="flex items-center bg-natural-light p-0.5 rounded-lg border border-natural-border shrink-0 self-start sm:self-auto text-[11px]">
                <button
                  id="tab-analytics-empresa"
                  onClick={() => setSecondaryViewTab('empresa')}
                  className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    secondaryViewTab === 'empresa'
                      ? 'bg-white text-natural-primary shadow-xs font-semibold'
                      : 'text-natural-muted hover:text-natural-text'
                  }`}
                  title="Ver Colaboradores por Empresa"
                >
                  Empresa
                </button>
                <button
                  id="tab-analytics-filial"
                  onClick={() => setSecondaryViewTab('filial')}
                  className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    secondaryViewTab === 'filial'
                      ? 'bg-white text-natural-primary shadow-xs font-semibold'
                      : 'text-natural-muted hover:text-natural-text'
                  }`}
                  title="Ver Colaboradores por Filial"
                >
                  Filial
                </button>
                <button
                  id="tab-analytics-status"
                  onClick={() => setSecondaryViewTab('status')}
                  className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    secondaryViewTab === 'status'
                      ? 'bg-white text-natural-primary shadow-xs font-semibold'
                      : 'text-natural-muted hover:text-natural-text'
                  }`}
                  title="Ver Proporção de Status"
                >
                  Status
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: Colaboradores por Empresa */}
            {secondaryViewTab === 'empresa' && (
              <div className="space-y-3">
                <div className="w-full h-56 flex items-center justify-center">
                  {stats.empresaChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-natural-muted">
                      Nenhum colaborador ativo cadastrado.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.empresaChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {stats.empresaChartData.map((entry, index) => (
                            <Cell 
                              key={`cell-emp-${index}`} 
                              fill={entry.color} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '12px', 
                            fontSize: '11px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                          }}
                          formatter={(value: any, name: any) => [`${value} colaboradores ativos`, name]}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={28} 
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: '11px', color: '#64748B' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Company Breakdown List */}
                <div className="space-y-1.5 pt-1">
                  {stats.empresaChartData.map((emp, i) => {
                    const pct = stats.ativos > 0 ? Math.round((emp.value / stats.ativos) * 100) : 0;
                    return (
                      <div key={emp.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: emp.color }} />
                          <span className="font-medium text-slate-700">{emp.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-slate-500 font-mono">{pct}%</span>
                          <span className="font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {emp.value} ativos
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Colaboradores por Filial */}
            {secondaryViewTab === 'filial' && (
              <div className="space-y-3">
                <div className="w-full h-56">
                  {stats.filialChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-natural-muted">
                      Nenhuma filial com colaboradores ativos encontrada.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.filialChartData}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis 
                          type="number" 
                          allowDecimals={false} 
                          tick={{ fill: '#64748B', fontSize: 11 }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          tick={{ fill: '#64748B', fontSize: 11 }} 
                          axisLine={false} 
                          tickLine={false}
                          width={90}
                        />
                        <Tooltip 
                          cursor={{ fill: '#F1F5F9' }}
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '12px', 
                            fontSize: '11px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                          }}
                          formatter={(val: any) => [`${val} colaboradores ativos`, 'Ativos']}
                        />
                        <Bar 
                          dataKey="quantidade" 
                          fill="#8B5CF6" 
                          radius={[0, 4, 4, 0]} 
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Filial List */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {stats.filialChartData.map((fil, i) => (
                    <div key={fil.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <MapPin size={12} className="text-violet-600 shrink-0" />
                        <span className="font-medium text-slate-700 truncate max-w-[160px]">{fil.name}</span>
                        {fil.empresa && (
                          <span className="text-[10px] text-slate-400">({fil.empresa})</span>
                        )}
                      </div>
                      <span className="font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        {fil.quantidade} ativos
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Proporção de Status */}
            {secondaryViewTab === 'status' && (
              <div className="w-full h-72 flex items-center justify-center">
                {stats.statusChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-natural-muted">
                    Dados insuficientes para renderização.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {stats.statusChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={STATUS_COLORS[index % STATUS_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #BAE6FD', 
                          borderRadius: '12px', 
                          fontSize: '11px',
                          boxShadow: '0 2px 4px rgb(0 0 0 / 0.02)'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', color: '#64748B' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Quick insights banner */}
      <div className="bg-natural-light border border-natural-border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-natural-primary text-white rounded-lg mt-0.5 shrink-0">
            <TrendingUp size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-natural-text uppercase tracking-wider">Insight Rápido da Equipe</h4>
            <p className="text-[11px] text-natural-muted mt-1 max-w-2xl leading-relaxed">
              Atualmente, a empresa conta com <span className="font-semibold text-emerald-700">{stats.ativos} colaboradores ativos</span> distribuídos em <span className="font-semibold text-natural-primary">{stats.empresasList.length} empresa(s)</span> e <span className="font-semibold text-natural-primary">{stats.totalFiliaisAtivas} unidade(s)/filial(ais)</span>. O maior setor é o de <span className="font-semibold text-natural-primary">{stats.topActiveSector?.name || 'não listado'}</span> ({stats.topActiveSector?.totalAtivos || 0} ativos).
            </p>
          </div>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <button
            id="view-full-team-btn"
            onClick={onAddClick}
            className="w-full text-center bg-natural-primary hover:bg-natural-hover text-white text-xs font-semibold py-2 px-4 rounded-full transition-colors cursor-pointer"
          >
            Cadastrar Mais
          </button>
        </div>
      </div>
    </div>
  );
}
