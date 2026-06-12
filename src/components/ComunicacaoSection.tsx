import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, ChurchData, DonorDetail, CHURCHES } from '../types';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Calendar, 
  Church as ChurchIcon,
  Smile, 
  Bell, 
  Loader2,
  Phone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ComunicacaoSectionProps {
  userProfile: UserProfile;
}

export default function ComunicacaoSection({ userProfile }: ComunicacaoSectionProps) {
  const isAdmin = 
    userProfile.email?.toLowerCase() === "pedrorafaela_araujo@hotmail.com" || 
    userProfile.email?.toLowerCase() === "prps2013araujo@gmail.com";

  const getCurrentMonthString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [monthYear, setMonthYear] = useState(getCurrentMonthString());
  const [selectedChurch, setSelectedChurch] = useState<string>(userProfile.church);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [donors, setDonors] = useState<{ donor: DonorDetail; churchName: string; docId: string }[]>([]);

  // Format phone to (XX) XXXXX-XXXX or similar
  const formatPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  // Generate WhatsApp links
  const handleSendMessage = (phone: string, text: string) => {
    let cleaned = phone.replace(/\D/g, '');
    // If entered without country code, add Brazilian country code '55'
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    setLoading(true);
    
    // Set up Real-Time updates on mana_data collection
    const q = collection(db, 'mana_data');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allData: { donor: DonorDetail; churchName: string; docId: string }[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as ChurchData;
        
        // Filter by monthYear first
        if (data.monthYear === monthYear) {
          // If admin, we either display selectedChurch or all
          // if not admin, standard coordinator is locked to userProfile.church
          const matchedChurch = isAdmin 
            ? (selectedChurch === 'Todas' || data.church === selectedChurch)
            : data.church === userProfile.church;

          if (matchedChurch && data.donorsList && Array.isArray(data.donorsList)) {
            data.donorsList.forEach((donor) => {
              allData.push({
                donor,
                churchName: data.church,
                docId: doc.id
              });
            });
          }
        }
      });

      // Sort alphabetically by donor name
      allData.sort((a, b) => a.donor.name.localeCompare(b.donor.name));
      setDonors(allData);
      setLoading(false);
    }, (err) => {
      console.error("Erro ao escutar dados dos doadores:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [monthYear, selectedChurch, userProfile.church, isAdmin]);

  // Filter local state by search query
  const filteredDonors = donors.filter(item => 
    item.donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.donor.whatsapp.includes(searchTerm) ||
    item.churchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in relative z-10 text-slate-850">
      
      {/* Header Info Panel */}
      <div className="bg-white/85 backdrop-blur-xl border border-amber-900/15 text-slate-800 rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-[10%] right-[-10%] w-60 h-60 bg-emerald-55/20 rounded-full filter blur-2xl pointer-events-none select-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600/10 text-emerald-800 border border-emerald-600/15 text-xs font-black rounded-full mb-1">
              <MessageCircle size={12} /> Canal de Comunicação
            </span>
            <h1 className="text-2xl font-black text-[#78350f] tracking-tight">Comunicação e Gratidão</h1>
            <p className="text-slate-605 text-sm font-medium">Envie mensagens carinhosas de agradecimento ou lembretes via WhatsApp para os seus doadores cadastrados.</p>
          </div>
        </div>
      </div>

      {/* Filters: Month/Year, Search and Church Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Month Selector */}
        <div className="bg-white/80 p-4 rounded-2xl border border-amber-900/10 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Calendar className="text-slate-500" size={18} />
            <span className="text-xs font-black text-[#78350f] uppercase tracking-wider">Referência</span>
          </div>
          <input
            type="month"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            className="bg-transparent text-slate-800 font-bold text-sm outline-none cursor-pointer border border-[#d9c5b2] p-1.5 px-2.5 rounded-xl [color-scheme:light]"
          />
        </div>

        {/* Church Filter (Admins only, coordinates are locked to their own) */}
        <div className="bg-white/80 p-4 rounded-2xl border border-amber-900/10 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <ChurchIcon className="text-slate-500" size={18} />
            <span className="text-xs font-black text-[#78350f] uppercase tracking-wider">Igreja</span>
          </div>
          {isAdmin ? (
            <select
              value={selectedChurch}
              onChange={(e) => setSelectedChurch(e.target.value)}
              className="bg-transparent font-bold text-sm select-auto border border-[#d9c5b2] rounded-xl p-1.5 focus:outline-none text-slate-800 w-full max-w-[150px]"
            >
              <option value="Todas">Todas as Igrejas</option>
              {CHURCHES.map(ch => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-black text-emerald-800 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/15">
              IASD {userProfile.church}
            </span>
          )}
        </div>

        {/* Search Input Filter */}
        <div className="bg-white/80 p-4 rounded-2xl border border-amber-900/10 flex items-center gap-2 shadow-xs">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent w-full font-semibold text-slate-850 text-sm outline-none placeholder-slate-400"
          />
        </div>

      </div>

      {/* Grid of Donors */}
      {loading ? (
        <div className="bg-white/50 p-12 rounded-3xl border border-amber-900/10 flex flex-col items-center justify-center space-y-3">
          <Loader2 size={36} className="text-emerald-700 animate-spin" />
          <p className="text-xs font-semibold text-slate-550">Sincronizando doadores...</p>
        </div>
      ) : filteredDonors.length === 0 ? (
        <div className="bg-white/70 p-12 rounded-3xl border border-amber-900/10 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
          <div className="p-4 bg-amber-50 rounded-full text-amber-600 border border-amber-100">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-bold text-[#78350f]">Nenhum doador encontrado</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nenhum doador foi cadastrado para a referência {monthYear} na igreja escolhida. Vá na opção do menu <strong>"Dados (Lançar)"</strong>, informe a quantidade alcançada no item "5. Doadores", preencha o Nome e WhatsApp de cada um e salve para exibi-los aqui!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonors.map((item, idx) => {
            const thankMessage = `Olá, ${item.donor.name}! Gostaríamos de expressar nossa profunda gratidão pela sua valiosa contribuição ao projeto Maná este mês na IASD ${item.churchName}. Sua fidelidade é crucial para o avanço de nossa Escola Sabatina e o crescimento espiritual de nossa comunidade. Que Deus o abençoe grandemente!`;
            
            const remindMessage = `Olá, ${item.donor.name}, tudo bem? Passando com muito carinho para lembrá-lo(a) sobre a doação para o projeto Maná este mês na IASD ${item.churchName}. Seus recursos apoiam diretamente nossa Escola Sabatina. Que Deus continue abençoando você e sua família! Forte abraço.`;

            return (
              <div 
                key={idx} 
                className="bg-white/90 backdrop-blur-md rounded-2xl border border-amber-900/15 p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-[#78350f]/20 transition-all group"
              >
                <div>
                  {/* Name and Church badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-extrabold text-[#78350f] text-base leading-tight group-hover:text-emerald-800 transition-colors">
                      {item.donor.name}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1.5 font-bold">
                      <ChurchIcon size={12} className="text-slate-400" />
                      IASD {item.churchName}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold">
                      <Phone size={12} className="text-slate-400" />
                      {formatPhone(item.donor.whatsapp)}
                    </span>
                  </div>
                </div>

                {/* Communication buttons */}
                <div className="space-y-2 pt-3 border-t border-amber-900/5">
                  <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                    Enviar via WhatsApp:
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSendMessage(item.donor.whatsapp, thankMessage)}
                      className="cursor-pointer flex items-center justify-center gap-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      title="Agradecer Doação"
                    >
                      <Smile size={13} />
                      Agradecer
                    </button>

                    <button
                      onClick={() => handleSendMessage(item.donor.whatsapp, remindMessage)}
                      className="cursor-pointer flex items-center justify-center gap-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      title="Lembrar Doação"
                    >
                      <Bell size={13} />
                      Lembrar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
