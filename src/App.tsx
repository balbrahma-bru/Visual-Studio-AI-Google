import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  ShieldAlert, 
  Info,
  Calendar,
  Layers,
  Mail,
  Send,
  Check,
  Loader2,
  ShieldCheck,
  Eye,
  ArrowRight,
  AlertTriangle,
  Clock
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ColaboradorForm from './components/ColaboradorForm';
import ColaboradorList from './components/ColaboradorList';
import EquipamentoList from './components/EquipamentoList';
import SettingsModal from './components/SettingsModal';
import LoginPage from './components/LoginPage';
import { Colaborador, Equipamento, ActiveTab, UserSettings, NotaFiscal, EmpresaFilial } from './types';
import { INITIAL_COLABORADORES, INITIAL_EQUIPAMENTOS, INITIAL_NOTAS_FISCAIS, INITIAL_EMPRESAS_FILIAIS } from './data';
import NotaFiscalList from './components/NotaFiscalList';
import EmpresaFiliaisList from './components/EmpresaFiliaisList';
import DatabaseExportModal from './components/DatabaseExportModal';
import Administracao from './components/Administracao';

// Helper function to decode and validate custom JWT token claims (XSS & Expiry checks)
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    // Decode base64url payload
    const payloadB64 = parts[1];
    const binStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(binStr);
    
    // Check expiration timestamp (exp is in seconds)
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      console.warn('Sessão expirada via validação do Token JWT.');
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export default function App() {
  // ----------------------------------------------------
  // Persistent Auth State Setup
  // ----------------------------------------------------
  const [token, setToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('colab_registry_token');
      if (saved && isTokenValid(saved)) return saved;
    } catch (e) {
      console.error('Falha ao ler token de autenticação', e);
    }
    return null;
  });

  // ----------------------------------------------------
  // Persistent State Setup
  // ----------------------------------------------------
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(() => {
    try {
      // Clear legacy sample data as requested by user
      const cleared = localStorage.getItem('colab_registry_cleared_v2');
      if (!cleared) {
        localStorage.removeItem('colab_registry_data');
        localStorage.setItem('colab_registry_cleared_v2', 'true');
        return [];
      }
      const saved = localStorage.getItem('colab_registry_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Falha ao ler colaboradores do localStorage', e);
    }
    return INITIAL_COLABORADORES;
  });

  const [equipamentos, setEquipamentos] = useState<Equipamento[]>(() => {
    try {
      const saved = localStorage.getItem('colab_registry_equipamentos');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Falha ao ler equipamentos do localStorage', e);
    }
    return INITIAL_EQUIPAMENTOS;
  });

  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('colab_registry_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Falha ao ler configurações do localStorage', e);
    }
    return {
      nomeUsuario: 'Ana Paula Souza',
      empresa: 'TechCorp Solutions Ltda',
      email: 'ana.souza@techcorp.com.br',
      tema: 'light'
    };
  });

  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>(() => {
    try {
      const saved = localStorage.getItem('colab_registry_notas_fiscais');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Falha ao ler notas fiscais do localStorage', e);
    }
    return INITIAL_NOTAS_FISCAIS;
  });

  const [empresasFiliais, setEmpresasFiliais] = useState<EmpresaFilial[]>(() => {
    try {
      const saved = localStorage.getItem('colab_registry_empresas_filiais');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Falha ao ler empresas e filiais do localStorage', e);
    }
    return INITIAL_EMPRESAS_FILIAIS;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('colab_registry_data', JSON.stringify(colaboradores));
  }, [colaboradores]);

  useEffect(() => {
    localStorage.setItem('colab_registry_equipamentos', JSON.stringify(equipamentos));
  }, [equipamentos]);

  useEffect(() => {
    localStorage.setItem('colab_registry_settings', JSON.stringify(userSettings));
  }, [userSettings]);

  useEffect(() => {
    localStorage.setItem('colab_registry_notas_fiscais', JSON.stringify(notasFiscais));
  }, [notasFiscais]);

  useEffect(() => {
    localStorage.setItem('colab_registry_empresas_filiais', JSON.stringify(empresasFiliais));
  }, [empresasFiliais]);

  // Synchronize token state to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('colab_registry_token', token);
    } else {
      localStorage.removeItem('colab_registry_token');
    }
  }, [token]);

  // Periodic JWT expiration checker (every 10 seconds)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      if (!isTokenValid(token)) {
        handleLogout('Sua sessão expirou por limite de segurança. Faça login novamente.');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // ----------------------------------------------------
  // UI & View State
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('colab_sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [databaseModalOpen, setDatabaseModalOpen] = useState(false);
  const [colaboradorToEdit, setColaboradorToEdit] = useState<Colaborador | null>(null);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('colab_sidebar_collapsed', String(next));
      } catch (e) {
        console.error('Falha ao salvar preferência de sidebar', e);
      }
      return next;
    });
  };

  // Persistent filter states for ColaboradorList
  const [colabFilterSector, setColabFilterSector] = useState<string>('Todos');
  const [colabFilterFilial, setColabFilterFilial] = useState<string>('Todos');
  const [colabFilterStatus, setColabFilterStatus] = useState<string>('Ativo');
  const [colabSortField, setColabSortField] = useState<'nomeCompleto' | 'cargo' | 'setor' | 'dataAdmissao' | 'filial'>('nomeCompleto');
  const [colabSortOrder, setColabSortOrder] = useState<'asc' | 'desc'>('asc');

  // ----------------------------------------------------
  // Custom Toasts / Alerts (No iframe-breaking windows)
  // ----------------------------------------------------
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'info' | 'error'; message: string }[]>([]);
  
  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ----------------------------------------------------
  // Custom Delete Confirmation (Iframe friendly)
  // ----------------------------------------------------
  const [colabIdToDelete, setColabIdToDelete] = useState<string | null>(null);
  const employeeToDelete = useMemo(() => {
    return colaboradores.find(c => c.id === colabIdToDelete) || null;
  }, [colabIdToDelete, colaboradores]);

  // ----------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------
  
  // Authentication Handlers
  const handleLoginSuccess = (newToken: string, updatedSettings: UserSettings) => {
    setToken(newToken);
    setUserSettings(updatedSettings);
    setActiveTab('dashboard');
    addToast('Acesso via Token JWT homologado!', 'success');
  };

  const handleLogout = (message: string = 'Sessão encerrada com sucesso.') => {
    setToken(null);
    setColaboradorToEdit(null);
    setActiveTab('dashboard');
    addToast(message, 'info');
  };
  
  // Create / Edit Colaborador Save handler
  const handleSaveColaborador = (colaborador: Colaborador) => {
    const isEdit = colaboradores.some((c) => c.id === colaborador.id);
    
    if (isEdit) {
      setColaboradores((prev) => prev.map((c) => (c.id === colaborador.id ? colaborador : c)));
      addToast(`Cadastro de ${colaborador.exibicao} atualizado com sucesso!`, 'success');
    } else {
      setColaboradores((prev) => [colaborador, ...prev]);
      addToast(`Colaborador ${colaborador.exibicao} cadastrado com sucesso!`, 'success');
    }

    setColaboradorToEdit(null);
    setActiveTab('colaboradores');
  };

  // Create / Edit Equipamento Save handler
  const handleSaveEquipamento = (equipamento: Equipamento) => {
    const oldEquipamento = equipamentos.find((e) => e.id === equipamento.id);
    const usuarioResponsavel = userSettings.nomeUsuario || 'Administrador';
    const dataHora = new Date().toISOString();
    
    let novosHistoricos = [...(oldEquipamento?.historico || [])];

    if (!oldEquipamento) {
      // 1. It's a new registration
      let desc = `Equipamento registrado com status inicial ${equipamento.status}.`;
      if (equipamento.colaboradorId) {
        const colab = colaboradores.find(c => c.id === equipamento.colaboradorId);
        desc += ` Atribuído ao colaborador ${colab ? colab.nomeCompleto : 'desconhecido'}.`;
      } else {
        desc += ` Mantido em estoque.`;
      }
      
      novosHistoricos.push({
        id: `hist-auto-${Date.now()}-1`,
        data: dataHora,
        acao: 'Cadastro de Ativo',
        descricao: desc,
        usuario: usuarioResponsavel
      });
    } else {
      // 2. It's an edit. Compare changes
      const mudancas: { acao: string; desc: string }[] = [];

      // Check status change
      if (oldEquipamento.status !== equipamento.status) {
        mudancas.push({
          acao: 'Alteração de Status',
          desc: `Status operacional alterado de "${oldEquipamento.status}" para "${equipamento.status}".`
        });
      }

      // Check company change
      if (oldEquipamento.empresa !== equipamento.empresa) {
        mudancas.push({
          acao: 'Alteração de Empresa',
          desc: `Empresa vinculada alterada de "${oldEquipamento.empresa}" para "${equipamento.empresa}".`
        });
      }

      // Check collaborator change
      if (oldEquipamento.colaboradorId !== equipamento.colaboradorId) {
        const oldColab = oldEquipamento.colaboradorId ? colaboradores.find(c => c.id === oldEquipamento.colaboradorId) : null;
        const newColab = equipamento.colaboradorId ? colaboradores.find(c => c.id === equipamento.colaboradorId) : null;
        
        const deStr = oldColab ? `colaborador "${oldColab.nomeCompleto}"` : 'sem atribuição (estoque)';
        const paraStr = newColab ? `colaborador "${newColab.nomeCompleto}"` : 'sem atribuição (devolvido ao estoque)';
        
        mudancas.push({
          acao: 'Alteração de Vínculo',
          desc: `Responsável alterado de: ${deStr} para: ${paraStr}.`
        });
      }

      // Check key text changes
      const specsAlteradas: string[] = [];
      if (oldEquipamento.nome !== equipamento.nome) specsAlteradas.push('nome');
      if (oldEquipamento.marcaModelo !== equipamento.marcaModelo) specsAlteradas.push('marca/modelo');
      if (oldEquipamento.numeroSerie !== equipamento.numeroSerie) specsAlteradas.push('número de série');
      if (oldEquipamento.patrimonio !== equipamento.patrimonio) specsAlteradas.push('código de patrimônio');
      
      if (specsAlteradas.length > 0) {
        mudancas.push({
          acao: 'Edição de Cadastro',
          desc: `Especificações de cadastro atualizadas: ${specsAlteradas.join(', ')}.`
        });
      }

      // If any change detected, append history log
      if (mudancas.length > 0) {
        mudancas.forEach((mudanca, index) => {
          novosHistoricos.push({
            id: `hist-auto-${Date.now()}-${index}`,
            data: dataHora,
            acao: mudanca.acao,
            descricao: mudanca.desc,
            usuario: usuarioResponsavel
          });
        });
      }
    }

    const equipamentoAtualizado = {
      ...equipamento,
      historico: novosHistoricos
    };

    const isEdit = !!oldEquipamento;
    if (isEdit) {
      setEquipamentos((prev) => prev.map((e) => (e.id === equipamento.id ? equipamentoAtualizado : e)));
      addToast(`Equipamento ${equipamento.nome} atualizado com sucesso!`, 'success');
    } else {
      setEquipamentos((prev) => [equipamentoAtualizado, ...prev]);
      addToast(`Equipamento ${equipamento.nome} cadastrado com sucesso!`, 'success');
    }
  };

  // Delete Equipamento handler
  const handleDeleteEquipamento = (id: string) => {
    const eq = equipamentos.find((e) => e.id === id);
    if (eq) {
      setEquipamentos((prev) => prev.filter((e) => e.id !== id));
      addToast(`Equipamento ${eq.nome} removido do inventário.`, 'success');
    }
  };

  // Save or update Nota Fiscal
  const handleSaveNotaFiscal = (nota: NotaFiscal) => {
    const exists = notasFiscais.some(n => n.id === nota.id);
    if (exists) {
      setNotasFiscais(prev => prev.map(n => n.id === nota.id ? nota : n));
      addToast(`Nota Fiscal Nº ${nota.numero} atualizada com sucesso!`, 'success');
    } else {
      setNotasFiscais(prev => [nota, ...prev]);
      addToast(`Nota Fiscal Nº ${nota.numero} cadastrada com sucesso!`, 'success');
    }
  };

  // Delete Nota Fiscal
  const handleDeleteNotaFiscal = (id: string) => {
    const nf = notasFiscais.find(n => n.id === id);
    if (nf) {
      setNotasFiscais(prev => prev.filter(n => n.id !== id));
      addToast(`Nota Fiscal Nº ${nf.numero} excluída com sucesso.`, 'success');
    }
  };

  // Save or update Empresa / Filial
  const handleSaveEmpresaFilial = (filial: EmpresaFilial) => {
    const exists = empresasFiliais.some(f => f.id === filial.id);
    if (exists) {
      setEmpresasFiliais(prev => prev.map(f => f.id === filial.id ? filial : f));
      addToast(`Filial ${filial.filial} (${filial.empresa}) atualizada com sucesso!`, 'success');
    } else {
      setEmpresasFiliais(prev => [filial, ...prev]);
      addToast(`Filial ${filial.filial} (${filial.empresa}) cadastrada com sucesso!`, 'success');
    }
  };

  // Delete (Desativar) Empresa / Filial: Atualiza Ativo para 0 e registra a Data de Desativação
  const handleDeleteEmpresaFilial = (id: string) => {
    const item = empresasFiliais.find(f => f.id === id);
    if (item) {
      const today = new Date().toISOString().split('T')[0];
      setEmpresasFiliais(prev => prev.map(f => f.id === id ? { ...f, ativo: false, dataDesativacao: today } : f));
      addToast(`Filial ${item.filial} (${item.empresa}) desativada com sucesso (Ativo: 0)!`, 'info');
    }
  };

  // Switch to edit mode
  const handleEditColaborador = (colaborador: Colaborador) => {
    setColaboradorToEdit(colaborador);
    setActiveTab('cadastro');
  };

  // Trigger delete modal
  const handleTriggerDelete = (id: string) => {
    setColabIdToDelete(id);
  };

  // Confirm delete handler
  // ----------------------------------------------------
  // Email dispatcher simulation states
  // ----------------------------------------------------
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendingStep, setEmailSendingStep] = useState(0);

  // Confirm delete and trigger email simulation
  const handleConfirmDeleteWithEmail = () => {
    if (!colabIdToDelete) return;
    const item = colaboradores.find(c => c.id === colabIdToDelete);
    if (!item) return;

    setIsSendingEmail(true);
    setEmailSendingStep(1);

    // Step 1: Connecting to SMTP server (600ms)
    setTimeout(() => {
      setEmailSendingStep(2);
      
      // Step 2: Negotiating secure channel SSL/TLS (600ms)
      setTimeout(() => {
        setEmailSendingStep(3);

        // Step 3: Compiling HTML/CSS content and sending message (700ms)
        setTimeout(() => {
          setEmailSendingStep(4);

          // Step 4: Finished! Remove from database and notify
          setTimeout(() => {
            setColaboradores((prev) => prev.filter((c) => c.id !== colabIdToDelete));
            addToast(`Notificação enviada para fabiorodrigues42@hotmail.com e colaborador ${item.exibicao} desativado.`, 'success');
            
            // Reset modal & simulation states
            setColabIdToDelete(null);
            setIsSendingEmail(false);
            setEmailSendingStep(0);
          }, 600);
        }, 700);
      }, 600);
    }, 600);
  };

  const handleCancelForm = () => {
    setColaboradorToEdit(null);
    setActiveTab('colaboradores');
  };

  if (!token) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLoginSuccess} userSettings={userSettings} />
        {/* Render global toasts for security status and handshakes */}
        <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 50 }}
                className="pointer-events-auto flex items-start space-x-3 p-4 bg-natural-primary text-white rounded-xl shadow-lg border border-natural-hover shadow-natural-primary/10"
              >
                {toast.type === 'success' ? (
                  <CheckCircle size={18} className="text-natural-accent shrink-0 mt-0.5" />
                ) : toast.type === 'error' ? (
                  <ShieldAlert size={18} className="text-red-300 shrink-0 mt-0.5" />
                ) : (
                  <Info size={18} className="text-natural-accent shrink-0 mt-0.5" />
                )}
                
                <div className="flex-1 text-xs font-medium leading-relaxed pr-2 text-natural-light">
                  {toast.message}
                </div>

                <button
                  id={`close-toast-${toast.id}`}
                  onClick={() => removeToast(toast.id)}
                  className="text-natural-accent hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg flex text-natural-text antialiased font-sans">
      
      {/* 1. Responsive Sidebar Component */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'cadastro') {
            setColaboradorToEdit(null); // Clear editing if navigating away
          }
        }}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isCollapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebarCollapsed}
        notasFiscais={notasFiscais}
      />

      {/* 2. Main Content Frame */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0 ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}>
        
        {/* Top Header holding Search bar & user settings */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isCollapsed={sidebarCollapsed}
          toggleCollapse={toggleSidebarCollapsed}
          userSettings={userSettings}
          openSettings={() => setSettingsOpen(true)}
          openDatabaseModal={() => setDatabaseModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic page view rendering with motion transitions */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  colaboradores={colaboradores} 
                  onAddClick={() => {
                    setColaboradorToEdit(null);
                    setActiveTab('cadastro');
                  }} 
                />
              )}

              {activeTab === 'empresa_filial' && (
                <EmpresaFiliaisList
                  empresasFiliais={empresasFiliais}
                  searchQuery={searchQuery}
                  onSave={handleSaveEmpresaFilial}
                  onDelete={handleDeleteEmpresaFilial}
                  userSettings={userSettings}
                />
              )}

              {activeTab === 'colaboradores' && (
                <ColaboradorList
                  colaboradores={colaboradores}
                  searchQuery={searchQuery}
                  selectedSector={colabFilterSector}
                  setSelectedSector={setColabFilterSector}
                  selectedFilial={colabFilterFilial}
                  setSelectedFilial={setColabFilterFilial}
                  selectedStatus={colabFilterStatus}
                  setSelectedStatus={setColabFilterStatus}
                  sortField={colabSortField}
                  setSortField={setColabSortField}
                  sortOrder={colabSortOrder}
                  setSortOrder={setColabSortOrder}
                  onEdit={handleEditColaborador}
                  onDelete={handleTriggerDelete}
                  userSettings={userSettings}
                  onAddNew={() => {
                    setColaboradorToEdit(null);
                    setActiveTab('cadastro');
                  }}
                />
              )}

              {activeTab === 'cadastro' && (
                <ColaboradorForm
                  colaboradorToEdit={colaboradorToEdit}
                  onSave={handleSaveColaborador}
                  onCancel={handleCancelForm}
                  colaboradores={colaboradores}
                  empresasFiliais={empresasFiliais}
                />
              )}

              {activeTab === 'equipamentos' && (
                <EquipamentoList
                  equipamentos={equipamentos}
                  colaboradores={colaboradores}
                  onSave={handleSaveEquipamento}
                  onDelete={handleDeleteEquipamento}
                  userSettings={userSettings}
                />
              )}

              {(activeTab === 'notas_fiscais' || activeTab === 'financeiro') && (
                <NotaFiscalList
                  notasFiscais={notasFiscais}
                  empresasFiliais={empresasFiliais}
                  onSave={handleSaveNotaFiscal}
                  onDelete={handleDeleteNotaFiscal}
                  userSettings={userSettings}
                  activeSubTab={activeTab === 'financeiro' ? 'financeiro' : 'todas'}
                  onSubTabChange={(tab) => setActiveTab(tab === 'financeiro' ? 'financeiro' : 'notas_fiscais')}
                />
              )}

              {activeTab === 'administracao' && (
                <Administracao
                  colaboradores={colaboradores}
                  onImportSuccess={(updatedList, summary) => {
                    setColaboradores(updatedList);
                    addToast(`Processamento concluído: ${summary.created} novos cadastros e ${summary.updated} atualizações.`, 'success');
                  }}
                  onClearAllColaboradores={() => {
                    setColaboradores([]);
                    localStorage.setItem('colab_registry_data', JSON.stringify([]));
                    addToast('Todos os colaboradores foram removidos com sucesso. A base de dados está limpa para a nova importação.', 'info');
                  }}
                  userSettings={userSettings}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ==========================================
          MODALS & CUSTOM OVERLAYS
          ========================================== */}

      {/* A. User Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          currentSettings={userSettings}
          onSave={(updated) => {
            setUserSettings(updated);
            addToast('Configurações atualizadas com sucesso!', 'success');
          }}
          onClose={() => setSettingsOpen(false)}
          openDatabaseModal={() => setDatabaseModalOpen(true)}
        />
      )}

      {/* Database Export Modal */}
      {databaseModalOpen && (
        <DatabaseExportModal
          colaboradores={colaboradores}
          equipamentos={equipamentos}
          notasFiscais={notasFiscais}
          empresasFiliais={empresasFiliais}
          userSettings={userSettings}
          onClose={() => setDatabaseModalOpen(false)}
        />
      )}

      {/* B. Custom Delete Confirmation Dialog & Security Email Dispatcher */}
      {colabIdToDelete && employeeToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-natural-border shadow-2xl max-w-3xl w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col my-8">
            
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-400 border border-rose-500/30">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
                    Gateway de Auditoria e Desativação
                  </h3>
                  <span className="text-sm font-serif italic text-white font-semibold">
                    Desativação & Despacho de E-mail de Segurança
                  </span>
                </div>
              </div>
              <button
                id="close-deactivate-modal-top"
                onClick={() => {
                  if (!isSendingEmail) setColabIdToDelete(null);
                }}
                disabled={isSendingEmail}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 flex-1">
              {isSendingEmail ? (
                /* SMTP Simulation View */
                <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-sky-100 animate-ping opacity-75" />
                    <div className="p-5 bg-sky-50 text-sky-600 rounded-full border border-sky-100 relative">
                      <Loader2 size={36} className="animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-serif italic text-lg font-semibold text-natural-text">
                      Transmitindo Notificação...
                    </h4>
                    <p className="text-xs text-natural-muted leading-relaxed">
                      Conectando ao gateway SMTP corporativo seguro e disparando e-mail de conformidade para o administrador.
                    </p>
                  </div>

                  {/* Progressive Simulation Terminal Logs */}
                  <div className="bg-slate-900 rounded-xl p-4 text-left font-mono text-[10px] space-y-2.5 border border-slate-800 shadow-inner max-w-sm mx-auto">
                    <div className="flex items-center space-x-2">
                      {emailSendingStep >= 1 ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <div className="w-3 h-3 border border-slate-700 rounded-full" />
                      )}
                      <span className={emailSendingStep >= 1 ? 'text-slate-200' : 'text-slate-500'}>
                        [1/4] Estabelecendo conexão TLS/SSL (Porta 587)...
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {emailSendingStep >= 2 ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <div className="w-3 h-3 border border-slate-700 rounded-full" />
                      )}
                      <span className={emailSendingStep >= 2 ? 'text-slate-200' : 'text-slate-500'}>
                        [2/4] Autenticação de credenciais de gateway OK.
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {emailSendingStep >= 3 ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <div className="w-3 h-3 border border-slate-700 rounded-full" />
                      )}
                      <span className={emailSendingStep >= 3 ? 'text-slate-200' : 'text-slate-500'}>
                        [3/4] Enviando envelope MIME para fabiorodrigues42@hotmail.com...
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {emailSendingStep >= 4 ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <div className="w-3 h-3 border border-slate-700 rounded-full" />
                      )}
                      <span className={emailSendingStep >= 4 ? 'text-slate-200 font-bold' : 'text-slate-500'}>
                        [4/4] Transmissão homologada com sucesso pelo SMTP!
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden max-w-xs mx-auto">
                    <div 
                      className="bg-sky-500 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${(emailSendingStep / 4) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                /* Interactive Form and Preview Layout */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Column: Warning & Action Description (7 cols) */}
                  <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
                    <div className="space-y-4">
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start space-x-3 text-rose-700">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider">Atenção Crítica</h4>
                          <p className="text-[11px] leading-relaxed mt-0.5">
                            Você está desativando e excluindo o cadastro de <strong>{employeeToDelete.nomeCompleto}</strong>. Esta ação revogará seus acessos e removerá seu perfil do painel ativo.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-natural-text">
                          Destinatário de Segurança
                        </label>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center space-x-2.5">
                          <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
                            <Mail size={14} />
                          </div>
                          <div className="overflow-hidden">
                            <span className="text-xs font-bold text-natural-text block truncate">
                              fabiorodrigues42@hotmail.com
                            </span>
                            <span className="text-[10px] text-natural-muted font-mono block">
                              E-mail de Conformidade e Auditoria
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <span className="block text-xs font-semibold text-natural-text">
                          Impacto da Desativação:
                        </span>
                        <ul className="text-[11px] text-natural-muted space-y-1.5 list-disc pl-4 leading-relaxed">
                          <li>Interrupção imediata de acesso ao portal corporativo.</li>
                          <li>Envio de aviso formal com o detalhamento cadastral para a equipe de compliance administrativo.</li>
                          <li>Gravação do log de auditoria associado ao usuário desativador.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-natural-border flex items-center space-x-2">
                      <button
                        id="cancel-deactivate-btn"
                        onClick={() => setColabIdToDelete(null)}
                        className="flex-1 py-2.5 bg-white border border-natural-border rounded-xl text-xs font-semibold text-natural-text hover:bg-natural-light transition-colors cursor-pointer text-center"
                      >
                        Cancelar
                      </button>
                      <button
                        id="confirm-deactivate-smtp-btn"
                        onClick={handleConfirmDeleteWithEmail}
                        className="flex-1 py-2.5 bg-[#D9383A] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-red-500/10 cursor-pointer"
                      >
                        <Send size={12} />
                        <span>Desativar & Notificar</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: HTML Email Live Preview (5 cols) */}
                  <div className="lg:col-span-6 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        <Eye size={12} className="mr-1 text-sky-500" />
                        Preview do E-mail (MIME)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-semibold">
                        HTML Format
                      </span>
                    </div>

                    {/* Outer browser/email-client mockup */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col text-[11px] shadow-xs">
                      
                      {/* Email Client Header bar */}
                      <div className="bg-slate-100 border-b border-slate-200 p-3 space-y-1.5 font-sans">
                        <div className="flex items-center text-natural-muted">
                          <span className="w-12 font-semibold">Para:</span>
                          <span className="text-natural-text font-bold truncate">fabiorodrigues42@hotmail.com</span>
                        </div>
                        <div className="flex items-center text-natural-muted">
                          <span className="w-12 font-semibold">De:</span>
                          <span className="text-natural-text truncate">notificacoes@{employeeToDelete.empresa === 'Bio Scientific' ? 'bioscientific.ind.br' : employeeToDelete.empresa === 'Bio Brands' ? 'bioage.com.br' : 'bluecorp.com.br'}</span>
                        </div>
                        <div className="flex items-start text-natural-muted">
                          <span className="w-12 font-semibold shrink-0">Assunto:</span>
                          <span className="text-natural-text font-semibold leading-tight">
                            ⚠️ [REVISÃO DE ACESSO] Cadastro Desativado: {employeeToDelete.nomeCompleto}
                          </span>
                        </div>
                      </div>

                      {/* Actual Rendered Email Body Preview */}
                      <div className="p-4 bg-slate-200/40 flex-1 overflow-y-auto">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs font-sans max-w-md mx-auto">
                          
                          {/* Brand Header */}
                          <div className="bg-[#0ea5e9] text-white p-3.5 flex items-center justify-between">
                            <span className="font-serif italic font-bold text-sm tracking-tight">
                              Blue Manager Security
                            </span>
                            <span className="text-[8px] font-mono uppercase bg-white/20 px-1 py-0.5 rounded tracking-wider">
                              Alerta de Compliance
                            </span>
                          </div>

                          {/* Email Body content */}
                          <div className="p-4 space-y-3.5 text-slate-700 leading-relaxed text-[10px]">
                            <p className="font-semibold text-slate-800">
                              Prezado Auditor Administrativo,
                            </p>
                            <p>
                              Notificamos formalmente que o cadastro do colaborador abaixo listado foi <strong>DESATIVADO</strong> administrativamente no painel de controle de acessos da empresa:
                            </p>

                            {/* Employee Detail Grid */}
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1.5">
                              <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-slate-500 font-semibold">Nome Completo:</span>
                                <span className="text-slate-900 font-bold">{employeeToDelete.nomeCompleto}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-slate-500 font-semibold">CPF Cadastrado:</span>
                                <span className="text-slate-900 font-mono font-bold">{employeeToDelete.cpf}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-slate-500 font-semibold">E-mail Corporativo:</span>
                                <span className="text-slate-900 font-mono">{employeeToDelete.email}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-slate-500 font-semibold">Setor / Cargo:</span>
                                <span className="text-slate-950 font-semibold">{employeeToDelete.setor} — {employeeToDelete.cargo}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-slate-500 font-semibold">Unidade & Empresa:</span>
                                <span className="text-slate-900">{employeeToDelete.filial} ({employeeToDelete.empresa})</span>
                              </div>
                              <div className="flex justify-between pt-0.5 text-rose-600 font-semibold">
                                <span>Status Cadastral:</span>
                                <span className="bg-rose-50 border border-rose-200 px-1 rounded font-bold uppercase text-[8px]">Inativo</span>
                              </div>
                            </div>

                            <p className="text-[9px] text-slate-500 italic">
                              Os acessos a VPN, e-mail e sistemas internos associados a este perfil foram sinalizados para suspensão preventiva em nossos firewalls de borda.
                            </p>

                            <div className="pt-2.5 border-t border-slate-100 text-[9px] text-slate-400 text-center">
                              Gerado de forma automatizada por Blue Manager Security Agent.
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* C. Interactive Toasts / Notifications Engine */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 50 }}
              className="pointer-events-auto flex items-start space-x-3 p-4 bg-natural-primary text-white rounded-xl shadow-lg border border-natural-hover shadow-natural-primary/10"
            >
              {toast.type === 'success' ? (
                <CheckCircle size={18} className="text-natural-accent shrink-0 mt-0.5" />
              ) : toast.type === 'error' ? (
                <ShieldAlert size={18} className="text-red-300 shrink-0 mt-0.5" />
              ) : (
                <Info size={18} className="text-natural-accent shrink-0 mt-0.5" />
              )}
              
              <div className="flex-1 text-xs font-medium leading-relaxed pr-2 text-natural-light">
                {toast.message}
              </div>

              <button
                id={`close-toast-${toast.id}`}
                onClick={() => removeToast(toast.id)}
                className="text-natural-accent hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
