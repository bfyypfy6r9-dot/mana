import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, ChurchData, DonorDetail } from '../types';
import { 
  Save, 
  Users, 
  CheckSquare, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Church,
  Calculator,
  Trophy,
  Calendar
} from 'lucide-react';

interface DadosFormProps {
  userProfile: UserProfile;
}

export default function DadosForm({ userProfile }: DadosFormProps) {
  const getCurrentMonthString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [monthYear, setMonthYear] = useState(getCurrentMonthString());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Left Column State
  // 1. Membros Ativos
  const [activeMembersTotal, setActiveMembersTotal] = useState('0');
  const [activeMembersMeta, setActiveMembersMeta] = useState('0');

  // 2. Assinantes
  const [subscribersTotal, setSubscribersTotal] = useState('0');
  const [subscribersRealizado, setSubscribersRealizado] = useState('0');

  // 3. Sem Assinatura
  const [noSubscribersTotal, setNoSubscribersTotal] = useState('0');
  const [noSubscribersRealizado, setNoSubscribersRealizado] = useState('0');

  // 4. Doação da igreja
  const [donationOption, setDonationOption] = useState<string>('3'); // 3, 5, 7, other
  const [donationOther, setDonationOther] = useState('0');

  // 5. Doadores
  const [churchDonorsMeta, setChurchDonorsMeta] = useState('0');
  const [churchDonorsRealizado, setChurchDonorsRealizado] = useState('0');
  const [donorsList, setDonorsList] = useState<DonorDetail[]>([]);

  // Robustly synchronize the quantity of donors listed with churchDonorsRealizado
  useEffect(() => {
    const count = Math.max(0, parseInt(churchDonorsRealizado, 10) || 0);
    setDonorsList(prev => {
      const updated = [...prev];
      if (updated.length < count) {
        while (updated.length < count) {
          updated.push({ name: '', whatsapp: '' });
        }
      } else if (updated.length > count) {
        updated.splice(count);
      }
      return updated;
    });
  }, [churchDonorsRealizado]);

  const handleDonorsRealizadoChange = (newValStr: string) => {
    setChurchDonorsRealizado(newValStr);
  };

  // Right Column State (Gamification)
  const [activity1, setActivity1] = useState(false);
  const [activity2, setActivity2] = useState(false);
  const [activity3, setActivity3] = useState(false);
  const [activity4, setActivity4] = useState(false);
  const [activity5, setActivity5] = useState(false);

  // Load existing stats
  useEffect(() => {
    const loadExistingData = async () => {
      setFetching(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const docId = `${userProfile.church.replace(/[^a-zA-Z0-9]/g, '')}_${monthYear}`;
      try {
        const docRef = doc(db, 'mana_data', docId); // Note: New collection "mana_data" as requested
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as ChurchData;
          setActiveMembersTotal(String(data.activeMembersTotal ?? 0));
          setActiveMembersMeta(String(data.activeMembersMeta ?? 0));
          
          setSubscribersTotal(String(data.subscribersTotal ?? 0));
          setSubscribersRealizado(String(data.subscribersRealizado ?? 0));
          
          setNoSubscribersTotal(String(data.noSubscribersTotal ?? 0));
          setNoSubscribersRealizado(String(data.noSubscribersRealizado ?? 0));
          
          const donVal = data.churchDonationsValue ?? 0;
          if (donVal === 3 || donVal === 5 || donVal === 7) {
            setDonationOption(String(donVal));
            setDonationOther('0');
          } else {
            setDonationOption('other');
            setDonationOther(String(donVal));
          }

          setChurchDonorsMeta(String(data.churchDonorsMeta ?? 0));
          setChurchDonorsRealizado(String(data.churchDonorsRealizado ?? 0));
          setDonorsList(data.donorsList || []);
          
          setActivity1(data.activity1 ?? false);
          setActivity2(data.activity2 ?? false);
          setActivity3(data.activity3 ?? false);
          setActivity4(data.activity4 ?? false);
          setActivity5(data.activity5 ?? false);
        } else {
          setActiveMembersTotal('0');
          setActiveMembersMeta('0');
          setSubscribersTotal('0');
          setSubscribersRealizado('0');
          setNoSubscribersTotal('0');
          setNoSubscribersRealizado('0');
          setDonationOption('3');
          setDonationOther('0');
          setChurchDonorsMeta('0');
          setChurchDonorsRealizado('0');
          setDonorsList([]);
          setActivity1(false);
          setActivity2(false);
          setActivity3(false);
          setActivity4(false);
          setActivity5(false);
        }
      } catch (err) {
        console.error(err);
        handleFirestoreError(err, OperationType.GET, `mana_data/${docId}`);
      } finally {
        setFetching(false);
      }
    };

    loadExistingData();
  }, [userProfile.church, monthYear]);

  // Derived Calculations
  const calculateScore = () => {
    let score = 0;
    
    // Activities (Max 50)
    let activitiesPoints = 0;
    if (activity1) activitiesPoints += 10;
    if (activity2) activitiesPoints += 10;
    if (activity3) activitiesPoints += 10;
    if (activity4) activitiesPoints += 10;
    if (activity5) activitiesPoints += 10;
    score += activitiesPoints;

    // Assinantes (Max 50)
    let assinantesPoints = 0;
    const realized = Number(subscribersRealizado) || 0;
    const totalMembers = Number(activeMembersTotal) || 0;

    if (totalMembers > 0) {
      const taxa = (realized / totalMembers) * 100;
      if (taxa >= 90) {
        assinantesPoints = 50;
      } else {
        assinantesPoints = (taxa / 90) * 50;
      }
    }

    score += Math.min(50, assinantesPoints); // safeguard

    return { score, activitiesPoints, assinantesPoints };
  };

  const { score: pontuacaoFinal, activitiesPoints, assinantesPoints } = calculateScore();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const docId = `${userProfile.church.replace(/[^a-zA-Z0-9]/g, '')}_${monthYear}`;
    
    let donationVal = 0;
    if (donationOption === 'other') {
      donationVal = Number(donationOther) || 0;
    } else {
      donationVal = Number(donationOption) || 0;
    }

    const payload: ChurchData = {
      id: docId,
      church: userProfile.church,
      monthYear: monthYear,
      activeMembersTotal: Number(activeMembersTotal) || 0,
      activeMembersMeta: Number(activeMembersMeta) || 0,
      subscribersTotal: Number(subscribersTotal) || 0,
      subscribersRealizado: Number(subscribersRealizado) || 0,
      noSubscribersTotal: Number(noSubscribersTotal) || 0,
      noSubscribersRealizado: Number(noSubscribersRealizado) || 0,
      churchDonationsValue: donationVal,
      churchDonorsMeta: Number(churchDonorsMeta) || 0,
      churchDonorsRealizado: Number(churchDonorsRealizado) || 0,
      donorsList: donorsList.map(d => ({
        name: d.name.trim(),
        whatsapp: d.whatsapp.replace(/\D/g, '').trim()
      })),
      activity1,
      activity2,
      activity3,
      activity4,
      activity5,
      pontuacaoFinal,
      updatedAt: serverTimestamp(),
      updatedBy: userProfile.uid
    };

    try {
      await setDoc(doc(db, 'mana_data', docId), payload);
      setSuccessMsg(`Dados salvos com sucesso para ${monthYear}! Pontuação: ${pontuacaoFinal.toFixed(1)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Ocorreu um erro ao salvar os dados. Verifique suas permissões.");
      handleFirestoreError(err, OperationType.UPDATE, `mana_data/${docId}`);
    } finally {
      setLoading(false);
    }
  };

  const InputGroup = ({ 
    label, 
    label1, 
    val1, 
    setVal1, 
    label2, 
    val2, 
    setVal2, 
    icon: IconComponent
  }: any) => (
    <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-slate-200">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/10">
          <IconComponent size={18} />
        </div>
        <h3 className="font-bold text-white text-sm sm:text-base">{label}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 select-none">
            {label1}
          </label>
          <input
            type="number"
            min="0"
            required
            value={val1}
            onChange={(e) => setVal1(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 select-none">
            {label2}
          </label>
          <input
            type="number"
            min="0"
            required
            value={val2}
            onChange={(e) => setVal2(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold transition-all"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in relative z-10 text-slate-200">
      
      {/* Header Info Panel */}
      <div className="bg-white/5 border border-white/10 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-[10%] right-[-10%] w-60 h-60 bg-blue-900/20 rounded-full filter blur-2xl pointer-events-none select-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full mb-1">
              <Church size={12} /> IASD {userProfile.church}
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Formulário de Dados</h1>
            <p className="text-slate-350 text-sm">Insira seus dados e complete as atividades para subir no ranking.</p>
          </div>

          <div className="bg-white/10 px-4 py-2 border border-white/10 rounded-xl flex items-center gap-2">
            <Calendar size={16} className="text-slate-300" />
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="bg-transparent text-white font-semibold text-sm outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-250 text-sm">
          <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {fetching ? (
        <div className="bg-white/5 p-12 rounded-3xl border border-white/10 flex flex-col items-center justify-center space-y-3">
          <Loader2 size={36} className="text-emerald-400 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Form Fields */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white mb-4 rounded-xl px-4 py-2 bg-white/5 border border-white/10">Valores Quantitativos</h2>
            
            <InputGroup 
              label="1. Membros Ativos" 
              label1="Total" val1={activeMembersTotal} setVal1={setActiveMembersTotal}
              label2="Meta" val2={activeMembersMeta} setVal2={setActiveMembersMeta}
              icon={Users}
            />

            <InputGroup 
              label="2. Assinantes" 
              label1="Total" val1={subscribersTotal} setVal1={setSubscribersTotal}
              label2="Realizado" val2={subscribersRealizado} setVal2={setSubscribersRealizado}
              icon={CheckSquare}
            />

            <InputGroup 
              label="3. Sem Assinatura" 
              label1="Total" val1={noSubscribersTotal} setVal1={setNoSubscribersTotal}
              label2="Realizado" val2={noSubscribersRealizado} setVal2={setNoSubscribersRealizado}
              icon={Users}
            />

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-slate-200">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/10">
                  <Calculator size={18} />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base">4. Doação da Igreja</h3>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-4">
                {['3', '5', '7'].map((val) => (
                  <label key={val} className={`flex-1 min-w-[60px] text-center px-4 py-3 border rounded-xl cursor-pointer transition-all ${
                    donationOption === val 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 font-semibold'
                  }`}>
                    <input type="radio" className="hidden" name="donationVal" value={val} checked={donationOption === val} onChange={() => setDonationOption(val)} />
                    {val}
                  </label>
                ))}
                <label className={`flex-1 min-w-[80px] text-center px-4 py-3 border rounded-xl cursor-pointer transition-all ${
                  donationOption === 'other' 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 font-semibold'
                }`}>
                  <input type="radio" className="hidden" name="donationVal" value="other" checked={donationOption === 'other'} onChange={() => setDonationOption('other')} />
                  Outro
                </label>
              </div>

              {donationOption === 'other' && (
                <div className="mt-2">
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Especifique o Valor</label>
                  <input
                    type="number"
                    value={donationOther}
                    onChange={(e) => setDonationOther(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 text-white rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-slate-200">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/10">
                  <Trophy size={18} />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base">5. Doadores</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 select-none">
                    Meta
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={churchDonorsMeta}
                    onChange={(e) => setChurchDonorsMeta(e.target.value)}
                    className="w-full bg-white border border-amber-900/10 text-[#0f172a] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 select-none">
                    Alcançado
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={churchDonorsRealizado}
                    onChange={(e) => handleDonorsRealizadoChange(e.target.value)}
                    className="w-full bg-white border border-amber-900/10 text-[#0f172a] rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold transition-all"
                  />
                </div>
              </div>

              {/* Intuitive helpful hint */}
              <p className="text-xs text-slate-500 mt-2 font-medium bg-amber-500/5 border border-amber-550/10 p-2.5 rounded-xl">
                💡 <strong>Dica:</strong> Digite uma quantidade no campo <strong>Alcançado</strong> acima (por exemplo: 1, 2, 3...) e os campos para digitar o <strong>Nome</strong> e <strong>WhatsApp</strong> de cada doador aparecerão instantaneamente aqui embaixo!
              </p>

              {/* Individual Donor names and WhatsApp numbers */}
              {donorsList.length > 0 && (
                <div className="mt-4 pt-4 border-t border-amber-900/10 space-y-4 animate-fade-in">
                  <span className="block text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                    📋 Detalhes dos Doadores Alcançados:
                  </span>
                  <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
                    {donorsList.map((donor, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50/50 p-3 rounded-xl border border-amber-900/5">
                        <span className="text-xs font-black text-[#78350f] flex-shrink-0 w-6">
                          #{index + 1}
                        </span>
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            placeholder="Nome do Doador"
                            required
                            value={donor.name}
                            onChange={(e) => {
                              const updated = [...donorsList];
                              updated[index] = { ...updated[index], name: e.target.value };
                              setDonorsList(updated);
                            }}
                            className="w-full bg-white border border-amber-900/10 text-[#0f172a] rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                          />
                        </div>
                        <div className="flex-1 w-full">
                          <input
                            type="tel"
                            placeholder="WhatsApp (Ex: 84999999999)"
                            required
                            value={donor.whatsapp}
                            onChange={(e) => {
                              const updated = [...donorsList];
                              const sanitized = e.target.value.replace(/\D/g, '');
                              updated[index] = { ...updated[index], whatsapp: sanitized };
                              setDonorsList(updated);
                            }}
                            className="w-full bg-white border border-amber-900/10 text-[#0f172a] rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Gamification */}
          <div className="space-y-6">
            <h2 className="text-lg font-black text-[#78350f] mb-4 rounded-xl px-4 py-2 bg-emerald-600/10 border border-emerald-600/15">
              Atividades Extras Gamificadas
            </h2>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm mb-4 flex items-start gap-3 shadow-xs">
              <AlertCircle size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="font-medium"><strong>⚠️ Atenção:</strong> Cada atividade realizada deve obrigatoriamente ser postada no Feed do Maná para que a pontuação seja validada pelo Administrador.</p>
            </div>

            <div className="space-y-3">
              {[
                { state: activity1, setter: setActivity1, text: "Preencher todos os dados até dia 20 de Junho (10 pontos)." },
                { state: activity2, setter: setActivity2, text: "Fazer a camisa do Maná para toda a equipe (10 pontos)." },
                { state: activity3, setter: setActivity3, text: "Realizar o pôr do sol dia 04 de julho e realizar assinaturas logo após (10 pontos)." },
                { state: activity4, setter: setActivity4, text: "Realizar o dia D na parte da manhã e à noite (10 pontos)." },
                { state: activity5, setter: setActivity5, text: "Reunir a comissão para propor quantidade de doação (10 pontos)." }
              ].map((act, i) => (
                <label 
                  key={i} 
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group shadow-xs ${
                    act.state 
                      ? 'bg-emerald-50/80 border-emerald-500 hover:bg-emerald-100/50' 
                      : 'bg-[#f4ebe1] border-[#d9c5b2] hover:bg-[#ebdccb] hover:border-[#c8b49e]'
                  }`}
                >
                  <div className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded border transition-all flex-shrink-0 ${
                    act.state 
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : 'border-[#a89078] bg-white text-transparent group-hover:border-[#78350f]'
                  }`}>
                    <CheckSquare size={14} className={act.state ? 'opacity-100' : 'opacity-0'} />
                  </div>
                  <input type="checkbox" className="hidden" checked={act.state} onChange={(e) => act.setter(e.target.checked)} />
                  <span className={`text-sm leading-relaxed ${act.state ? 'text-emerald-900 font-extrabold' : 'text-[#5c4024] font-semibold'}`}>{act.text}</span>
                </label>
              ))}
            </div>

            {/* Score Card */}
            <div className="mt-8 bg-white border border-emerald-600/20 rounded-3xl p-6 relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/40 blur-[50px] pointer-events-none"></div>
              
              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#78350f]">Pontuação Atual</h3>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">Veja sua performance para o ranking.</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-3xl font-black text-emerald-700 leading-none">{pontuacaoFinal.toFixed(1)}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#854d0e] mt-1">de 100 pontos</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 mt-2 overflow-hidden border border-slate-300">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                    style={{ width: `${Math.min(100, Math.max(0, pontuacaoFinal))}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-500/10">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Atividades</span>
                    <span className="font-extrabold text-emerald-800 text-sm">{activitiesPoints.toFixed(1)} / 50</span>
                  </div>
                  <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-500/10">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Metas de Assinantes</span>
                    <span className="font-extrabold text-emerald-800 text-sm">{assinantesPoints.toFixed(1)} / 50</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/25 cursor-pointer font-bold transition-all disabled:opacity-50 select-none text-sm uppercase tracking-wide"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar Dados no Ranking
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      )}
    </div>
  );
}
