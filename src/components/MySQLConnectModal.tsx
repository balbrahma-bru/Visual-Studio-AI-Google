import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  KeyRound, 
  Server, 
  Terminal, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  RefreshCw,
  ShieldCheck,
  HardDrive,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Layers
} from 'lucide-react';
import { Colaborador, Equipamento, NotaFiscal, EmpresaFilial, UserSettings } from '../types';
import { generateMySQLScript } from '../utils/mysqlExport';

interface MySQLConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradores?: Colaborador[];
  equipamentos?: Equipamento[];
  notasFiscais?: NotaFiscal[];
  empresasFiliais?: EmpresaFilial[];
  userSettings?: UserSettings;
  onSuccessNotification?: (msg: string) => void;
  onLoadColaboradores?: (colabs: Colaborador[]) => void;
}

interface TestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  serverInfo?: {
    version: string;
    currentUser: string;
    serverTime: string;
    activeDatabase: string | null;
  };
  databases?: string[];
  tables?: { name: string }[];
  error?: {
    code: string;
    errno?: number;
    sqlState?: string;
    sqlMessage?: string;
    message: string;
    tip?: string;
  };
}

export default function MySQLConnectModal({
  isOpen,
  onClose,
  colaboradores = [],
  equipamentos = [],
  notasFiscais = [],
  empresasFiliais = [],
  userSettings,
  onSuccessNotification,
  onLoadColaboradores
}: MySQLConnectModalProps) {
  // Connection state - Defaulting to user's exact specification:
  // IP: 100.24.209.39, Port: 3306, User: root
  const [host, setHost] = useState<string>('100.24.209.39');
  const [port, setPort] = useState<number>(3306);
  const [user, setUser] = useState<string>('root');
  const [password, setPassword] = useState<string>('');
  const [database, setDatabase] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Execution state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isDeployingSchema, setIsDeployingSchema] = useState<boolean>(false);
  const [deployMessage, setDeployMessage] = useState<string | null>(null);
  const [isFetchingColabs, setIsFetchingColabs] = useState<boolean>(false);
  const [fetchColabsMessage, setFetchColabsMessage] = useState<string | null>(null);

  // Load any initial configuration from server if available
  useEffect(() => {
    if (isOpen) {
      fetch('/api/mysql/config')
        .then((res) => res.json())
        .then((data) => {
          if (data.defaultHost) setHost(data.defaultHost);
          if (data.defaultPort) setPort(Number(data.defaultPort));
          if (data.defaultUser) setUser(data.defaultUser);
          if (data.defaultDatabase) setDatabase(data.defaultDatabase);
        })
        .catch((err) => {
          console.warn('Usando valores padrão de conexão:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);
    setTestResult(null);
    setDeployMessage(null);

    try {
      const response = await fetch('/api/mysql/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: host.trim(),
          port: Number(port),
          user: user.trim(),
          password: password,
          database: database.trim() || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          latencyMs: data.latencyMs,
          message: data.message || 'Conexão efetuada com sucesso!',
          serverInfo: data.serverInfo,
          databases: data.databases || [],
          tables: data.tables || []
        });
        if (onSuccessNotification) {
          onSuccessNotification(`Conexão bem-sucedida ao MySQL em ${host}:${port} (${data.latencyMs}ms)!`);
        }
      } else {
        setTestResult({
          success: false,
          latencyMs: data.latencyMs || 0,
          message: data.error?.message || 'Falha ao conectar com o MySQL.',
          error: data.error || {
            code: 'UNKNOWN_ERROR',
            message: data.error?.message || 'Erro inesperado na conexão.'
          }
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: 'Erro de comunicação com o servidor local.',
        error: {
          code: 'FETCH_ERROR',
          message: err.message || 'Não foi possível enviar requisição de teste para o backend local.'
        }
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeploySchema = async () => {
    if (!testResult?.success) return;
    setIsDeployingSchema(true);
    setDeployMessage(null);

    try {
      const dbTarget = database.trim() || 'colaboradores_db';
      const defaultSettings: UserSettings = userSettings || {
        nomeUsuario: 'Administrador',
        email: 'admin@empresa.com',
        empresa: 'Bio Brands',
        tema: 'light'
      };

      const sql = generateMySQLScript(
        colaboradores,
        equipamentos,
        notasFiscais,
        defaultSettings,
        empresasFiliais
      );

      const res = await fetch('/api/mysql/execute-ddl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: host.trim(),
          port: Number(port),
          user: user.trim(),
          password: password,
          database: dbTarget,
          createDbIfNotExists: true,
          sql
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDeployMessage(`Tabelas e registros criados com sucesso no banco '${dbTarget}'!`);
        // Refresh connection info to view updated databases/tables
        handleTestConnection();
      } else {
        setDeployMessage(`Erro ao criar tabelas: ${data.error || 'Falha na execução'}`);
      }
    } catch (e: any) {
      setDeployMessage(`Erro de rede ao enviar script: ${e.message}`);
    } finally {
      setIsDeployingSchema(false);
    }
  };

  const grantSqlCmd = `CREATE USER IF NOT EXISTS '${user || 'root'}'@'%' IDENTIFIED BY 'sua_senha';\nGRANT ALL PRIVILEGES ON *.* TO '${user || 'root'}'@'%' WITH GRANT OPTION;\nFLUSH PRIVILEGES;`;

  const copyGrantSql = () => {
    navigator.clipboard.writeText(grantSqlCmd);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleLoadActiveColaboradores = async () => {
    setIsFetchingColabs(true);
    setFetchColabsMessage(null);
    try {
      const res = await fetch('/api/mysql/colaboradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port,
          user,
          password,
          database
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.tableNotFound) {
          setFetchColabsMessage(data.message || 'Tabela tb_colaborador não encontrada no banco selecionado.');
          return;
        }
        const colabs = data.colaboradores || [];
        if (onLoadColaboradores) {
          onLoadColaboradores(colabs);
        }
        try {
          localStorage.setItem('colab_source_mysql', 'true');
          localStorage.setItem('colab_registry_data', JSON.stringify(colabs));
        } catch {}
        setFetchColabsMessage(`${colabs.length} colaboradores com status ativo = 1 carregados e apresentados na tela!`);
        if (onSuccessNotification) {
          onSuccessNotification(`${colabs.length} colaboradores com status ativo = 1 carregados com sucesso!`);
        }
      } else {
        setFetchColabsMessage(`Erro: ${data.error || 'Falha ao buscar dados'}`);
      }
    } catch (e: any) {
      setFetchColabsMessage(`Erro de rede: ${e.message}`);
    } finally {
      setIsFetchingColabs(false);
    }
  };

  return (
    <div 
      id="mysql-connection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-inner text-indigo-300">
              <Database size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base md:text-lg tracking-tight text-white">
                  Conexão MySQL Remoto
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  {host}:{port}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Teste de conectividade direta com o banco de dados MySQL
              </p>
            </div>
          </div>

          <button
            id="btn-close-mysql-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Connection Parameters Form */}
          <form onSubmit={handleTestConnection} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Host */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                  <Server size={13} className="text-indigo-600" />
                  <span>IP do Servidor / Host</span>
                </label>
                <input
                  id="input-mysql-host"
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="ex: 100.24.209.39"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all"
                  required
                />
              </div>

              {/* Port */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                  <Terminal size={13} className="text-indigo-600" />
                  <span>Porta</span>
                </label>
                <input
                  id="input-mysql-port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder="3306"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all"
                  required
                />
              </div>

              {/* User */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck size={13} className="text-indigo-600" />
                  <span>Usuário</span>
                </label>
                <input
                  id="input-mysql-user"
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="root"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                    <KeyRound size={13} className="text-indigo-600" />
                    <span>Senha do MySQL</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Pressione Enter ou clique em Testar</span>
                </div>
                <div className="relative">
                  <input
                    id="input-mysql-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha do MySQL..."
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Database (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                  <Database size={13} className="text-indigo-600" />
                  <span>Banco de Dados (Opcional)</span>
                </label>
                <input
                  id="input-mysql-database"
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder="ex: colaboradores_db (ou deixe vazio)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Test Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <HardDrive size={14} className="text-slate-400" />
                <span>Alvo: <strong className="font-mono text-slate-700">{user}@{host}:{port}</strong></span>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setHost('100.24.209.39');
                    setPort(3306);
                    setUser('root');
                    setPassword('');
                    setDatabase('');
                    setTestResult(null);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Restaurar Padrão
                </button>

                <button
                  id="btn-test-mysql-connection"
                  type="submit"
                  disabled={isTesting}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Conectando ao MySQL...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Testar Conexão Agora</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Test Result Section */}
          {testResult && (
            <div 
              id="mysql-test-result-box"
              className={`rounded-xl border p-4.5 transition-all ${
                testResult.success 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-start space-x-3">
                {testResult.success ? (
                  <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-sm">
                      {testResult.success ? 'Conexão Bem-Sucedida!' : 'Falha na Conexão com o MySQL'}
                    </h4>
                    {testResult.latencyMs > 0 && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/80 border border-current shadow-2xs">
                        <Clock size={11} />
                        <span>Latência: {testResult.latencyMs}ms</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed">
                    {testResult.message}
                  </p>

                  {/* Success details */}
                  {testResult.success && testResult.serverInfo && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                      <div className="bg-white/70 p-2 rounded-lg border border-emerald-100">
                        <span className="text-emerald-700 font-semibold block">Versão do MySQL:</span>
                        <span className="font-mono text-emerald-950 font-bold">{testResult.serverInfo.version}</span>
                      </div>
                      <div className="bg-white/70 p-2 rounded-lg border border-emerald-100">
                        <span className="text-emerald-700 font-semibold block">Autenticado como:</span>
                        <span className="font-mono text-emerald-950 font-bold">{testResult.serverInfo.currentUser}</span>
                      </div>
                      <div className="bg-white/70 p-2 rounded-lg border border-emerald-100">
                        <span className="text-emerald-700 font-semibold block">Data/Hora Servidor:</span>
                        <span className="font-mono text-emerald-950">{new Date(testResult.serverInfo.serverTime).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  )}

                  {/* List of databases detected */}
                  {testResult.success && testResult.databases && testResult.databases.length > 0 && (
                    <div className="mt-3 pt-2">
                      <span className="text-xs font-bold text-emerald-800 block mb-1.5">
                        Bancos de dados disponíveis no servidor ({testResult.databases.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white/80 rounded-lg border border-emerald-100 font-mono text-[11px]">
                        {testResult.databases.map((dbName) => (
                          <button
                            key={dbName}
                            onClick={() => {
                              setDatabase(dbName);
                              handleTestConnection();
                            }}
                            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              database === dbName 
                                ? 'bg-emerald-600 text-white border-emerald-600 font-bold' 
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={`Selecionar banco ${dbName}`}
                          >
                            {dbName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deploy Schema Option when successfully connected */}
                  {testResult.success && (
                    <div className="mt-4 pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/60 p-3 rounded-xl border border-emerald-200">
                      <div>
                        <span className="text-xs font-bold text-emerald-950 block">
                          Inicializar tabelas do sistema no MySQL
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          Cria as tabelas de colaboradores, filiais, equipamentos e notas fiscais no banco selecionado.
                        </span>
                      </div>
                      <button
                        id="btn-deploy-schema-mysql"
                        onClick={handleDeploySchema}
                        disabled={isDeployingSchema}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 shrink-0"
                      >
                        {isDeployingSchema ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Executando DDL...</span>
                          </>
                        ) : (
                          <>
                            <Layers size={13} />
                            <span>Criar / Atualizar Tabelas</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Load Active Collaborators (ativo = 1) */}
                  {testResult.success && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-50/60 p-3 rounded-xl border border-indigo-200">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-indigo-950 block">
                            Consultar tabela tb_colaborador
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
                            ativo = 1
                          </span>
                        </div>
                        <span className="text-[11px] text-indigo-800">
                          Recupera os registros ativos e apresenta diretamente na página Colaboradores.
                        </span>
                      </div>
                      <button
                        id="btn-load-tb-colaboradores"
                        type="button"
                        onClick={handleLoadActiveColaboradores}
                        disabled={isFetchingColabs}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 shrink-0"
                      >
                        {isFetchingColabs ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Buscando...</span>
                          </>
                        ) : (
                          <>
                            <Database size={13} />
                            <span>Carregar (ativo = 1)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {fetchColabsMessage && (
                    <div className="p-2.5 rounded-lg bg-indigo-100 border border-indigo-300 text-xs font-medium text-indigo-900 mt-2">
                      {fetchColabsMessage}
                    </div>
                  )}

                  {deployMessage && (
                    <div className="p-2.5 rounded-lg bg-emerald-100 border border-emerald-300 text-xs font-medium text-emerald-900 mt-2">
                      {deployMessage}
                    </div>
                  )}

                  {/* Failure details & diagnostics */}
                  {!testResult.success && testResult.error && (
                    <div className="space-y-3 mt-3 pt-2 border-t border-rose-200/60">
                      {testResult.error.tip && (
                        <div className="bg-white/80 p-3 rounded-lg border border-rose-200 text-xs text-rose-950 space-y-1">
                          <strong className="text-rose-900 block font-bold">Diagnóstico & Sugestão de Correção:</strong>
                          <pre className="font-sans whitespace-pre-line text-[11px] leading-relaxed text-slate-700">
                            {testResult.error.tip}
                          </pre>
                        </div>
                      )}

                      <div className="bg-rose-100/50 p-2 rounded-lg border border-rose-200 font-mono text-[10px] text-rose-800 space-y-0.5">
                        <div>Código: <strong className="text-rose-950">{testResult.error.code}</strong></div>
                        {testResult.error.sqlMessage && (
                          <div>Detalhes: {testResult.error.sqlMessage}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Guide & Remote Grant Assistant */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <Terminal size={14} className="text-indigo-600" />
                <span>Instruções para liberação de acesso remoto no servidor MySQL</span>
              </div>
              <button
                onClick={copyGrantSql}
                className="flex items-center space-x-1 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-md transition-all cursor-pointer shadow-2xs"
                title="Copiar comando SQL"
              >
                {copiedScript ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedScript ? 'Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Por padrão de segurança, o usuário <code className="px-1 py-0.5 rounded bg-slate-200 font-mono text-slate-800">root</code> do MySQL aceita conexões apenas locais (<code className="px-1 py-0.5 rounded bg-slate-200 font-mono text-slate-800">localhost</code>). Se receber erro de acesso negado ou timeout, execute no terminal do seu servidor em <strong className="font-mono">100.24.209.39</strong>:
            </p>

            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto select-all">
              <span className="text-slate-400"># 1. No arquivo /etc/mysql/mysql.conf.d/mysqld.cnf certifique-se:</span><br/>
              <span className="text-amber-400">bind-address = 0.0.0.0</span><br/><br/>
              <span className="text-slate-400"># 2. No console MySQL para liberar o usuário:</span><br/>
              <span className="text-emerald-400">{grantSqlCmd}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Driver MySQL2 Nativo (Node.js)</span>
          </span>

          <button
            id="btn-close-mysql-modal-footer"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
