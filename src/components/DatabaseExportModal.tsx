import React, { useState } from 'react';
import { Database, Download, Copy, Check, X, Table, ShieldCheck, Code, ArrowRight } from 'lucide-react';
import { Colaborador, Equipamento, NotaFiscal, UserSettings, EmpresaFilial } from '../types';
import { generateMySQLScript, downloadMySQLFile } from '../utils/mysqlExport';

interface DatabaseExportModalProps {
  colaboradores: Colaborador[];
  equipamentos: Equipamento[];
  notasFiscais: NotaFiscal[];
  empresasFiliais?: EmpresaFilial[];
  userSettings: UserSettings;
  onClose: () => void;
}

export default function DatabaseExportModal({
  colaboradores,
  equipamentos,
  notasFiscais,
  empresasFiliais = [],
  userSettings,
  onClose
}: DatabaseExportModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sql'>('overview');
  const [copied, setCopied] = useState(false);

  const sqlScript = generateMySQLScript(colaboradores, equipamentos, notasFiscais, userSettings, empresasFiliais);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    downloadMySQLFile(colaboradores, equipamentos, notasFiscais, userSettings, empresasFiliais);
  };

  const tableSummary = [
    {
      name: 'empresas_filiais',
      description: 'Cadastro institucional de empresas, filiais, razões sociais e faixas IP',
      count: empresasFiliais.length,
      keys: 'PRIMARY KEY (id), KEY (empresa, filial, rede)',
    },
    {
      name: 'colaboradores',
      description: 'Gestão de funcionários, setores, cargos, documentos e filiais',
      count: colaboradores.length,
      keys: 'PRIMARY KEY (id), UNIQUE (cpf, email)',
    },
    {
      name: 'equipamentos',
      description: 'Ativos de TI, patrimônios, números de série e alocações',
      count: equipamentos.length,
      keys: 'PRIMARY KEY (id), UNIQUE (patrimonio), FK (colaborador_id)',
    },
    {
      name: 'historico_equipamentos',
      description: 'Auditoria de transferências e alterações de ativos',
      count: equipamentos.reduce((acc, e) => acc + (e.historico?.length || 0), 0),
      keys: 'PRIMARY KEY (id), FK (equipamento_id)',
    },
    {
      name: 'notas_fiscais',
      description: 'Documentos fiscais, empresas contratantes e valores',
      count: notasFiscais.length,
      keys: 'PRIMARY KEY (id)',
    },
    {
      name: 'nota_fiscal_itens',
      description: 'Produtos e serviços discriminados nas notas',
      count: notasFiscais.reduce((acc, nf) => acc + nf.itens.length, 0),
      keys: 'PRIMARY KEY (id), FK (nota_fiscal_id)',
    },
    {
      name: 'nota_fiscal_anexos',
      description: 'Documentos PDF/XML e comprovantes de pagamento',
      count: notasFiscais.reduce((acc, nf) => acc + (nf.notaFiscalFile ? 1 : 0) + (nf.outrosArquivos?.length || 0), 0),
      keys: 'PRIMARY KEY (id), FK (nota_fiscal_id)',
    },
    {
      name: 'configuracoes_sistema',
      description: 'Parâmetros administrativos e preferências de perfil',
      count: 1,
      keys: 'PRIMARY KEY (id)',
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-natural-border shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-natural-border shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
              <Database size={18} />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-0.5">
                <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 uppercase">
                  MySQL 8.0+ / MariaDB
                </span>
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded">
                  UTF8MB4
                </span>
              </div>
              <h2 className="text-base font-serif italic font-bold text-natural-text">
                Estrutura & Script do Banco de Dados MySQL
              </h2>
            </div>
          </div>
          
          <button
            id="btn-close-db-modal"
            onClick={onClose}
            className="p-1.5 text-natural-muted hover:text-natural-text hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-3 bg-white border-b border-natural-border flex items-center justify-between shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-natural-muted hover:text-natural-text'
              }`}
            >
              <Table size={14} />
              <span>Modelagem & Tabelas ({tableSummary.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'sql'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-natural-muted hover:text-natural-text'
              }`}
            >
              <Code size={14} />
              <span>Código SQL Completo</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 pb-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download size={14} />
              <span>Baixar Script (.sql)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              
              {/* Informative Banner */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start space-x-3">
                <ShieldCheck size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-semibold text-indigo-900">
                    Estrutura Relacional MySQL Totalmente Mapeada
                  </p>
                  <p className="leading-relaxed">
                    O script abaixo cria o banco de dados <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold">bio_gestao_db</code> com todas as chaves primárias, chaves estrangeiras com regras de exclusão em cascata (<code className="font-mono">ON DELETE CASCADE / SET NULL</code>), índices otimizados, views de relatório e todos os dados cadastrados atualmente no sistema.
                  </p>
                </div>
              </div>

              {/* Grid of Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tableSummary.map((t) => (
                  <div
                    key={t.name}
                    className="p-4 bg-slate-50 rounded-xl border border-natural-border space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Table size={14} className="text-indigo-600" />
                        <span className="font-mono font-bold text-xs text-natural-text">
                          {t.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-semibold">
                        {t.count} registros
                      </span>
                    </div>

                    <p className="text-xs text-natural-muted leading-snug">
                      {t.description}
                    </p>

                    <div className="pt-1 text-[10px] font-mono text-slate-500 bg-white/80 p-2 rounded border border-slate-200/80">
                      <span className="font-semibold text-indigo-700">Chaves/Relacionamentos:</span> {t.keys}
                    </div>
                  </div>
                ))}
              </div>

              {/* Database Diagram View Link */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider mb-1">
                    Download Imediato do SQL
                  </h4>
                  <p className="text-xs text-slate-300">
                    Você pode importar o arquivo gerado diretamente no phpMyAdmin, MySQL Workbench, DBeaver ou via linha de comando (<code className="font-mono text-emerald-400">mysql -u root -p &lt; bio_gestao_db.sql</code>).
                  </p>
                </div>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-2 shrink-0 transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Baixar bio_gestao_db.sql</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-natural-muted font-mono">
                <span>Visualizador do Script DDL/DML MySQL:</span>
                <span>{sqlScript.split('\n').length} linhas</span>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[480px] leading-relaxed border border-slate-800 selection:bg-indigo-500 selection:text-white">
                  <code>{sqlScript}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-natural-border flex items-center justify-between shrink-0">
          <div className="text-[11px] text-natural-muted font-mono">
            Arquivo do script: <span className="font-semibold text-natural-text">/public/bio_gestao_db.sql</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-200 text-natural-text hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Baixar MySQL Script</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
