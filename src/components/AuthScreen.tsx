import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { CHURCHES, ChurchType } from '../types';
import { Sparkles, Church, Heart, Shield, Loader2, ArrowRight } from 'lucide-react';
import ManaLogo from './ManaLogo';

import ManaBackground from './ManaBackground';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedChurch, setSelectedChurch] = useState<ChurchType>("Guajiru");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const emailTrimmed = email.trim();
    const isOwnerOrAdmin = 
      emailTrimmed.toLowerCase() === "pedrorafaela_araujo@hotmail.com" || 
      emailTrimmed.toLowerCase() === "prps2013araujo@gmail.com";

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          throw new Error("Por favor, digite seu nome completo.");
        }
        
        // 1. Create firebase auth user
        const userCredential = await createUserWithEmailAndPassword(auth, emailTrimmed, password);
        const user = userCredential.user;

        // 2. Put user data into Firestore
        const pathForWrite = `users/${user.uid}`;
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: emailTrimmed.toLowerCase(),
            displayName: fullName.trim(),
            district: "Parque dos Coqueiros",
            church: selectedChurch,
            isApproved: isOwnerOrAdmin, // Automatic approval for admins for smooth preview testing
            createdAt: serverTimestamp()
          });
        } catch (err) {
          // Rollback auth user implicitly or logout to ensure state consistency
          await signOut(auth);
          handleFirestoreError(err, OperationType.CREATE, pathForWrite);
        }
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, emailTrimmed, password);
      }
    } catch (err: any) {
      console.error(err);
      let localizedError = err.message || "Ocorreu um erro inesperado.";
      
      // Localize common firebase auth messages for a premium UX
      if (err.code === 'auth/email-already-in-use') {
        localizedError = 'Este e-mail já está cadastrado.';
      } else if (err.code === 'auth/weak-password') {
        localizedError = 'A senha deve conter pelo menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        localizedError = 'O e-mail digitado não é válido.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        localizedError = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/operation-not-allowed') {
        localizedError = 'O login com E-mail/Senha está desativado no Firebase. Copie a URL do seu console Firebase e ative o provedor de E-mail/Senha na aba de Autenticação (Authentication > Sign-in method).';
      }
      
      setError(localizedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth_container" className="min-h-screen flex items-center justify-center bg-transparent py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Visual background accents */}
      <ManaBackground />

      <div className="max-w-md w-full space-y-8 bg-white/85 backdrop-blur-xl p-8 rounded-3xl border border-amber-900/15 shadow-xl relative z-10 animate-fade-in text-slate-800">
        <div className="text-center">
          <div className="mx-auto flex justify-center mb-3">
            <ManaLogo size={80} />
          </div>
          
          <h1 id="app_title" className="text-4xl font-black tracking-tight text-[#78350f] font-sans leading-none">
            Maná
          </h1>
          <p className="mt-2 text-sm text-[#854d0e] font-medium">
            Distrito Parque dos Coqueiros
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-bold rounded-full select-none">
            <Heart size={12} className="fill-emerald-600 text-emerald-600" /> Escola Sabatina
          </div>
        </div>

        <div className="mt-8">
          {isSignUp && (
            <h2 className="text-xs font-black text-[#78350f] uppercase tracking-widest border-b border-amber-900/10 pb-2.5 mb-5 text-center">
              Criar Nova Conta de Membro
            </h2>
          )}

          {error && (
            <div id="auth_error" className="mb-4 p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-medium rounded-r-xl animate-shake shadow-sm">
              <span className="font-bold">Erro:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5 select-none">
                  Nome Completo
                </label>
                <input
                  id="reg_fullname"
                  type="text"
                  required
                  placeholder="Seu nome e sobrenome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all font-sans text-sm shadow-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5 select-none">
                E-mail
              </label>
              <input
                id="auth_email"
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all font-sans text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5 select-none">
                Senha
              </label>
              <input
                id="auth_password"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all font-sans text-sm shadow-sm"
              />
            </div>

            {isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5 select-none">
                    Distrito <span className="text-emerald-600 font-bold">(Fixo)</span>
                  </label>
                  <div className="w-full px-4 py-2.5 bg-slate-50 border border-amber-900/10 rounded-xl text-slate-600 font-sans text-sm flex items-center gap-1.5 cursor-not-allowed select-none">
                    <Shield size={14} className="text-emerald-600" />
                    Parque dos Coqueiros
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5 select-none">
                    Sua Igreja
                  </label>
                  <div className="relative">
                    <select
                      id="reg_church"
                      value={selectedChurch}
                      onChange={(e) => setSelectedChurch(e.target.value as ChurchType)}
                      className="w-full appearance-none px-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-slate-900 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all cursor-pointer shadow-sm"
                    >
                      {CHURCHES.map((ch) => (
                        <option key={ch} value={ch} className="bg-white text-slate-800">
                          {ch}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                      <Church size={14} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              id="auth_submit_btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-6 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  {isSignUp ? "Criar meu cadastro" : "Acessar o Painel"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500 font-semibold">
              {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
            </span>{' '}
            <button
              id="auth_toggle_btn"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="font-extrabold text-emerald-600 hover:text-emerald-500 underline focus:outline-none cursor-pointer"
            >
              {isSignUp ? 'Fazer Login' : 'Cadastre-se aqui'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
