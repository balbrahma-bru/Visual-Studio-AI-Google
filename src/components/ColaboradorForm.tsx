import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Save, X, Sparkles, HelpCircle, Check, AlertTriangle, Plus, Trash2, Phone } from 'lucide-react';
import { Colaborador } from '../types';
import { SETORES, AVATAR_COLORS, formatCPF, formatRG, formatTelefone, validateCPF } from '../data';

interface ColaboradorFormProps {
  colaboradorToEdit: Colaborador | null;
  onSave: (colaborador: Colaborador) => void;
  onCancel: () => void;
  colaboradores?: Colaborador[];
}

// Options for Empresa and Filial
const EMPRESAS = ['Bio Brands', 'Bio Scientific', 'Terceiros'];
const FILIAIS_BY_EMPRESA: { [key: string]: string[] } = {
  'Bio Brands': ['Rio de Janeiro', 'Paraíba', 'Brusque', 'Moema', 'Vila Madalena', 'Recife'],
  'Bio Scientific': ['Matriz', 'CDBR116'],
  'Terceiros': ['Rio de Janeiro', 'Paraíba', 'Brusque', 'Moema', 'Vila Madalena', 'CDBR116', 'Matriz', 'Recife']
};

const getEmailForExibicao = (nameExib: string, emp: string) => {
  if (!nameExib.trim()) return '';
  const prefix = nameExib
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s.-]/g, '') // keep only safe characters
    .replace(/\s+/g, '.');
    
  let suffix = '@empresa.com.br';
  if (emp === 'Bio Scientific') {
    suffix = '@bioscientific.ind.br';
  } else if (emp === 'Bio Brands') {
    suffix = '@bioage.com.br';
  } else if (emp === 'Terceiros') {
    suffix = '@terceiros.com.br';
  }
  return `${prefix}${suffix}`;
};

