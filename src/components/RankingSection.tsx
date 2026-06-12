import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, ChurchData, CHURCHES } from '../types';
import { 
  Trophy, 
  Calendar, 
  Loader2, 
  Sparkles,
  BarChart3,
  Target
} from 'lucide-react';

interface RankingSectionProps {
  userProfile: UserProfile;
}

export default function RankingSection({ userProfile }: RankingSectionProps) {
  const getCurrentMonthString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [monthYear, setMonthYear] = useState(getCurrentMonthString());
  const [loading, setLoading] = useState(true);
  const [rawChurchData, setRawChurchData] = useState<Record<string, ChurchData>>({});

  useEffect(() => {
    setLoading(true);
    const pathForList = 'mana_data';
    const q = query(
      collection(db, 'mana_data'), 
      where('monthYear', '==', monthYear)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dataMap: Record<string, ChurchData> = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data() as ChurchData;
        dataMap[data.church] = data;
      });
      setRawChurchData(dataMap);
      setLoading(false);
    }, (err) => {
      console.error("Erro ao buscar dados do ranking:", err);
      handleFirestoreError(err, OperationType.LIST, pathForList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [monthYear]);

  // Build ranking items (for all 6 churches)
  const rankingList = useMemo(() => {
    const list = CHURCHES.map((churchName) => {
      const data = rawChurchData[churchName];
      let score = 0;
      
      if (data) {
        // Calculate Assinantes Points (Max 50)
        let assinantesPoints = 0;
        const realized = Number(data.subscribersRealizado) || 0;
        const totalMembers = Number(data.activeMembersTotal) || 0;
        if (totalMembers > 0) {
          const taxa = (realized / totalMembers) * 100;
          if (taxa >= 90) {
            assinantesPoints = 50;
          } else {
            assinantesPoints = (taxa / 90) * 50;
          }
        }
        assinantesPoints = Math.min(50, Math.max(0, assinantesPoints));

        // Calculate Gamification Points (Max 50) - ONLY IF APPROVED/SAVED BY ADMIN
        let activitiesPoints = 0;
        if (data.gamificationApproved) {
          if (data.activity1) activitiesPoints += 10;
          if (data.activity2) activitiesPoints += 10;
          if (data.activity3) activitiesPoints += 10;
          if (data.activity4) activitiesPoints += 10;
          if (data.activity5) activitiesPoints += 10;
        }

        score = assinantesPoints + activitiesPoints;
      }

      return {
        church: churchName,
        score: score,
        hasData: !!data,
        gamificationApproved: !!data?.gamificationApproved
      };
    });

    // Sort: highest score first. If tie, sort alphabetically
    list.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.church.localeCompare(b.church);
    });

    return list;
  }, [rawChurchData]);

  const getRankBadgeAndStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          badge: <div className="h-7 w-7 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg flex items-center justify-center font-extrabold shadow-sm select-none">1º</div>,
          bg: 'border-l-4 border-l-amber-500 bg-amber-500/5'
        };
      case 1:
        return {
          badge: <div className="h-7 w-7 bg-slate-350/15 text-slate-300 border border-slate-300/20 rounded-lg flex items-center justify-center font-extrabold shadow-sm select-none">2º</div>,
          bg: 'border-l-4 border-l-slate-400 bg-slate-400/5'
        };
      case 2:
        return {
          badge: <div className="h-7 w-7 bg-amber-600/15 text-amber-500 border border-amber-600/20 rounded-lg flex items-center justify-center font-extrabold shadow-sm select-none">3º</div>,
          bg: 'border-l-4 border-l-amber-600/50 bg-amber-600/5'
        };
      default:
        return {
          badge: <div className="h-7 w-7 bg-white/5 text-slate-400 border border-white/5 rounded-lg flex items-center justify-center font-semibold text-xs select-none">{index + 1}º</div>,
          bg: 'border-l-4 border-l-transparent'
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative z-10 text-slate-200">
      
      {/* Cool Header Visual with Trophy design */}
      <div className="bg-white/5 border border-white/10 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-[10%] right-[-10%] w-60 h-60 bg-blue-900/20 rounded-full filter blur-3xl pointer-events-none select-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-4 items-center">
            <div className="h-14 w-14 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0 animate-bounce" style={{ animationDuration: '3s' }}>
              <Trophy size={32} className="fill-amber-450 stroke-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-1.5">
                Ranking Oficial <Sparkles size={18} className="text-amber-400 fill-amber-400" />
              </h1>
              <p className="text-slate-350 text-sm">Acompanhe as igrejas com melhor pontuação no Distrito.</p>
            </div>
          </div>

          <div className="bg-white/10 px-4 py-2 border border-white/10 rounded-xl flex items-center gap-2 self-start sm:self-auto">
            <Calendar size={14} className="text-slate-300" />
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="bg-transparent text-white font-semibold text-sm outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white/5 p-16 rounded-3xl border border-white/10 flex flex-col items-center justify-center space-y-3 shadow-xl">
          <Loader2 size={36} className="text-emerald-450 animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Calculando ranking atualizado...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 text-xs text-slate-400 font-bold uppercase tracking-wider select-none">
            <span>Posição & Igreja</span>
            <span>Pontuação Final</span>
          </div>

          <div className="space-y-3">
            {rankingList.map((item, index) => {
              const isMyChurch = item.church === userProfile.church;
              const { badge, bg } = getRankBadgeAndStyle(index);

              return (
                <div 
                  key={item.church}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all hover:scale-[1.01] ${isMyChurch ? 'bg-emerald-500/10 border-emerald-500/30 ring-2 ring-emerald-500/5' : 'bg-white/5 border-white/10 shadow-sm'} ${bg}`}
                >
                  <div className="flex items-center gap-3">
                    {badge}
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold flex items-center gap-1.5 ${isMyChurch ? 'text-emerald-400 font-bold' : 'text-white'}`}>
                        {item.church}
                        {isMyChurch && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-black select-none border border-emerald-500/20">
                            Sua Igreja
                          </span>
                        )}
                      </span>
                      
                      {item.hasData ? (
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className="text-xs text-slate-300 flex items-center gap-1">
                            <Target size={12} className="text-slate-400" />
                            Dados atualizados neste mês.
                          </span>
                          <span className={`text-[10px] font-medium flex items-center gap-1 ${item.gamificationApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {item.gamificationApproved ? '✓ Gamificação aprovada' : '⏳ Gamificação pendente de homologação'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic mt-1">Nenhum dado digitado este mês.</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Visual Score Bar */}
                    <div className="hidden sm:block w-32 bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(item.score, 100)}%` }}
                      ></div>
                    </div>

                    <div className={`text-right ${isMyChurch ? 'text-emerald-400' : 'text-white'}`}>
                      <span className="font-sans font-black text-2xl">{item.score.toFixed(1)}</span>
                      <div className="text-[9px] uppercase font-bold text-slate-400">pontos</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-2 mt-6 text-xs leading-relaxed text-slate-400">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-[13px] mb-2"><BarChart3 size={14} className="text-emerald-400" /> Como funciona o cálculo da Pontuação?</h4>
            <p className="flex items-start gap-2">
              <span className="font-bold shrink-0 text-emerald-500">1.</span>
              <span>A nota vai de <strong>0 a 100 pontos</strong>, sendo a soma do cumprimento das Metas da Excelência (50 pts) e das Atividades do Gamification (50 pts).</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold shrink-0 text-emerald-500">2.</span>
              <span>
                <strong>Assinantes:</strong> A meta de excelência é atingir 90% (ou mais) de Assinantes em relação ao Total de Membros Ativos, garantindo 50 pontos. Se não atingir 90%, você recebe pontos proporcionais.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold shrink-0 text-emerald-500">3.</span>
              <span>
                <strong>Atividades Gamificadas:</strong> Cada uma das 5 atividades bônus cumpridas garante mais 10 pontos (Máximo 50 pts).
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
