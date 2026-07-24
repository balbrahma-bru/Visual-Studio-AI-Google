import React, { useState } from 'react';
import { Settings, Save, X, Building, User, Mail, ShieldAlert, Database, Download } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  currentSettings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
  openDatabaseModal?: () => void;
}

export default function SettingsModal({ currentSettings, onSave, onClose, openDatabaseModal }: SettingsModalProps) {
  const [nomeUsuario, setNomeUsuario] = useState(currentSettings.nomeUsuario);
  const [empresa, setEmpresa] = useState(currentSettings.empresa);
  const [email, setEmail] = useState(currentSettings.email);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeUsuario.trim() || !empresa.trim() || !email.trim()) {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um endereço de e-mail válido.');
      return;
    }

    onSave({
      nomeUsuario: nomeUsuario.trim(),
      empresa: empresa.trim(),
      email: email.trim(),
      tema: currentSettings.tema,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Settings size={18} />
            </div>
            <span className="font-sans font-bold text-slate-800 text-sm">
              Configurações do Sistema
            </span>
          </div>
          <button
            id="close-settings-modal-btn"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start space-x-2 text-xs text-rose-800">
              <ShieldAlert size={14} className="shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3.5">
            {/* Nome do Usuário */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Nome do Usuário Administrador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={14} />
                </div>
                <input
                  id="settings-user-name"
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  value={nomeUsuario}
                  onChange={(e) => setNomeUsuario(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Nome da Empresa */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Nome da Corporação / Instituição
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building size={14} />
                </div>
                <input
                  id="settings-company-name"
                  type="text"
                  required
                  placeholder="Nome Fantasia da Empresa"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                * Esse nome é usado de forma dinâmica nos cabeçalhos dos relatórios PDF exportados.
              </p>
            </div>

            {/* E-mail de Contato */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                E-mail Administrativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={14} />
                </div>
                <input
                  id="settings-email"
                  type="email"
                  required
                  placeholder="email@corporativo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Banco de Dados MySQL Export Block */}
            {openDatabaseModal && (
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database size={15} className="text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Banco de Dados MySQL
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold bg-white px-2 py-0.5 rounded border border-indigo-100 text-indigo-700">
                    .SQL DDL/DML
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Exporte todas as tabelas, relacionamentos, chaves e dados para um arquivo <code className="font-mono text-indigo-700">bio_gestao_db.sql</code>.
                </p>
                <button
                  type="button"
                  id="settings-open-db-btn"
                  onClick={() => {
                    onClose();
                    openDatabaseModal();
                  }}
                  className="w-full py-2 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Download size={13} />
                  <span>Visualizar & Baixar Script MySQL</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              id="cancel-settings-btn"
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="save-settings-btn"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Save size={13} />
              <span>Salvar Alterações</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
