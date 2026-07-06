import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, LogOut, Menu, User, Sparkles, Building, Mail } from 'lucide-react';
import { UserSettings, ActiveTab } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  toggleSidebar: () => void;
  userSettings: UserSettings;
  openSettings: () => void;
  onLogout?: () => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  toggleSidebar,
  userSettings,
  openSettings,
  onLogout,
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (activeTab !== 'colaboradores' && e.target.value !== '') {
      setActiveTab('colaboradores');
    }
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 h-16 bg-white border-b border-natural-border px-4 md:px-6 flex items-center justify-between"
    >
      {/* Left section: Hamburger & Search Bar */}
      <div className="flex items-center space-x-3 flex-1 max-w-lg md:max-w-xl">
        <button
          id="toggle-sidebar-btn"
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg text-natural-muted hover:bg-natural-light lg:hidden transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-natural-muted">
            <Search size={18} />
          </div>
          <input
            id="global-search-input"
            type="text"
            placeholder="Buscar por nome, CPF, cargo ou setor..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-natural-light border border-natural-border rounded-full pl-10 pr-4 py-2 text-sm text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-2 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right section: System notifications & User Profile Dropdown */}
      <div className="flex items-center space-x-4 ml-4 shrink-0">
        <div className="hidden sm:flex items-center space-x-2 text-xs text-natural-muted font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>Online</span>
        </div>

        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="user-profile-menu-trigger"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-natural-light border border-transparent hover:border-natural-border transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-natural-light text-natural-primary flex items-center justify-center font-bold text-sm border-2 border-natural-accent">
              {userSettings.nomeUsuario.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <span className="block text-xs font-semibold text-natural-text leading-tight">
                {userSettings.nomeUsuario}
              </span>
              <span className="block text-[10px] text-natural-muted font-medium">
                {userSettings.empresa}
              </span>
            </div>
          </button>

          {/* Settings / Profile Dropdown Menu */}
          {profileOpen && (
            <div
              id="user-profile-dropdown"
              className="absolute right-0 mt-2 w-64 bg-white border border-natural-border rounded-xl shadow-lg shadow-natural-light-gray/50 py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
            >
              <div className="px-4 py-3 border-b border-natural-light-gray">
                <span className="block text-xs font-semibold text-natural-text">
                  {userSettings.nomeUsuario}
                </span>
                <span className="block text-[11px] text-natural-muted flex items-center mt-1">
                  <Mail size={12} className="mr-1 text-natural-muted" />
                  {userSettings.email}
                </span>
                <span className="block text-[11px] text-natural-muted flex items-center mt-1">
                  <Building size={12} className="mr-1 text-natural-muted" />
                  {userSettings.empresa}
                </span>
              </div>

              <div className="py-1">
                <button
                  id="dropdown-settings-btn"
                  onClick={() => {
                    setProfileOpen(false);
                    openSettings();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-natural-text hover:bg-natural-light flex items-center transition-colors"
                >
                  <Settings size={14} className="mr-2 text-natural-muted" />
                  Configurações do Sistema
                </button>
                <div className="px-4 py-2">
                  <div className="bg-natural-light rounded-lg p-2 border border-natural-border flex items-start space-x-1.5">
                    <Sparkles size={12} className="text-natural-primary mt-0.5 shrink-0" />
                    <span className="text-[10px] text-natural-primary leading-relaxed font-medium">
                      Modo Administrativo Ativo: Gerencie colaboradores livremente.
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-natural-light-gray py-1">
                <button
                  id="dropdown-logout-btn"
                  onClick={() => {
                    setProfileOpen(false);
                    if (onLogout) {
                      onLogout();
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center transition-colors font-medium cursor-pointer"
                >
                  <LogOut size={14} className="mr-2 text-rose-400" />
                  Sair do Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
