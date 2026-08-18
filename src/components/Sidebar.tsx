import React, { useMemo } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  UserPlus, 
  FileText, 
  X, 
  Landmark, 
  Cpu, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Building2,
  Receipt,
  Send,
  Wallet,
  ChevronDown,
  PanelLeftOpen,
  PanelLeftClose
} from 'lucide-react';
import { ActiveTab, NotaFiscal } from '../types';
import { isNotaAptaFinanceiro } from '../data';

interface SubMenuItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  badgeColor?: string;
  count?: number;
}

interface MenuItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  isParent?: boolean;
  subItems?: SubMenuItem[];
}

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  notasFiscais?: NotaFiscal[];
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  toggleSidebar,
  isCollapsed,
  toggleCollapse,
  notasFiscais = []
}: SidebarProps) {
  const [isNotasDropdownOpen, setIsNotasDropdownOpen] = React.useState<boolean>(true);

  const aptasCount = useMemo(() => {
    return (notasFiscais || []).filter(isNotaAptaFinanceiro).length;
  }, [notasFiscais]);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Painel Geral',
      icon: LayoutDashboard,
      description: 'Estatísticas e visão geral da equipe'
    },
    {
      id: 'empresa_filial' as ActiveTab,
      label: 'Empresa / Filial',
      icon: Building2,
      description: 'Filiais, razões sociais, CNPJ e redes'
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
      description: 'Gestão de notas, itens e anexos',
      isParent: true,
      subItems: [
        {
          id: 'financeiro' as ActiveTab,
          label: 'Financeiro',
          icon: Send,
          badge: aptasCount > 0 ? `${aptasCount}` : undefined,
          badgeColor: 'bg-emerald-500 text-white'
        }
      ]
    },
    {
      id: 'administracao' as ActiveTab,
      label: 'Administração',
      icon: ShieldCheck,
      description: 'Importação XLSX e gestão do banco'
    }
  ];

  const handleNav = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (tabId === 'notas_fiscais' || tabId === 'financeiro') {
      setIsNotasDropdownOpen(true);
    }
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
        className={`fixed top-0 bottom-0 left-0 z-50 bg-natural-primary text-slate-100 flex flex-col border-r border-natural-hover transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-72 lg:w-20' : 'w-72'}`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-natural-hover transition-all duration-300 ${
          isCollapsed ? 'px-3 lg:justify-center justify-between' : 'px-5 justify-between'
        }`}>
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-natural-accent rounded-lg text-natural-primary shrink-0 shadow-xs">
              <Landmark size={20} />
            </div>
            {(!isCollapsed || window.innerWidth < 1024) && (
              <div className="whitespace-nowrap transition-opacity duration-200">
                <span className="font-serif italic font-semibold tracking-tight text-lg text-white block leading-tight">
                  Blue Manager
                </span>
                <span className="text-[10px] text-natural-gray-text font-mono tracking-wider block">
                  V1.2 SISTEMA INTERNO
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            id="btn-toggle-sidebar-collapse"
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-natural-accent hover:text-white hover:bg-natural-hover transition-all cursor-pointer"
            title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
            aria-label={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button 
            id="close-sidebar-btn"
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-natural-hover text-natural-accent hover:text-white lg:hidden transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className={`flex-1 py-5 space-y-1.5 overflow-y-auto overflow-x-hidden ${
          isCollapsed ? 'px-2 lg:px-2.5' : 'px-3'
        }`}>
          {(!isCollapsed || window.innerWidth < 1024) && (
            <div className="text-[10px] font-bold text-natural-gray-text uppercase tracking-widest px-3 mb-2.5">
              Navegação Principal
            </div>
          )}

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = activeTab === item.id || (item.isParent && (activeTab === 'notas_fiscais' || activeTab === 'financeiro'));
            const collapsedDesktop = isCollapsed;

            return (
              <div key={item.id} className="space-y-1">
                <button
                  id={`sidebar-link-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  title={collapsedDesktop ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl transition-all group cursor-pointer ${
                    collapsedDesktop ? 'lg:justify-center lg:px-0 lg:py-3 px-3.5 py-3' : 'px-3.5 py-3'
                  } ${
                    isItemActive && (!item.subItems || activeTab === item.id)
                      ? 'bg-natural-accent text-natural-primary font-semibold shadow-xs'
                      : isItemActive
                        ? 'bg-natural-hover/60 text-white font-medium'
                        : 'text-natural-accent hover:bg-natural-hover hover:text-white'
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={`shrink-0 transition-colors ${
                      isItemActive && (!item.subItems || activeTab === item.id)
                        ? 'text-natural-primary' 
                        : 'text-natural-accent group-hover:text-white'
                    }`} 
                  />

                  {(!collapsedDesktop || window.innerWidth < 1024) && (
                    <div className="ml-3 flex-1 min-w-0 text-left flex items-center justify-between">
                      <div className="min-w-0 pr-1">
                        <span className="font-medium text-xs md:text-sm block leading-snug truncate">
                          {item.label}
                        </span>
                        <span className={`text-[10px] block truncate ${
                          isItemActive ? 'text-white/80 font-normal' : 'text-natural-gray-text'
                        }`}>
                          {item.description}
                        </span>
                      </div>
                      {item.isParent && (
                        <div
                          role="button"
                          id={`toggle-dropdown-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsNotasDropdownOpen(!isNotasDropdownOpen);
                          }}
                          className="p-1 rounded-md hover:bg-natural-primary/20 text-natural-accent/80 hover:text-white transition-colors cursor-pointer"
                          title={isNotasDropdownOpen ? "Recolher submenu" : "Expandir submenu"}
                        >
                          <ChevronDown 
                            size={14} 
                            className={`shrink-0 transition-transform duration-200 ${
                              isNotasDropdownOpen ? 'rotate-180 text-white' : ''
                            }`} 
                          />
                        </div>
                      )}
                    </div>
                  )}
                </button>

                {/* Sub-items for Notas Fiscais (Financeiro Submenu) */}
                {item.subItems && isNotasDropdownOpen && (!collapsedDesktop || window.innerWidth < 1024) && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-natural-hover/50 ml-5 my-1">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeTab === sub.id;

                      return (
                        <button
                          key={sub.id}
                          id={`sidebar-sublink-${sub.id}`}
                          onClick={() => handleNav(sub.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-natural-accent text-natural-primary font-bold shadow-xs'
                              : 'text-natural-accent/90 hover:bg-natural-hover hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <SubIcon size={14} className={isSubActive ? 'text-natural-primary' : 'text-natural-accent/70'} />
                            <span className="truncate">{sub.label}</span>
                          </div>

                          {sub.badge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono shrink-0 ml-1.5 ${
                              isSubActive 
                                ? 'bg-natural-primary text-natural-accent' 
                                : sub.badgeColor || 'bg-slate-700 text-slate-300'
                            }`}>
                              {sub.badge}
                            </span>
                          )}

                          {sub.count !== undefined && !sub.badge && (
                            <span className={`text-[10px] font-mono shrink-0 ml-1 ${
                              isSubActive ? 'text-natural-primary/80 font-bold' : 'text-natural-gray-text'
                            }`}>
                              ({sub.count})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Info Box / Footer Toggle Section */}
        <div className="p-3 border-t border-natural-hover">
          {(!isCollapsed || window.innerWidth < 1024) ? (
            <div className="p-3.5 bg-natural-hover/30 rounded-xl border border-natural-hover space-y-2.5">
              <div className="flex items-center space-x-2">
                <FileText size={15} className="text-natural-accent shrink-0" />
                <span className="text-xs font-semibold text-white truncate">Relatórios PDF</span>
              </div>
              <p className="text-[10px] text-natural-accent/80 leading-relaxed line-clamp-2">
                Gere termos individuais e listagens completas da equipe.
              </p>
              <button
                id="quick-pdf-btn"
                onClick={() => handleNav('colaboradores')}
                className="w-full text-center bg-natural-accent hover:bg-white text-natural-primary text-[11px] font-semibold py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Ir para Exportação
              </button>
            </div>
          ) : (
            <button
              id="quick-pdf-btn-collapsed"
              onClick={() => handleNav('colaboradores')}
              title="Relatórios PDF"
              className="w-full flex justify-center items-center py-2.5 rounded-xl bg-natural-hover/40 hover:bg-natural-accent text-natural-accent hover:text-natural-primary transition-colors cursor-pointer"
            >
              <FileText size={18} />
            </button>
          )}

          {/* Bottom Expand/Collapse Button */}
          <button
            id="btn-toggle-sidebar-bottom"
            onClick={toggleCollapse}
            className="hidden lg:flex w-full items-center justify-center space-x-2 mt-2 py-2 px-3 text-xs font-medium text-natural-gray-text hover:text-white hover:bg-natural-hover/50 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir Menu Lateral' : 'Recolher Menu Lateral'}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <>
                <PanelLeftClose size={16} />
                <span className="text-[11px]">Recolher Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

