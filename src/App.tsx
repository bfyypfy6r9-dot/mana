import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import AuthScreen from './components/AuthScreen';
import AwaitingApproval from './components/AwaitingApproval';
import DadosForm from './components/DadosForm';
import FeedSection from './components/FeedSection';
import RankingSection from './components/RankingSection';
import RelatorioAdmin from './components/RelatorioAdmin';
import ComunicacaoSection from './components/ComunicacaoSection';
import ManaLogo from './components/ManaLogo';
import ManaBackground from './components/ManaBackground';
import { 
  Sparkles, 
  Database, 
  MessageSquare, 
  MessageCircle,
  Trophy, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  Loader2,
  Heart,
  Church
} from 'lucide-react';

type TabType = 'dados' | 'comunicacao' | 'feed' | 'ranking' | 'relatorio';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dados');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Monitor Profile Changes in Real-Time (Important for instant Approval update feedback!)
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const userRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setUserProfile(data);
        
        // If user email matches admin, guarantee approval flag instantly
        const isOwnerOrAdmin = 
          currentUser.email?.toLowerCase() === "pedrorafaela_araujo@hotmail.com" || 
          currentUser.email?.toLowerCase() === "prps2013araujo@gmail.com";
        
        if (isOwnerOrAdmin && !data.isApproved) {
          setUserProfile({
            ...data,
            isApproved: true
          });
        }
      } else {
        // Fallback or delayed registration state
        setUserProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao monitorar usuário em tempo real:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMobileMenuOpen(false);
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  const isAdmin = 
    currentUser?.email?.toLowerCase() === "pedrorafaela_araujo@hotmail.com" || 
    currentUser?.email?.toLowerCase() === "prps2013araujo@gmail.com";
  // Apploading spinner state
  if (loading) {
    return (
      <div id="loading_screen" className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <ManaBackground />
        <div className="z-10 animate-pulse mb-4">
          <ManaLogo size={64} />
        </div>
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mb-2 z-10" />
        <p className="text-slate-650 text-xs font-black uppercase tracking-widest z-10 text-center">Iniciando aplicativo Maná...</p>
      </div>
    );
  }

  // Not signed in
  if (!currentUser) {
    return <AuthScreen />;
  }

  // User is signed in but has no profile document yet, or waiting on database
  if (!userProfile) {
    if (loading) {
      return (
        <div id="loading_screen" className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <ManaBackground />
          <Loader2 size={48} className="text-emerald-600 animate-spin z-10" />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <ManaBackground />
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-amber-900/15 space-y-4 max-w-sm z-10 text-slate-800">
          <ShieldAlert size={36} className="text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold text-[#78350f]">Cadastro Incompleto</h2>
          <p className="text-xs text-slate-600">
            Parece que houve uma interrupção durante o seu registro e seu perfil de membro não foi criado completamente no banco de dados.
          </p>
          <div className="pt-2">
            <button 
              onClick={async () => {
                const { deleteUser } = await import('firebase/auth');
                try {
                  if (auth.currentUser) {
                    await deleteUser(auth.currentUser);
                    // It will automatically trigger onAuthStateChanged to null
                  }
                } catch (e: any) {
                  // If it requires recent login
                  alert("Por favor, clique em Sair, faça login novamente, e repita esta operação, ou nos contate.");
                }
              }}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer mb-2"
            >
              Excluir conta incompleta e recomeçar
            </button>
            <button 
              onClick={handleLogout}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-amber-900/10"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User profile exists, check for Approval (Admin is always approved in-app)
  const approved = userProfile.isApproved || isAdmin;
  if (!approved) {
    return <AwaitingApproval userProfile={userProfile} />;
  }



  return (
    <div id="mana_root_layout" className="min-h-screen bg-[#FAF6F0] text-slate-800 flex flex-col md:flex-row relative font-sans overflow-x-hidden">
      
      {/* Background Mesh Gradients */}
      <ManaBackground />

      {/* 1. Nav Sidebar for iPad and desktops */}
      <aside className="hidden md:flex md:w-64 bg-white/75 backdrop-blur-xl border-r border-amber-900/15 flex-col flex-shrink-0 relative z-10 shadow-sm">
        
        {/* Brand header */}
        <div className="p-6 border-b border-amber-900/10 flex items-center gap-3">
          <ManaLogo size={42} />
          <div>
            <h2 className="text-[#78350f] font-black text-lg tracking-tight leading-none">Maná</h2>
            <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-widest block mt-1">Parque dos Coqueiros</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            id="nav_dados_btn"
            onClick={() => setActiveTab('dados')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'dados' ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 shadow-xs' : 'text-slate-600 hover:bg-amber-900/5 hover:text-amber-900 border border-transparent'}`}
          >
            <Database size={18} />
            <span>Dados (Lançar)</span>
          </button>

          <button
            id="nav_comunicacao_btn"
            onClick={() => setActiveTab('comunicacao')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'comunicacao' ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 shadow-xs' : 'text-slate-600 hover:bg-amber-900/5 hover:text-amber-900 border border-transparent'}`}
          >
            <MessageCircle size={18} />
            <span>Comunicação</span>
          </button>

          <button
            id="nav_feed_btn"
            onClick={() => setActiveTab('feed')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'feed' ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 shadow-xs' : 'text-slate-600 hover:bg-amber-900/5 hover:text-amber-900 border border-transparent'}`}
          >
            <MessageSquare size={18} />
            <span>Feed Social</span>
          </button>

          <button
            id="nav_ranking_btn"
            onClick={() => setActiveTab('ranking')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'ranking' ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 shadow-xs' : 'text-slate-600 hover:bg-amber-900/5 hover:text-amber-900 border border-transparent'}`}
          >
            <Trophy size={18} />
            <span>Ranking Oficial</span>
          </button>

          {isAdmin && (
            <button
              id="nav_relatorio_btn"
              onClick={() => setActiveTab('relatorio')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'relatorio' ? 'bg-[#78350f]/10 text-[#78350f] border border-amber-900/20 shadow-xs' : 'text-slate-600 hover:bg-amber-900/5 hover:text-[#78350f] border border-transparent'}`}
            >
              <ShieldAlert size={18} className="text-emerald-600" />
              <span>Painel Admin</span>
            </button>
          )}
        </nav>

        {/* Footer actions / Active identity card */}
        <div className="p-4 border-t border-amber-900/10 bg-amber-950/[0.01] space-y-4">
          <div className="flex items-center gap-2.5 p-1">
            <div className="h-8 w-8 bg-emerald-600/10 border border-emerald-600/20 text-emerald-700 font-black text-xs rounded-lg flex items-center justify-center select-none">
              {userProfile.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">{userProfile.displayName}</h4>
              <span className="text-[10px] text-emerald-700 flex items-center gap-0.5 mt-0.5 truncate font-extrabold">
                <Church size={10} className="text-emerald-600" /> IASD {userProfile.church}
              </span>
            </div>
          </div>

          <button
            id="logout_sidebar_btn"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 py-2 hover:bg-red-500/10 hover:text-red-700 text-xs font-semibold rounded-lg text-slate-500 border border-transparent hover:border-red-500/25 transition-all cursor-pointer"
          >
            <LogOut size={13} className="text-red-650" />
            <span>Sair do Maná</span>
          </button>
        </div>
      </aside>

      {/* 2. Compact Top Navbar for mobile devices */}
      <header className="md:hidden bg-white/80 backdrop-blur-xl text-slate-800 border-b border-amber-900/10 p-4 sticky top-0 z-40 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <ManaLogo size={36} />
          <div>
            <h2 className="text-[#78350f] font-black text-sm leading-none">Maná</h2>
            <span className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-wider mt-0.5 block">Pq. dos Coqueiros</span>
          </div>
        </div>

        <button
          id="mobile_menu_trigger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 hover:bg-amber-900/10 rounded-lg text-slate-700 cursor-pointer"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile_drawer" className="md:hidden fixed inset-0 top-[57px] bg-[#78350f]/20 backdrop-blur-sm z-35 animate-fade-in flex flex-col">
          <nav className="bg-white/95 backdrop-blur-xl p-6 space-y-2.5 border-b border-amber-900/15 shadow-md">
            <button
              id="mob_nav_dados"
              onClick={() => { setActiveTab('dados'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'dados' ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20' : 'text-slate-600 hover:bg-amber-950/5'}`}
            >
              <Database size={16} />
              <span>Dados (Lançar)</span>
            </button>

            <button
              id="mob_nav_comunicacao"
              onClick={() => { setActiveTab('comunicacao'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'comunicacao' ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20' : 'text-slate-600 hover:bg-amber-950/5'}`}
            >
              <MessageCircle size={16} />
              <span>Comunicação</span>
            </button>

            <button
              id="mob_nav_feed"
              onClick={() => { setActiveTab('feed'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'feed' ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20' : 'text-slate-600 hover:bg-amber-950/5'}`}
            >
              <MessageSquare size={16} />
              <span>Feed Social</span>
            </button>

            <button
              id="mob_nav_ranking"
              onClick={() => { setActiveTab('ranking'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'ranking' ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/20' : 'text-slate-600 hover:bg-amber-950/5'}`}
            >
              <Trophy size={16} />
              <span>Ranking Oficial</span>
            </button>

            {isAdmin && (
              <button
                id="mob_nav_relatorio"
                onClick={() => { setActiveTab('relatorio'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'relatorio' ? 'bg-[#78350f]/10 text-[#78350f] border border-amber-900/20 shadow-xs' : 'text-[#78350f]/60 hover:bg-amber-950/5'}`}
              >
                <ShieldAlert size={16} className="text-[#78350f]" />
                <span>Painel Admin</span>
              </button>
            )}

            <div className="pt-4 border-t border-amber-900/10 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-extrabold text-emerald-700">
                <Church size={10} className="text-emerald-600" /> IASD {userProfile.church}
              </span>
              <button
                onClick={handleLogout}
                className="text-red-650 font-bold hover:underline px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs"
              >
                Sair
              </button>
            </div>
          </nav>
          {/* Transparent dismiss area */}
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* Main content canvas area */}
      <main id="app_viewport" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative z-10">
        {activeTab === 'dados' && <DadosForm userProfile={userProfile} />}
        {activeTab === 'comunicacao' && <ComunicacaoSection userProfile={userProfile} />}
        {activeTab === 'feed' && <FeedSection userProfile={userProfile} />}
        {activeTab === 'ranking' && <RankingSection userProfile={userProfile} />}
        {activeTab === 'relatorio' && isAdmin && <RelatorioAdmin userProfile={userProfile} />}
      </main>

    </div>
  );
}

