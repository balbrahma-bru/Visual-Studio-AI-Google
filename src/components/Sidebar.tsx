import React from 'react';
import { Users, LayoutDashboard, UserPlus, FileText, Menu, X, Landmark, Cpu } from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, toggleSidebar }: SidebarProps) {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Painel Geral',
      icon: LayoutDashboard,
      description: 'Estatísticas e visão geral da equipe'
    },
    {
      id: 'colaboradores' as ActiveTab,
      label: 'Colaboradores',
      icon: Users,
      description: 'Listagem, filtros e exportações'
    },
    {
      id: 'cadastro' as ActiveTab,
      label: 'Cadastrar Colaborador',
      icon: UserPlus,
      description: 'Formulário de novo registro'
    },
    {
      id: 'equipamentos' as ActiveTab,
      label: 'Equipamentos',
      icon: Cpu,
      description: 'Inventário de hardware e ativos'
    },
    {
      id: 'notas_fiscais' as ActiveTab,
      label: 'Notas Fiscais',
      icon: FileText,
      description: 'Gestão de notas, itens e anexos'
    }
  ];

  const handleNav = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      toggleSidebar(); // Close sidebar on mobile after clicking
    }
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          id="sidebar-overlay"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-natural-primary text-slate-100 flex flex-col border-r border-natural-hover transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-natural-hover">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-natural-accent rounded-lg text-natural-primary">
              <Landmark size={20} />
            </div>
            <div>
              <span className="font-serif italic font-semibold tracking-tight text-lg text-white block">
                Blue Manager
              </span>
              <span className="text-[10px] text-natural-gray-text font-mono tracking-wider block">
                V1.2 SISTEMA INTERNO
              </span>
            </div>
          </div>

          <button 
            id="close-sidebar-btn"
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-natural-hover text-natural-accent hover:text-white lg:hidden transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-[11px] font-semibold text-natural-gray-text uppercase tracking-wider px-3 mb-3">
            Navegação Principal
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-start space-x-3.5 px-4 py-3 rounded-lg transition-all text-left group ${
                  isActive
                    ? 'bg-natural-accent text-natural-primary shadow-sm'
                    : 'text-natural-accent hover:bg-natural-hover hover:text-white'
                }`}
              >
                <Icon size={20} className={`mt-0.5 shrink-0 ${isActive ? 'text-natural-primary' : 'text-natural-accent group-hover:text-white'}`} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm block">
                    {item.label}
                  </span>
                  <span className={`text-[11px] block truncate ${isActive ? 'text-natural-primary/70' : 'text-natural-gray-text'}`}>
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Info Box Footer */}
        <div className="p-4 border-t border-natural-hover">
          <div className="p-4 bg-natural-hover/30 rounded-xl border border-natural-hover">
            <div className="flex items-center space-x-2.5 mb-2">
              <FileText size={16} className="text-natural-accent" />
              <span className="text-xs font-semibold text-white">Relatórios PDF</span>
            </div>
            <p className="text-[11px] text-natural-accent/80 leading-relaxed mb-3">
              Gere termos individuais ou a listagem completa da equipe com formatação executiva.
            </p>
            <button
              id="quick-pdf-btn"
              onClick={() => handleNav('colaboradores')}
              className="w-full text-center bg-natural-accent hover:bg-white text-natural-primary text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer"
            >
              Ir para Exportação
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
