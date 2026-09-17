import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  KeyRound, 
  Server, 
  Table, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Check, 
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Users
} from 'lucide-react';
import { Colaborador } from '../types';

interface MySQLColaboradoresSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyColaboradores: (colaboradores: Colaborador[]) => void;
  currentActiveCount: number;
  initialColaboradores?: Colaborador[];
}

export default function MySQLColaboradoresSyncModal({
  isOpen,
  onClose,
  onApplyColaboradores,
  currentActiveCount,
  initialColaboradores = []
}: MySQLColaboradoresSyncModalProps) {
  const [host, setHost] = useState('100.24.209.39');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState(() => {
    try {
      return sessionStorage.getItem('mysql_cached_password') || '';
    } catch {
      return '';
    }
  });
  const [database, setDatabase] = useState('colaboradores_db');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorTip, setErrorTip] = useState<string | null>(null);
  const [tableNotFound, setTableNotFound] = useState(false);
  const [fetchedColaboradores, setFetchedColaboradores] = useState<Colaborador[] | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && password && !fetchedColaboradores && !isLoading) {
      // Auto-fetch if password was already saved in session
      handleFetchActiveColaboradores();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFetchActiveColaboradores = async (forceCreateIfMissing = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    setErrorTip(null);
    setTableNotFound(false);
    setSuccessInfo(null);

    try {
      // Cache password in session storage for smooth workflow
      try {
        if (password) sessionStorage.setItem('mysql_cached_password', password);
      } catch {}

      const response = await fetch('/api/mysql/colaboradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: Number(port) || 3306,
          user,
          password,
          database,
          createIfMissing: forceCreateIfMissing
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || 'Falha ao consultar tb_colaborador no MySQL.');
        setErrorTip(data.tip || null);
        return;
      }

      if (data.tableNotFound) {
        setTableNotFound(true);
        setErrorMsg(data.message || "A tabela 'tb_colaborador' não foi encontrada no banco.");
        return;
      }

      const activeList: Colaborador[] = data.colaboradores || [];
      setFetchedColaboradores(activeList);
      setSuccessInfo(`${activeList.length} colaboradores com status ativo = 1 carregados de ${data.database}.${data.table}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de rede ao comunicar com o servidor backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTableAndSeed = async () => {
    setIsCreatingTable(true);
    setErrorMsg(null);
    setErrorTip(null);

    try {
      const response = await fetch('/api/mysql/create-tb-colaborador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: Number(port) || 3306,
          user,
          password,
          database,
          colaboradores: initialColaboradores
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao criar tabela tb_colaborador.');
      }

      // Re-fetch now that table exists
      setTableNotFound(false);
      await handleFetchActiveColaboradores();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsCreatingTable(false);
    }
  };

  const handleApplyToPage = () => {
    if (fetchedColaboradores && fetchedColaboradores.length > 0) {
      onApplyColaboradores(fetchedColaboradores);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="mysql-sync-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-natural-border w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-6 max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">
              <Database size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white tracking-tight">
                  Consultar tb_colaborador (MySQL)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ativo = 1
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Host: <span className="font-mono text-indigo-300">100.24.209.39:3306</span> • Usuário: <span className="font-mono text-indigo-300">root</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Connection form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Host / IP</label>
              <input 
                type="text" 
                value={host} 
                onChange={(e) => setHost(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Porta</label>
              <input 
                type="number" 
                value={port} 
                onChange={(e) => setPort(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Usuário</label>
              <input 
                type="text" 
                value={user} 
                onChange={(e) => setUser(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Banco de Dados</label>
              <input 
                type="text" 
                value={database} 
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="colaboradores_db"
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Senha do usuário root
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha do MySQL..."
                  className="w-full text-xs font-mono pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <KeyRound size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                id="btn-execute-query-colabs"
                onClick={() => handleFetchActiveColaboradores(false)}
                disabled={isLoading}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Consultar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SQL Query explanation banner */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-indigo-900">
            <Table size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-indigo-950">
                Consulta SQL Executada no Servidor:
              </p>
              <code className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800 inline-block">
                SELECT * FROM tb_colaborador WHERE ativo = 1;
              </code>
              <p className="text-[11px] text-indigo-800">
                Carrega apenas registros válidos com status ativo, normalizando campos como CPF, Nome de Exibição, Cargo e Setor.
              </p>
            </div>
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
              {errorTip && (
                <div className="text-[11px] bg-white/80 p-2.5 rounded-lg border border-rose-200 text-rose-900">
                  <strong>Dica de Correção:</strong> {errorTip}
                </div>
              )}
              {tableNotFound && (
                <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                  <span className="text-[11px]">Deseja criar a tabela agora com os dados ativos do sistema?</span>
                  <button
                    onClick={handleCreateTableAndSeed}
                    disabled={isCreatingTable}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    {isCreatingTable ? <Loader2 size={12} className="animate-spin" /> : <PlusCircle size={12} />}
                    <span>Criar tb_colaborador</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success / Result Preview */}
          {fetchedColaboradores && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    {fetchedColaboradores.length} colaborador(es) com status ativo = 1 encontrados
                  </span>
                </div>
                {successInfo && (
                  <span className="text-[11px] font-mono text-slate-500">
                    {successInfo}
                  </span>
                )}
              </div>

              {/* Table preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Nome Completo</th>
                      <th className="px-3 py-2">Nome de Exibição</th>
                      <th className="px-3 py-2">CPF</th>
                      <th className="px-3 py-2">Cargo</th>
                      <th className="px-3 py-2">Setor</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fetchedColaboradores.map((colab, idx) => (
                      <tr key={colab.id || idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800">{colab.nomeCompleto}</td>
                        <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{colab.exibicao}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">{colab.cpf || '-'}</td>
                        <td className="px-3 py-2 text-slate-600">{colab.cargo}</td>
                        <td className="px-3 py-2 text-slate-500">{colab.setor}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            Ativo (1)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Atual na tela: <strong>{currentActiveCount}</strong> colaboradores
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              id="btn-apply-colabs-to-page"
              onClick={handleApplyToPage}
              disabled={!fetchedColaboradores || fetchedColaboradores.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Users size={14} />
              <span>Apresentar na Página Colaboradores</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
