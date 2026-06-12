import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { Hourglass, LogOut, Heart } from 'lucide-react';
import ManaBackground from './ManaBackground';

interface AwaitingApprovalProps {
  userProfile: UserProfile;
}

export default function AwaitingApproval({ userProfile }: AwaitingApprovalProps) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  return (
    <div id="awaiting_auth_container" className="min-h-screen flex items-center justify-center bg-transparent py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Mesh Gradients */}
      <ManaBackground />
      
      <div className="max-w-md w-full space-y-8 bg-white/85 backdrop-blur-xl p-8 rounded-3xl border border-amber-900/15 shadow-xl relative z-10 text-center animate-fade-in text-slate-800">
        <div className="mx-auto h-16 w-16 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/5">
          <Hourglass size={32} className="animate-spin text-amber-600" style={{ animationDuration: '3s' }} />
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-black tracking-tight text-[#78350f]">
            Cadastro em Análise
          </h1>
          <p className="text-slate-650 text-sm font-medium">
            Olá, <span className="font-extrabold text-emerald-700">{userProfile.displayName}</span>! Seu cadastro foi recebido com sucesso no sistema **Maná**.
          </p>

          <div className="bg-slate-50/50 rounded-2xl p-4 text-left border border-amber-900/10 space-y-2">
            <h3 className="text-xs font-black uppercase text-[#854d0e] tracking-wider">Seus Dados de Cadastro:</h3>
            <div className="text-sm text-slate-700 space-y-1">
              <div><strong className="text-slate-800">Distrito:</strong> Parque dos Coqueiros</div>
              <div><strong className="text-slate-800">Igreja:</strong> IASD {userProfile.church}</div>
              <div><strong className="text-slate-800">E-mail:</strong> {userProfile.email}</div>
            </div>
          </div>

          <div className="p-3.5 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-800 text-left leading-relaxed font-medium">
            <strong>Por que estou vendo isso?</strong> Para garantir a segurança dos dados e relatórios do distrito, cada usuário precisa ser aprovado manualmente pelo administrador do programa Maná.
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Por favor, contate o seu diretor de Escola Sabatina ou o coordenador distrital para agilizar a liberação.
          </p>
        </div>

        <div className="pt-4 border-t border-amber-900/10 flex flex-col gap-2">
          <button
            id="awaiting_logout_btn"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl cursor-pointer transition-colors border border-amber-900/10"
          >
            <LogOut size={16} />
            Sair ou Usar Outra Conta
          </button>
        </div>

        <div className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1 select-none font-bold">
          <Heart size={10} className="fill-emerald-600 text-emerald-600" /> Maná 2026
        </div>
      </div>
    </div>
  );
}
