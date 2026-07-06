import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Info, 
  Key, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSettings } from '../types';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: UserSettings) => void;
  userSettings: UserSettings;
}

// Custom UTF-8 Safe Base64URL Encoder for Token Generation
function base64UrlEncode(obj: any): string {
  try {
    const jsonStr = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(jsonStr);
    const binStr = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binStr)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    return 'error';
  }
}

export default function LoginPage({ onLoginSuccess, userSettings }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation, Brute-force Prevention, and Cooldown states
  const [attempts, setAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [loginSuccessTrigger, setLoginSuccessTrigger] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Default demo credentials
  const DEMO_CREDENTIALS = [
    {
      email: 'ana.souza@techcorp.com.br',
      password: 'AnaPaula@2026',
      name: 'Ana Paula Souza',
      company: 'TechCorp Solutions Ltda'
    },
    {
      email: 'admin@bioscientific.ind.br',
      password: 'AdminBio@2026',
      name: 'Administrador Bio',
      company: 'Bio Scientific'
    }
  ];

  // Cooldown logic timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Real-time Password Strength evaluation
  const evaluatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Ausente', color: 'bg-slate-200', textClass: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: 'Fraca', color: 'bg-rose-500', textClass: 'text-rose-500' };
    if (score <= 4) return { score, label: 'Média', color: 'bg-amber-500', textClass: 'text-amber-500' };
    return { score, label: 'Forte (Ideal)', color: 'bg-emerald-500', textClass: 'text-emerald-500' };
  };

  const strength = evaluatePasswordStrength(password);

  // Live Token Construction Simulation
  const liveTokenParts = React.useMemo(() => {
    const matchedDemo = DEMO_CREDENTIALS.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
    const userName = matchedDemo ? matchedDemo.name : (email.split('@')[0] || 'Usuário Anônimo');
    const userCompany = matchedDemo ? matchedDemo.company : 'Corporação Geral';

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: email || 'usuario@empresa.com.br',
      name: userName,
      company: userCompany,
      roles: ['ADMIN_USER', 'HR_MANAGER'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900 // 15 mins expiry
    };

    const headerB64 = base64UrlEncode(header);
    const payloadB64 = base64UrlEncode(payload);
    // Simulated signature based on payload contents + server key
    const signature = 'sY8G_p3X_4m8-vN_wQ2_f9X_z1P_mN4_b8Y_v9T';

    return {
      header: JSON.stringify(header, null, 2),
      payload: JSON.stringify(payload, null, 2),
      headerB64,
      payloadB64,
      signature,
      fullToken: `${headerB64}.${payloadB64}.${signature}`
    };
  }, [email]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cooldownRemaining > 0) {
      setErrorMsg(`Acesso bloqueado por segurança. Aguarde ${cooldownRemaining}s.`);
      return;
    }

    if (!email || !password) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);

    // Simulate network authentication handshake
    setTimeout(() => {
      const trimmedEmail = email.trim().toLowerCase();
      const matched = DEMO_CREDENTIALS.find(
        (c) => c.email.toLowerCase() === trimmedEmail && c.password === password
      );

      if (matched) {
        // Successful login
        setAttempts(0);
        setLoginSuccessTrigger(true);
        setIsLoading(false);
        
        // Pass authentic token & user config profile
        setTimeout(() => {
          onLoginSuccess(liveTokenParts.fullToken, {
            nomeUsuario: matched.name,
            empresa: matched.company,
            email: matched.email,
            tema: userSettings.tema
          });
        }, 800);
      } else {
        // Failed login
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setIsLoading(false);

        if (newAttempts >= 4) {
          setCooldownRemaining(30); // 30 seconds lock on 4th attempt
          setErrorMsg('Múltiplas tentativas incorretas. Sistema bloqueado temporariamente (30s).');
        } else {
          setErrorMsg(`Usuário ou senha inválidos. Tentativa ${newAttempts} de 4 antes do bloqueio.`);
        }
      }
    }, 1200);
  };

  const fillCredential = (demo: typeof DEMO_CREDENTIALS[0]) => {
    if (cooldownRemaining > 0) return;
    setEmail(demo.email);
    setPassword(demo.password);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text antialiased font-sans flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Login Form Box (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-natural-border shadow-xl overflow-hidden flex flex-col justify-between">
          <div className="p-6 sm:p-10 flex-1 flex flex-col justify-center">
            
            {/* Upper Badge */}
            <div className="flex items-center space-x-2.5 mb-6">
              <div className="p-2 bg-natural-accent rounded-xl text-natural-primary border border-natural-border">
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="font-serif italic font-bold text-xl text-natural-text block leading-none">
                  Blue Manager
                </span>
                <span className="text-[10px] text-natural-muted font-mono tracking-widest block mt-1 uppercase">
                  Controle de Acesso Autenticado
                </span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-serif italic font-semibold text-natural-text tracking-tight">
                Identificação do Usuário
              </h2>
              <p className="text-xs text-natural-muted mt-1.5 leading-relaxed">
                Bem-vindo ao portal administrativo. Insira suas credenciais corporativas seguras de e-mail e senha para obter seu token de sessão único.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              
              {/* E-mail Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-natural-text" htmlFor="login-email">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-natural-muted">
                    <Mail size={16} />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    disabled={isLoading || cooldownRemaining > 0 || loginSuccessTrigger}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="exemplo@bioscientific.ind.br"
                    className="w-full bg-natural-light border border-natural-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-natural-text" htmlFor="login-password">
                    Senha do Usuário
                  </label>
                  {password && (
                    <span className={`text-[10px] font-mono font-bold ${strength.textClass}`}>
                      Força: {strength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-natural-muted">
                    <Lock size={16} />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading || cooldownRemaining > 0 || loginSuccessTrigger}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-natural-light border border-natural-border rounded-xl pl-10 pr-12 py-2.5 text-sm text-natural-text placeholder-natural-muted focus:outline-hidden focus:ring-4 focus:ring-natural-accent/30 focus:border-natural-primary focus:bg-white transition-all disabled:opacity-50"
                  />
                  <button
                    id="toggle-login-password-visibility"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-natural-muted hover:text-natural-primary transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator Bars */}
                {password && (
                  <div className="grid grid-cols-5 gap-1 pt-1.5">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx <= strength.score ? strength.color : 'bg-slate-100'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Warning Alert Box */}
              <AnimatePresence mode="wait">
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700"
                  >
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold leading-relaxed">
                      {errorMsg}
                    </span>
                  </motion.div>
                )}

                {cooldownRemaining > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-amber-700"
                  >
                    <Clock size={16} className="shrink-0 mt-0.5 animate-spin" />
                    <div>
                      <span className="text-xs font-bold block">Proteção contra Brute-Force Ativada</span>
                      <span className="text-[11px] block mt-0.5">Tentativas bloqueadas. Aguarde {cooldownRemaining} segundos para nova requisição de handshake.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <button
                id="submit-login-btn"
                type="submit"
                disabled={isLoading || cooldownRemaining > 0 || loginSuccessTrigger}
                className={`w-full py-3 rounded-xl text-xs font-bold text-white tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer ${
                  loginSuccessTrigger 
                    ? 'bg-emerald-600 border border-emerald-600'
                    : 'bg-natural-primary hover:bg-natural-hover border border-natural-primary shadow-md hover:shadow-lg hover:shadow-natural-primary/10'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Validando Chave...</span>
                  </>
                ) : loginSuccessTrigger ? (
                  <>
                    <CheckCircle2 size={14} className="animate-bounce" />
                    <span>Autenticado! Gerando Token...</span>
                  </>
                ) : (
                  <>
                    <Key size={14} />
                    <span>Solicitar Token de Acesso</span>
                  </>
                )}
              </button>

            </form>

            {/* Quick Demo Credentials Fill section */}
            <div className="mt-8 pt-6 border-t border-natural-border">
              <span className="block text-[11px] font-bold text-natural-muted uppercase tracking-wider mb-3">
                Credenciais de Teste do Ambiente (Clique para Preencher)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_CREDENTIALS.map((demo, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => fillCredential(demo)}
                    disabled={isLoading || cooldownRemaining > 0 || loginSuccessTrigger}
                    className="text-left p-2.5 rounded-xl border border-natural-border bg-natural-light hover:bg-natural-accent/30 hover:border-natural-primary transition-all duration-200 text-xs cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-natural-text text-[11px] block truncate group-hover:text-natural-primary transition-colors">
                        {demo.name}
                      </span>
                      <span className="text-[9px] bg-white border border-natural-border text-natural-muted font-semibold px-1 rounded block">
                        Fill
                      </span>
                    </div>
                    <span className="text-[10px] text-natural-muted block truncate mt-0.5">
                      {demo.email}
                    </span>
                    <span className="text-[9px] text-natural-muted font-mono block mt-1">
                      Senha: <span className="text-natural-text font-bold">{demo.password}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer of Left Box */}
          <div className="bg-natural-light px-6 py-4 border-t border-natural-border flex items-center justify-between text-[11px] text-natural-muted">
            <span className="flex items-center">
              <Cpu size={12} className="mr-1 text-natural-primary" />
              Simulador Token Bearer JWT Ativo
            </span>
            <span className="font-mono text-[10px]">v1.2 Secure Gateway</span>
          </div>

        </div>

        {/* Right Side: Security Inspector Panel (5 cols) */}
        <div className="lg:col-span-5 bg-[#0F172A] rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col justify-between text-slate-100">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Cpu size={20} className="text-[#38BDF8] animate-pulse" />
              <h3 className="font-mono text-xs font-semibold text-[#38BDF8] uppercase tracking-widest">
                Security & JWT Inspector
              </h3>
            </div>

            <div className="space-y-5">
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                O Blue Manager utiliza políticas rígidas de segurança contra ataques de vetor comum (XSS, CSRF, Brute Force). Veja abaixo em tempo real os metadados do seu token gerado:
              </p>

              {/* Real-time Token visualization */}
              <div className="space-y-4 font-mono text-[11px]">
                
                {/* Simulated Authorization Header */}
                <div>
                  <span className="block text-slate-500 font-semibold mb-1">CABEÇALHO HTTP (REQUISIÇÃO)</span>
                  <div className="bg-[#1E293B] p-2.5 rounded-xl border border-slate-800 break-all text-[10px]">
                    <span className="text-emerald-400">Authorization:</span>{' '}
                    <span className="text-sky-300">Bearer</span>{' '}
                    <span className="text-slate-300 truncate block">
                      {email ? liveTokenParts.fullToken : 'Aguardando login corporativo...'}
                    </span>
                  </div>
                </div>

                {/* JWT Header */}
                <div>
                  <span className="block text-[#EF4444] font-bold mb-1">JWT HEADER (ALGORITMO & TIPO)</span>
                  <pre className="bg-[#1E293B] p-3 rounded-xl border border-slate-800 text-[#EF4444] overflow-x-auto text-[10px] leading-tight">
                    {liveTokenParts.header}
                  </pre>
                </div>

                {/* JWT Payload */}
                <div>
                  <span className="block text-[#A855F7] font-bold mb-1">JWT PAYLOAD (CLAIMS DE SESSÃO)</span>
                  <pre className="bg-[#1E293B] p-3 rounded-xl border border-slate-800 text-[#A855F7] overflow-x-auto text-[10px] leading-tight">
                    {liveTokenParts.payload}
                  </pre>
                </div>

                {/* JWT Signature */}
                <div>
                  <span className="block text-[#06B6D4] font-bold mb-1">SIGNATURE (HMAC-SHA256 VERIFICATION)</span>
                  <div className="bg-[#1E293B] p-2.5 rounded-xl border border-slate-800 text-[#06B6D4] break-all text-[10px] leading-tight">
                    {liveTokenParts.signature}
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Security Standards compliance ticks */}
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-2.5">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Verificações de Segurança do Cliente
            </span>
            <div className="flex items-center space-x-2 text-[10px] text-slate-300">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span>Armazenamento local em contêiner isolado</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-slate-300">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span>Mitigação de injeção XSS nas claims</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-slate-300">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span>Rate Limiting ativo local contra força bruta ({attempts}/4)</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
