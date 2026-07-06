import React, { useMemo } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Layers, 
  TrendingUp, 
  UserPlus2, 
  UserCheck2 
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
  Legend
} from 'recharts';
import { Colaborador } from '../types';

interface DashboardProps {
  colaboradores: Colaborador[];
  onAddClick: () => void;
}

export default function Dashboard({ colaboradores, onAddClick }: DashboardProps) {
  // Stat calculations
  const stats = useMemo(() => {
    const total = colaboradores.length;
    const ativos = colaboradores.filter(c => c.status === 'Ativo').length;
    const inativos = total - ativos;
    
    // Average age calculation
    let avgAge = 0;
    if (total > 0) {
      const ages = colaboradores.map(c => {
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

    // Sector Distribution Data
    const sectorCounts: { [key: string]: number } = {};
    colaboradores.forEach(c => {
      if (c.setor) {
        sectorCounts[c.setor] = (sectorCounts[c.setor] || 0) + 1;
      }
    });

    const sectorChartData = Object.keys(sectorCounts).map(sector => ({
      name: sector,
      Quantidade: sectorCounts[sector],
    })).sort((a, b) => b.Quantidade - a.Quantidade);

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
      sectorChartData,
      statusChartData
    };
  }, [colaboradores]);

  // Colors for Pie Chart
  const STATUS_COLORS = ['#0EA5E9', '#94A3B8']; // Sky Blue for Active, Slate for Inactive

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

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* KPI 1: Total Employees */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
              Total Colaboradores
            </span>
            <span className="text-3xl font-light text-natural-text block">
              {stats.total}
            </span>
            <span className="text-[10px] text-natural-muted font-medium block">
              Cadastrados no sistema
            </span>
          </div>
          <div className="p-3 bg-natural-light text-natural-primary rounded-xl border border-natural-light-gray">
            <Users size={22} />
          </div>
        </div>

        {/* KPI 2: Active Employees */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
              Colaboradores Ativos
            </span>
            <span className="text-3xl font-light text-natural-text block">
              {stats.ativos}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium block">
              {stats.total > 0 ? `${Math.round((stats.ativos / stats.total) * 100)}%` : '0%'} do total da equipe
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck2 size={22} />
          </div>
        </div>

        {/* KPI 3: Inactive Employees */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
              Setores Ativos
            </span>
            <span className="text-3xl font-light text-natural-text block">
              {stats.sectorChartData.length}
            </span>
            <span className="text-[10px] text-natural-muted font-medium block">
              Departamentos com equipe
            </span>
          </div>
          <div className="p-3 bg-natural-light text-natural-primary rounded-xl border border-natural-light-gray">
            <Layers size={22} />
          </div>
        </div>

        {/* KPI 4: Average Age */}
        <div className="bg-white p-5 rounded-2xl border border-natural-border shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
              Média de Idade
            </span>
            <span className="text-3xl font-light text-natural-text block">
              {stats.avgAge} <span className="text-sm font-normal text-natural-muted">anos</span>
            </span>
            <span className="text-[10px] text-natural-muted font-medium block">
              Média etária geral
            </span>
          </div>
          <div className="p-3 bg-natural-light text-natural-primary rounded-xl border border-natural-light-gray">
            <Calendar size={22} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sector Bar Chart - taking 7/12 cols */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-natural-border shadow-xs lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif italic font-bold text-natural-text text-sm">
                  Distribuição por Setor
                </h3>
                <p className="text-[11px] text-natural-muted">
                  Quantidade total de colaboradores alocados em cada setor corporativo.
                </p>
              </div>
              <Layers size={16} className="text-natural-primary" />
            </div>
            
            <div className="w-full h-72">
              {stats.sectorChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-natural-muted">
                  Dados insuficientes para renderização.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.sectorChartData}
                    margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748B', fontSize: 11 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      allowDecimals={false} 
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: '#E0F2FE' }}
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #BAE6FD', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        boxShadow: '0 2px 4px rgb(0 0 0 / 0.02)'
                      }}
                    />
                    <Bar 
                      dataKey="Quantidade" 
                      fill="#0EA5E9" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={45}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Status Pie Chart - taking 5/12 cols */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-natural-border shadow-xs lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif italic font-bold text-natural-text text-sm">
                  Proporção de Status da Equipe
                </h3>
                <p className="text-[11px] text-natural-muted">
                  Percentual de colaboradores ativos em relação aos inativos.
                </p>
              </div>
              <CheckCircle size={16} className="text-natural-primary" />
            </div>

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
              Atualmente, o maior setor da sua empresa é o de <span className="font-semibold text-natural-primary">{stats.sectorChartData[0]?.name || 'não listado'}</span>, correspondendo a <span className="font-semibold text-natural-primary">{stats.sectorChartData[0]?.Quantidade || 0}</span> colaborador(es). A média de idade dos colaboradores cadastrados reflete uma equipe madura de <span className="font-semibold text-natural-primary">{stats.avgAge} anos</span>.
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