export default function ColaboradorForm({ colaboradorToEdit, onSave, onCancel, colaboradores }: ColaboradorFormProps) {
  // Form fields
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [exibicao, setExibicao] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [matricula, setMatricula] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cargo, setCargo] = useState('');
  const [setor, setSetor] = useState('');
  const [email, setEmail] = useState('');
  const [telefones, setTelefones] = useState<string[]>(['']);
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [empresa, setEmpresa] = useState('Bio Brands');
  const [filial, setFilial] = useState('Rio de Janeiro');
  
  // Validation and UI states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(false);

  // Check duplicate Nome Completo and Nome de Exibição in real-time
  const normalizeText = (text: string) =>
    text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const isNomeCompletoDuplicate = useMemo(() => {
    if (!nomeCompleto.trim() || !colaboradores) return false;
    const target = normalizeText(nomeCompleto);
    return colaboradores.some((c) => {
      if (colaboradorToEdit && c.id === colaboradorToEdit.id) return false;
      const isAtivo = (c.status || '').trim().toLowerCase() === 'ativo';
      if (!isAtivo) return false;
      return normalizeText(c.nomeCompleto) === target;
    });
  }, [nomeCompleto, colaboradores, colaboradorToEdit]);

  const isExibicaoDuplicate = useMemo(() => {
    if (!exibicao.trim() || !colaboradores) return false;
    const target = normalizeText(exibicao);
    return colaboradores.some((c) => {
      if (colaboradorToEdit && c.id === colaboradorToEdit.id) return false;
      const isAtivo = (c.status || '').trim().toLowerCase() === 'ativo';
      if (!isAtivo) return false;
      return normalizeText(c.exibicao) === target;
    });
  }, [exibicao, colaboradores, colaboradorToEdit]);

  // If editing, fill the form
  useEffect(() => {
    if (colaboradorToEdit) {
      setNomeCompleto(colaboradorToEdit.nomeCompleto);
      setExibicao(colaboradorToEdit.exibicao);
      setCpf(colaboradorToEdit.cpf);
      setRg(colaboradorToEdit.rg);
      setMatricula(colaboradorToEdit.matricula || '');
      setDataNascimento(colaboradorToEdit.dataNascimento);
      setCargo(colaboradorToEdit.cargo);
      setSetor(colaboradorToEdit.setor);
      setEmail(colaboradorToEdit.email || '');
      
      // Parse multi-line telefones if separated by slash, comma, or newline
      const rawTel = colaboradorToEdit.telefone || '';
      if (rawTel.trim()) {
        const parts = rawTel.split(/\s*(?:\/|,|\n)\s*/).map((p) => p.trim()).filter(Boolean);
        setTelefones(parts.length > 0 ? parts : ['']);
      } else {
        setTelefones(['']);
      }

      setDataAdmissao(colaboradorToEdit.dataAdmissao || '');
      setStatus(colaboradorToEdit.status);
      setEmpresa(colaboradorToEdit.empresa || 'Bio Brands');
      setFilial(colaboradorToEdit.filial || 'Rio de Janeiro');
      setIsEmailManuallyEdited(true);
      
      // Check initial CPF validation
      if (colaboradorToEdit.cpf) {
        setCpfValid(validateCPF(colaboradorToEdit.cpf));
      }
    } else {
      // Clear form
      setNomeCompleto('');
      setExibicao('');
      setCpf('');
      setRg('');
      setMatricula('');
      setDataNascimento('');
      setCargo('');
      setSetor(SETORES[0] || '');
      setEmail('');
      setTelefones(['']);
      setDataAdmissao(new Date().toISOString().split('T')[0]);
      setStatus('Ativo');
      setEmpresa('Bio Brands');
      setFilial('Rio de Janeiro');
      setCpfValid(null);
      setIsEmailManuallyEdited(false);
    }
    setErrors({});
  }, [colaboradorToEdit]);

  // Handle Nome Completo change to auto-suggest Display Name (Nome de Exibição)
  const handleNomeCompletoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNomeCompleto(val);
    
    // Auto-fill short name (first + last name) if exibicao wasn't manually edited yet
    if (!colaboradorToEdit) {
      const parts = val.trim().split(/\s+/);
      let suggestedExibicao = '';
      if (parts.length >= 2) {
        suggestedExibicao = `${parts[0]} ${parts[parts.length - 1]}`;
      } else if (parts.length === 1) {
        suggestedExibicao = parts[0];
      }
      setExibicao(suggestedExibicao);
      
      if (!isEmailManuallyEdited) {
        setEmail(getEmailForExibicao(suggestedExibicao, empresa));
      }
    }
  };

  const handleExibicaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExibicao(val);
    
    if (!isEmailManuallyEdited) {
      setEmail(getEmailForExibicao(val, empresa));
    }
  };

  // Masking functions as user types
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    
    // Live CPF validation
    if (formatted.length === 14) {
      setCpfValid(validateCPF(formatted));
    } else {
      setCpfValid(null);
    }
  };

  const handleRgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRg(formatRG(e.target.value));
  };

  const handleTelefoneChange = (index: number, value: string) => {
    const formatted = formatTelefone(value);
    setTelefones((prev) => {
      const next = [...prev];
      next[index] = formatted;
      return next;
    });
  };

  const handleAddTelefone = () => {
    setTelefones((prev) => [...prev, '']);
  };

  const handleRemoveTelefone = (index: number) => {
    setTelefones((prev) => {
      if (prev.length <= 1) return [''];
      return prev.filter((_, i) => i !== index);
    });
  };

  // Handle Empresa change and update corresponding Filial selection
  const handleEmpresaChange = (novaEmpresa: string) => {
    setEmpresa(novaEmpresa);
    if (!isEmailManuallyEdited) {
      setEmail(getEmailForExibicao(exibicao, novaEmpresa));
    }
  };

  // Compute all available Filiais (ensuring current filial and custom filiais are always included and selectable)
  const filialOptions = useMemo(() => {
    const ALL_KNOWN_FILIAIS = [
      'Rio de Janeiro',
      'Paraíba',
      'Brusque',
      'Moema',
      'Vila Madalena',
      'Recife',
      'Matriz',
      'CDBR116'
    ];
    const preferred = FILIAIS_BY_EMPRESA[empresa] || [];
    const set = new Set([...preferred, ...ALL_KNOWN_FILIAIS]);
    if (filial) set.add(filial);
    if (colaboradorToEdit?.filial) set.add(colaboradorToEdit.filial);
    if (colaboradores) {
      colaboradores.forEach((c) => {
        if (c.filial) set.add(c.filial);
      });
    }
    return Array.from(set).filter(Boolean);
  }, [empresa, filial, colaboradorToEdit, colaboradores]);

  // Validation before saving
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!nomeCompleto.trim()) {
      newErrors.nomeCompleto = 'Nome completo é obrigatório.';
    } else if (isNomeCompletoDuplicate) {
      newErrors.nomeCompleto = 'O Nome Completo digitado já existe em outro colaborador ativo.';
    }

    if (!exibicao.trim()) {
      newErrors.exibicao = 'Nome de exibição é obrigatório.';
    } else if (isExibicaoDuplicate) {
      newErrors.exibicao = 'O Nome de Exibição digitado já existe em outro colaborador ativo.';
    }
    
    // CPF validation (opcional)
    if (cpf && cpf.trim()) {
      if (cpf.length !== 14) {
        newErrors.cpf = 'O CPF deve ter 11 dígitos no formato 000.000.000-00.';
      } else if (!validateCPF(cpf)) {
        newErrors.cpf = 'CPF inválido (dígitos verificadores incorretos).';
      }
    }

    // RG validation (opcional)
    if (rg && rg.trim()) {
      if (rg.length < 5) {
        newErrors.rg = 'RG inválido.';
      }
    }

    if (!dataNascimento) {
      newErrors.dataNascimento = 'Data de nascimento é obrigatória.';
    } else {
      const age = new Date().getFullYear() - new Date(dataNascimento).getFullYear();
      if (age < 14) {
        newErrors.dataNascimento = 'O colaborador deve ter pelo menos 14 anos.';
      } else if (age > 100) {
        newErrors.dataNascimento = 'Verifique o ano de nascimento.';
      }
    }

    if (!cargo.trim()) newErrors.cargo = 'Cargo é obrigatório.';
    if (!setor) newErrors.setor = 'Setor é obrigatório.';
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // scroll to top of form
      const formEl = document.getElementById('colaborador-form');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Success - Create the colaborador object
    const savedColab: Colaborador = {
      id: colaboradorToEdit?.id || `colab-${Date.now()}`,
      nomeCompleto: nomeCompleto.trim(),
      exibicao: exibicao.trim(),
      cpf,
      rg,
      matricula: matricula.trim(),
      dataNascimento,
      cargo: cargo.trim(),
      setor,
      email: email.trim() || getEmailForExibicao(exibicao, empresa),
      telefone: telefones
        .map((t) => t.trim())
        .filter(Boolean)
        .join(' / '),
      dataAdmissao: dataAdmissao || new Date().toISOString().split('T')[0],
      status,
      avatarColor: colaboradorToEdit?.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      empresa,
      filial
    };

    onSave(savedColab);
  };

  return (
    <div className="bg-white border border-natural-border rounded-2xl shadow-xs overflow-hidden">
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-natural-border flex items-center justify-between bg-natural-light/50">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-natural-accent/30 text-natural-primary rounded-lg shrink-0">
            <UserPlus size={20} />
          </div>
          <div>
            <h2 className="font-serif italic font-bold text-natural-text text-base">
              {colaboradorToEdit ? 'Editar Cadastro de Colaborador' : 'Novo Cadastro de Colaborador'}
            </h2>
            <p className="text-xs text-natural-muted">
              {colaboradorToEdit 
                ? `Editando as informações de ${colaboradorToEdit.exibicao}` 
                : 'Insira os dados cadastrais do funcionário para inserção no sistema.'}
            </p>
          </div>
        </div>
        <button
          id="close-form-top-btn"
          onClick={onCancel}
          className="p-1.5 rounded-lg text-natural-muted hover:text-natural-text hover:bg-natural-light transition-all cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form Body */}
      <form id="colaborador-form" onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Validation Errors Header Banner */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start space-x-3 text-rose-800">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-500" />
            <div className="text-xs">
              <span className="font-semibold block mb-1">Por favor, corrija os seguintes erros antes de continuar:</span>
              <ul className="list-disc pl-4 space-y-1">
                {Object.values(errors).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Section 1: Dados Pessoais */}
        <div className="space-y-4">
          <div className="text-[11px] font-semibold text-natural-muted uppercase tracking-widest border-b border-natural-border pb-1.5">
            1. Informações Pessoais
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block flex items-center justify-between">
                <span>
                  Nome Completo <span className="text-rose-500">*</span>
                </span>
                {isNomeCompletoDuplicate && (
                  <span className="text-[11px] font-semibold text-rose-600 flex items-center space-x-1 animate-pulse">
                    <AlertTriangle size={12} />
                    <span>Nome já cadastrado!</span>
                  </span>
                )}
              </label>
              <input
                id="input-nome-completo"
                type="text"
                required
                placeholder="Ex: Carlos Henrique de Souza"
                value={nomeCompleto}
                onChange={handleNomeCompletoChange}
                className={`w-full border ${
                  errors.nomeCompleto || isNomeCompletoDuplicate
                    ? 'border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-rose-200 focus:border-rose-600'
                    : 'bg-natural-light border-natural-border focus:ring-natural-accent/30 focus:border-natural-primary'
                } rounded-lg px-3.5 py-2 text-sm transition-all focus:outline-hidden focus:ring-4 focus:bg-white`}
              />
              {(isNomeCompletoDuplicate || errors.nomeCompleto) && (
                <p className="text-xs text-rose-600 font-semibold flex items-center space-x-1.5 mt-1">
                  <AlertTriangle size={13} className="shrink-0 text-rose-500" />
                  <span>
                    {isNomeCompletoDuplicate
                      ? 'O nome digitado já pertence a outro colaborador ativo.'
                      : errors.nomeCompleto}
                  </span>
                </p>
              )}
            </div>

            {/* Nome de Exibição */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block flex items-center justify-between">
                <span className="flex items-center">
                  Nome de Exibição <span className="text-rose-500">*</span>
                  <span className="ml-1 text-[10px] font-medium text-natural-muted">(Crachá/UI)</span>
                </span>
                {isExibicaoDuplicate && (
                  <span className="text-[11px] font-semibold text-rose-600 flex items-center space-x-1 animate-pulse">
                    <AlertTriangle size={12} />
                    <span>Nome de exibição já cadastrado!</span>
                  </span>
                )}
              </label>
              <input
                id="input-exibicao"
                type="text"
                required
                placeholder="Ex: Carlos Souza"
                value={exibicao}
                onChange={handleExibicaoChange}
                className={`w-full border ${
                  errors.exibicao || isExibicaoDuplicate
                    ? 'border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-rose-200 focus:border-rose-600'
                    : 'bg-natural-light border-natural-border focus:ring-natural-accent/30 focus:border-natural-primary'
                } rounded-lg px-3.5 py-2 text-sm transition-all focus:outline-hidden focus:ring-4 focus:bg-white`}
              />
              {(isExibicaoDuplicate || errors.exibicao) && (
                <p className="text-xs text-rose-600 font-semibold flex items-center space-x-1.5 mt-1">
                  <AlertTriangle size={13} className="shrink-0 text-rose-500" />
                  <span>
                    {isExibicaoDuplicate
                      ? 'O nome de exibição digitado já pertence a outro colaborador ativo.'
                      : errors.exibicao}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPF */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block flex items-center justify-between">
                <span>CPF <span className="text-xs font-normal text-natural-muted">(Opcional)</span></span>
                {cpfValid !== null && (
                  <span className={`text-[10px] font-semibold ${cpfValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {cpfValid ? '✓ CPF Válido' : '✗ CPF Inválido'}
                  </span>
                )}
              </label>
              <input
                id="input-cpf"
                type="text"
                maxLength={14}
                placeholder="000.000.000-00 (Opcional)"
                value={cpf}
                onChange={handleCpfChange}
                className={`w-full bg-natural-light border ${
                  errors.cpf ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : 'border-natural-border focus:ring-natural-accent/30 focus:border-natural-primary'
                } rounded-lg px-3.5 py-2 text-sm text-natural-text focus:outline-hidden focus:ring-4 focus:bg-white transition-all font-mono`}
              />
            </div>

            {/* RG */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block">
                RG <span className="text-xs font-normal text-natural-muted">(Opcional)</span>
              </label>
              <input
                id="input-rg"
                type="text"
                placeholder="00.000.000-0 (Opcional)"
                value={rg}
                onChange={handleRgChange}
                className={`w-full bg-natural-light border ${
                  errors.rg ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : 'border-natural-border focus:ring-natural-accent/30 focus:border-natural-primary'
                } rounded-lg px-3.5 py-2 text-sm text-natural-text focus:outline-hidden focus:ring-4 focus:bg-white transition-all font-mono`}
              />
            </div>

            {/* Matrícula */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block">
                Matrícula <span className="text-xs font-normal text-natural-muted">(Opcional)</span>
              </label>
              <input
                id="input-matricula"
                type="text"
                maxLength={7}
                placeholder="0000000 (Opcional)"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value.slice(0, 7))}
                className="w-full bg-natural-light border border-natural-border focus:ring-natural-accent/30 focus:border-natural-primary rounded-lg px-3.5 py-2 text-sm text-natural-text focus:outline-hidden focus:ring-4 focus:bg-white transition-all font-mono"
              />
            </div>

            {/* Data de Nascimento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block">
                Data de Nascimento <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-data-nascimento"
                type="date"
                required
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className={`w-full bg-natural-light border ${
                  errors.dataNascimento ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : 'border-natural-border focus:ring-natural-accent/30 focus:border-natural-primary'
                } rounded-lg px-3.5 py-2 text-sm text-natural-text focus:outline-hidden focus:ring-4 focus:bg-white transition-all`}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dados Profissionais */}
        <div className="space-y-4">
          <div className="text-[11px] font-semibold text-natural-muted uppercase tracking-widest border-b border-natural-border pb-1.5">
            2. Atribuições Profissionais
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cargo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block">
                Cargo <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-cargo"
                type="text"
                required
                placeholder="Ex: Designer de Interface, Gerente Geral"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className={`w-full bg-natural-light border ${
                  errors.cargo ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : 'border-natural-border focus:ring-natural-accent/30 focus:border-natural-primary'
                } rounded-lg px-3.5 py-2 text-sm text-natural-text focus:outline-hidden focus:ring-4 focus:bg-white transition-all`}
              />
            </div>

            {/* Setor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block">
                Setor <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-setor"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                className="w-full bg-natural-light border border-natural-border focus:ring-natural-accent/30 focus:ring-4 focus:border-natural-primary rounded-lg px-3.5 py-2 text-sm text-natural-text focus:outline-hidden focus:bg-white transition-all"
              >
                {Array.from(new Set([...SETORES, ...(setor ? [setor] : [])])).map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Empresa */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block">
                Empresa <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-empresa"
                value={empresa}
                onChange={(e) => handleEmpresaChange(e.target.value)}
                className="w-full bg-natural-light border border-natural-border focus:ring-natural-accent/30 focus:ring-4 focus:border-natural-primary rounded-lg px-3.5 py-2 text-sm text-natural-text focus:outline-hidden focus:bg-white transition-all"
              >
                {EMPRESAS.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp}
                  </option>
                ))}
              </select>
            </div>

            {/* Filial */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block">
                Filial <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-filial"
                value={filial}
                onChange={(e) => setFilial(e.target.value)}
                className="w-full bg-natural-light border border-natural-border focus:ring-natural-accent/30 focus:ring-4 focus:border-natural-primary rounded-lg px-3.5 py-2 text-sm text-natural-text focus:outline-hidden focus:bg-white transition-all"
              >
                {filialOptions.map((fil) => (
                  <option key={fil} value={fil}>
                    {fil}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data de Admissão */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block">
                Data de Admissão
              </label>
              <input
                id="input-data-admissao"
                type="date"
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
                className="w-full bg-natural-light border border-natural-border focus:ring-natural-accent/30 focus:ring-4 focus:border-natural-primary rounded-lg px-3.5 py-2 text-sm text-natural-text focus:outline-hidden focus:bg-white transition-all"
              />
            </div>

            {/* Status do Colaborador */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block">
                Status Operacional
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  id="status-active-btn"
                  onClick={() => setStatus('Ativo')}
                  className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    status === 'Ativo'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                      : 'bg-natural-light border-natural-border text-natural-muted hover:bg-natural-light-gray'
                  }`}
                >
                  Ativo
                </button>
                <button
                  type="button"
                  id="status-inactive-btn"
                  onClick={() => setStatus('Inativo')}
                  className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    status === 'Inativo'
                      ? 'bg-natural-accent/30 border-natural-accent text-natural-primary font-bold'
                      : 'bg-natural-light border-natural-border text-natural-muted hover:bg-natural-light-gray'
                  }`}
                >
                  Inativo
                </button>
              </div>
            </div>
          </div>

          {/* Telefone de Contato (Suporta múltiplas linhas com botão de adicionar) */}
          <div className="space-y-2 bg-natural-light/50 p-3.5 rounded-xl border border-natural-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-natural-text flex items-center space-x-1.5">
                <Phone size={14} className="text-natural-primary shrink-0" />
                <span>Telefones de Contato / Celular</span>
              </label>
              <button
                type="button"
                id="add-telefone-line-btn"
                onClick={handleAddTelefone}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-natural-primary hover:text-white bg-natural-accent/20 hover:bg-natural-primary border border-natural-accent/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                <Plus size={13} />
                <span>Adicionar Telefone</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {telefones.map((tel, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold font-mono text-natural-muted w-14 shrink-0">
                    Linha {index + 1}:
                  </span>
                  <input
                    id={`input-telefone-${index}`}
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={tel}
                    onChange={(e) => handleTelefoneChange(index, e.target.value)}
                    className="flex-1 bg-natural-light border border-natural-border focus:ring-natural-accent/30 focus:ring-4 focus:border-natural-primary rounded-lg px-3.5 py-2 text-sm text-natural-text focus:outline-hidden focus:bg-white transition-all font-mono"
                  />
                  {telefones.length > 1 && (
                    <button
                      type="button"
                      id={`remove-telefone-btn-${index}`}
                      onClick={() => handleRemoveTelefone(index)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-natural-border hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                      title="Remover esta linha de telefone"
                      aria-label="Remover esta linha de telefone"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-text block">
                E-mail Corporativo
              </label>
              <input
                id="input-email"
                type="email"
                placeholder="usuario@empresa.com.br"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEmailManuallyEdited(true);
                }}
                className={`w-full bg-natural-light border ${
                  errors.email ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : 'border-natural-border focus:ring-natural-accent/30 focus:border-natural-primary'
                } rounded-lg px-3.5 py-2 text-sm text-natural-text focus:outline-hidden focus:ring-4 focus:bg-white transition-all`}
              />
            </div>
          </div>
        </div>

        {/* Form Footer Buttons */}
        <div className="pt-6 border-t border-natural-border flex items-center justify-end space-x-3">
          <button
            type="button"
            id="cancel-form-btn"
            onClick={onCancel}
            className="px-5 py-2 bg-white border border-natural-border rounded-full text-xs font-semibold text-natural-text hover:bg-natural-light transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            id="save-form-btn"
            className="px-6 py-2 bg-natural-primary hover:bg-natural-hover text-white rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Save size={14} />
            <span>Salvar Colaborador</span>
          </button>
        </div>
      </form>
    </div>
  );
}
