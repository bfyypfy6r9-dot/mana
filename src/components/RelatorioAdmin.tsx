import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, ChurchData, CHURCHES, ChurchType } from '../types';
import { 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  FolderSync, 
  Calendar, 
  Filter, 
  TrendingUp, 
  FileSpreadsheet, 
  ListOrdered, 
  Loader2, 
  X,
  Plus,
  Compass,
  DollarSign,
  Trash2,
  CheckSquare,
  AlertCircle,
  Save
} from 'lucide-react';

interface RelatorioAdminProps {
  userProfile: UserProfile;
}

export default function RelatorioAdmin({ userProfile }: RelatorioAdminProps) {
  // Month selector
  const getCurrentMonthString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [monthYear, setMonthYear] = useState(getCurrentMonthString());
  const [filterChurch, setFilterChurch] = useState<'Distrito' | ChurchType>('Distrito');
  
  // States
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [rawChurchData, setRawChurchData] = useState<Record<string, ChurchData>>({});
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  // States for administering select church gamification
  const [adminAct1, setAdminAct1] = useState(false);
  const [adminAct2, setAdminAct2] = useState(false);
  const [adminAct3, setAdminAct3] = useState(false);
  const [adminAct4, setAdminAct4] = useState(false);
  const [adminAct5, setAdminAct5] = useState(false);
  const [savingGamification, setSavingGamification] = useState(false);

  // Sync selected church's gamification states when database data or selected church changes
  const selectedChurchData = filterChurch !== 'Distrito' ? rawChurchData[filterChurch] : null;

  useEffect(() => {
    if (selectedChurchData) {
      setAdminAct1(selectedChurchData.activity1 ?? false);
      setAdminAct2(selectedChurchData.activity2 ?? false);
      setAdminAct3(selectedChurchData.activity3 ?? false);
      setAdminAct4(selectedChurchData.activity4 ?? false);
      setAdminAct5(selectedChurchData.activity5 ?? false);
    } else {
      setAdminAct1(false);
      setAdminAct2(false);
      setAdminAct3(false);
      setAdminAct4(false);
      setAdminAct5(false);
    }
  }, [filterChurch, selectedChurchData]);

  // Load registered users (Admins only)
  useEffect(() => {
    setLoadingUsers(true);
    const pathForList = 'users';

    const unsubscribe = onSnapshot(collection(db, 'users'), (querySnapshot) => {
      const usersList: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        usersList.push(doc.data() as UserProfile);
      });
      setAllUsers(usersList);
      setLoadingUsers(false);
    }, (err) => {
      console.error("Erro ao buscar usuários pro admin:", err);
      handleFirestoreError(err, OperationType.LIST, pathForList);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []); // Remove updatingUserId dependency as onSnapshot handles updates

  // Load monthly church data
  useEffect(() => {
    setLoadingStats(true);
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
      setLoadingStats(false);
    }, (err) => {
      console.error("Erro ao buscar estatísticas pro admin:", err);
      handleFirestoreError(err, OperationType.LIST, pathForList);
      setLoadingStats(false);
    });

    return () => unsubscribe();
  }, [monthYear]);

  // Handle user Approval
  const handleApproveUser = async (userId: string, currentStatus: boolean) => {
    setUpdatingUserId(userId);
    const pathForUpdate = `users/${userId}`;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isApproved: !currentStatus
      });
    } catch (err) {
      console.error("Erro ao alternar status do usuário:", err);
      alert("Não foi possível atualizar o status de aprovação.");
      handleFirestoreError(err, OperationType.UPDATE, pathForUpdate);
    } finally {
      setUpdatingUserId(null); // This is fine to trigger useEffect once more
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUpdatingUserId(userId);
    const pathForDelete = `users/${userId}`;
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      setConfirmDeleteUserId(null);
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      alert("Não foi possível excluir o usuário.");
      handleFirestoreError(err, OperationType.DELETE, pathForDelete);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSaveGamification = async (approveStatus: boolean) => {
    if (!selectedChurchData) return;
    setSavingGamification(true);
    const docId = selectedChurchData.id;
    const pathForUpdate = `mana_data/${docId}`;
    try {
      // Calculate activities points based on checkboxes
      let activitiesPoints = 0;
      if (adminAct1) activitiesPoints += 10;
      if (adminAct2) activitiesPoints += 10;
      if (adminAct3) activitiesPoints += 10;
      if (adminAct4) activitiesPoints += 10;
      if (adminAct5) activitiesPoints += 10;

      // Calculate Assinantes Points (Max 50)
      let assinantesPoints = 0;
      const realized = Number(selectedChurchData.subscribersRealizado) || 0;
      const totalMembers = Number(selectedChurchData.activeMembersTotal) || 0;
      if (totalMembers > 0) {
        const taxa = (realized / totalMembers) * 100;
        if (taxa >= 90) {
          assinantesPoints = 50;
        } else {
          assinantesPoints = (taxa / 90) * 50;
        }
      }
      assinantesPoints = Math.min(50, Math.max(0, assinantesPoints));

      // Calculate new final score: if approved, sum of members points + approved gamified actions
      // If NOT approved, only members points.
      const newScore = assinantesPoints + (approveStatus ? activitiesPoints : 0);

      await updateDoc(doc(db, 'mana_data', docId), {
        activity1: adminAct1,
        activity2: adminAct2,
        activity3: adminAct3,
        activity4: adminAct4,
        activity5: adminAct5,
        gamificationApproved: approveStatus,
        pontuacaoFinal: newScore,
        updatedAt: new Date()
      });
      alert(approveStatus ? "Gamificação autorizada/salva com sucesso para o ranking!" : "Gamificação removida do ranking com sucesso!");
    } catch (err) {
      console.error("Erro ao homologar gamificação:", err);
      alert("Erro ao salvar homologação.");
      handleFirestoreError(err, OperationType.UPDATE, pathForUpdate);
    } finally {
      setSavingGamification(false);
    }
  };

  // Calculations for consolidated district or filtered church
  const stat = useMemo(() => {
    let result = {
      reportingChurchesCount: 0,
      activeMembersTotal: 0,
      activeMembersMeta: 0,
      subscribersTotal: 0,
      subscribersRealizado: 0,
      noSubscribersTotal: 0,
      noSubscribersRealizado: 0,
      churchDonationsValue: 0,
      churchDonorsMeta: 0,
      churchDonorsRealizado: 0,
      sumPontuacaoFinal: 0
    };

    const processData = (d: any) => {
      result.activeMembersTotal += Number(d.activeMembersTotal) || 0;
      result.activeMembersMeta += Number(d.activeMembersMeta) || 0;
      result.subscribersTotal += Number(d.subscribersTotal) || 0;
      result.subscribersRealizado += Number(d.subscribersRealizado) || 0;
      result.noSubscribersTotal += Number(d.noSubscribersTotal) || 0;
      result.noSubscribersRealizado += Number(d.noSubscribersRealizado) || 0;
      result.churchDonationsValue += Number(d.churchDonationsValue) || 0;
      result.churchDonorsMeta += Number(d.churchDonorsMeta) || 0;
      result.churchDonorsRealizado += Number(d.churchDonorsRealizado) || 0;
      result.sumPontuacaoFinal += Number(d.pontuacaoFinal) || 0;
    }

    if (filterChurch === 'Distrito') {
      CHURCHES.forEach((ch) => {
        const d = rawChurchData[ch];
        if (d) {
          result.reportingChurchesCount++;
          processData(d);
        }
      });
    } else {
      const d = rawChurchData[filterChurch];
      if (d) {
        result.reportingChurchesCount = 1;
        processData(d);
      }
    }

    return result;
  }, [rawChurchData, filterChurch]);

  const getPercentValue = (realizado: number, meta: number) => {
    if (!meta || meta <= 0) return 0;
    return Math.round((realizado / meta) * 100);
  };

  // Helper row component for data values sheet
  const StatRecordRow = ({ 
    numId, 
    label, 
    meta, 
    real, 
    isCurrency = false 
  }: { 
    numId: string, 
    label: string, 
    meta: number | string, 
    real: number | string, 
    isCurrency?: boolean 
  }) => {
    const metaNum = Number(meta) || 0;
    const realNum = Number(real) || 0;
    const pct = getPercentValue(realNum, metaNum);
    return (
      <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
        <td className="px-5 py-4 text-xs font-mono text-slate-400 select-none">{numId}</td>
        <td className="px-5 py-4 text-sm font-semibold text-white">{label}</td>
        <td className="px-5 py-4 text-sm text-slate-355 text-slate-300">
          {isCurrency ? `R$ ${metaNum.toLocaleString('pt-BR')}` : meta}
        </td>
        <td className="px-5 py-4 text-sm font-bold text-white">
          {isCurrency ? `R$ ${realNum.toLocaleString('pt-BR')}` : real}
        </td>
        <td className="px-5 py-4 text-right">
          <span className={`inline-flex items-center gap-1 text-sm font-black px-2.5 py-1 rounded-lg ${pct >= 100 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : pct >= 50 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
            {pct}%
          </span>
        </td>
      </tr>
    );
  };

  // Count registered/approved stats
  const pendingUsers = allUsers.filter(u => !u.isApproved);
  const approvedUsers = allUsers.filter(u => u.isApproved);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative z-10 text-slate-200 font-sans">
      
      {/* Admin Title Banner */}
      <div className="bg-white/5 border border-white/10 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-[10%] right-[-10%] w-64 h-64 bg-blue-900/20 rounded-full filter blur-3xl pointer-events-none select-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-4 items-center">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 font-extrabold shadow-inner select-none border border-white/10">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 id="admin_header_title" className="text-2xl font-bold tracking-tight">Painel Consolidado de Gestão</h1>
              <p className="text-slate-350 text-sm">Controle distrital de usuários, aprovações e relatórios do programa Maná.</p>
            </div>
          </div>
          
          <div className="px-3.5 py-1.5 bg-white/10 text-slate-300 text-xs font-semibold rounded-full select-none border border-white/5">
            Administrador Logado: <span className="text-white font-bold">{userProfile.email}</span>
          </div>
        </div>
      </div>

      {/* Grid system for reports on left and approval on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Reports view (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 rounded-3xl border border-white/10 shadow-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-400" size={20} />
                <h3 className="font-bold text-white text-lg">Estatísticas Consolidadas</h3>
              </div>

              {/* Data Filters block */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Year/Month Select */}
                <div className="bg-white/10 px-3 py-1.5 border border-white/10 rounded-xl lg:w-36 flex items-center gap-1.5 [color-scheme:dark]">
                  <Calendar size={14} className="text-slate-300" />
                  <input
                    id="admin_month_picker"
                    type="month"
                    value={monthYear}
                    onChange={(e) => setMonthYear(e.target.value)}
                    className="bg-transparent text-white font-semibold text-xs outline-none cursor-pointer"
                  />
                </div>

                {/* Church Select */}
                <div className="bg-white/10 px-3 py-1.5 border border-white/10 rounded-xl flex items-center gap-1.5 [color-scheme:dark]">
                  <Filter size={14} className="text-slate-300" />
                  <select
                    id="admin_church_filter"
                    value={filterChurch}
                    onChange={(e) => setFilterChurch(e.target.value as any)}
                    className="bg-transparent text-white font-semibold text-xs outline-none cursor-pointer"
                  >
                    <option className="bg-[#141b2b] text-white" value="Distrito">Consolidado Distrito</option>
                    {CHURCHES.map((ch) => (
                      <option className="bg-[#141b2b] text-white" key={ch} value={ch}>
                         IASD {ch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loadingStats ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <Loader2 size={32} className="text-emerald-400 animate-spin" />
                <p className="text-sm text-slate-400 uppercase font-bold tracking-wider">Consolidando bases estatísticas do distrito...</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Visual badges for District Participation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 border border-white/10 rounded-2xl flex flex-col justify-center">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Igrejas Reportadas</span>
                    {filterChurch === 'Distrito' ? (
                      <span className="text-2xl font-black text-white mt-1">
                        {stat.reportingChurchesCount} <span className="text-slate-400 text-sm font-normal">de 6 igrejas enviaram dados</span>
                      </span>
                    ) : (
                      <span className="text-2xl font-black text-white mt-1">
                        {rawChurchData[filterChurch] ? 'Dados Enviados ✅' : 'Pendente ⏳'}
                      </span>
                    )}
                  </div>

                  <div className="bg-white/5 p-4 border border-white/10 rounded-2xl flex flex-col justify-center">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Métrica de Assinaturas (Geral)</span>
                    <span className="text-2xl font-black text-white mt-1">
                      {stat.subscribersRealizado} <span className="text-slate-400 text-sm font-normal">de {stat.subscribersTotal} ({getPercentValue(stat.subscribersRealizado, stat.subscribersTotal)}%)</span>
                    </span>
                  </div>
                </div>

                {/* Table representation */}
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-450">REF</th>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-450">Atividade / Métrica</th>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-450">Meta</th>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-450">Realizado</th>
                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-450">ALCANCE</th>
                      </tr>
                    </thead>
                    <tbody id="admin_stats_rows">
                      <StatRecordRow 
                        numId="1.0" 
                        label="Membros Ativos Registrados" 
                        meta={stat.activeMembersMeta} 
                        real={stat.activeMembersTotal} 
                      />
                      <StatRecordRow 
                        numId="2.0" 
                        label="Assinantes" 
                        meta={stat.subscribersTotal} 
                        real={stat.subscribersRealizado} 
                      />
                      <StatRecordRow 
                        numId="3.0" 
                        label="Sem Assinatura" 
                        meta={stat.noSubscribersTotal} 
                        real={stat.noSubscribersRealizado} 
                      />
                      <StatRecordRow 
                        numId="4.0" 
                        label="Total de Doações da Igreja" 
                        meta="-" 
                        real={stat.churchDonationsValue} 
                      />
                      <StatRecordRow 
                        numId="5.0" 
                        label="Membros Doadores" 
                        meta={stat.churchDonorsMeta} 
                        real={stat.churchDonorsRealizado} 
                      />
                      <StatRecordRow 
                        numId="6.0" 
                        label="Pontuação Gamification" 
                        meta={stat.reportingChurchesCount * 100} 
                        real={stat.sumPontuacaoFinal} 
                      />
                    </tbody>
                  </table>
                </div>

                {stat.reportingChurchesCount === 0 && (
                  <div className="p-8 text-center bg-amber-500/10 text-amber-350 border border-amber-500/20 rounded-2xl text-sm font-semibold italic flex items-center justify-center gap-1.5">
                    Nenhum dado cadastrado pelas igrejas para {monthYear} até o momento.
                  </div>
                )}

                {/* Gamification Approval Area for Single Church Selection */}
                {filterChurch !== 'Distrito' && selectedChurchData && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="text-emerald-400" size={18} />
                        <h3 className="font-bold text-white text-base">Validação de Atividades Gamificadas</h3>
                      </div>
                      
                      <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold bg-white/15">
                        {selectedChurchData.gamificationApproved ? (
                          <span className="text-emerald-400 font-black">✓ Homologado</span>
                        ) : (
                          <span className="text-amber-400 font-black">⏳ Pendente</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-amber-500/5 text-amber-200 text-xs p-3 rounded-xl border border-amber-500/10 flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <p>
                        <strong>Dica de Gestão:</strong> Valide se as atividades extras foram publicadas no Feed de Notícias antes de aprovar. Atividades não salvas e não homologadas por você <strong>não aparecem no ranking oficial.</strong>
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { state: adminAct1, setter: setAdminAct1, original: selectedChurchData.activity1, text: "Preencher todos os dados até dia 20 de Junho" },
                        { state: adminAct2, setter: setAdminAct2, original: selectedChurchData.activity2, text: "Fazer a camisa do Maná para toda a equipe" },
                        { state: adminAct3, setter: setAdminAct3, original: selectedChurchData.activity3, text: "Realizar o pôr do sol dia 04 de julho e fazer assinaturas" },
                        { state: adminAct4, setter: setAdminAct4, original: selectedChurchData.activity4, text: "Realizar o dia D na parte da manhã e à noite" },
                        { state: adminAct5, setter: setAdminAct5, original: selectedChurchData.activity5, text: "Reunir a comissão para propor quantidade de doação" }
                      ].map((act, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <span className="text-xs text-slate-300 pr-4">{act.text}</span>
                          <div className="flex items-center gap-3">
                            {/* Church Submitted Indicator */}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded select-none ${act.original ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                              {act.original ? 'Enviado ✔' : 'Não enviado ✖'}
                            </span>
                            
                            {/* Admin Switch Checkbox */}
                            <button
                              type="button"
                              onClick={() => act.setter(!act.state)}
                              className={`flex items-center justify-center w-5 h-5 rounded border cursor-pointer transition-all ${act.state ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500 bg-transparent text-transparent hover:border-emerald-400'}`}
                            >
                              <CheckSquare size={12} className={act.state ? 'opacity-100' : 'opacity-0'} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2 justify-end">
                      {selectedChurchData.gamificationApproved && (
                        <button
                          type="button"
                          disabled={savingGamification}
                          onClick={() => handleSaveGamification(false)}
                          className="px-4 py-2 border border-red-500/20 hover:bg-red-500/10 hover:text-red-400 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Revogar Homologação (Remover do Ranking)
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={savingGamification}
                        onClick={() => handleSaveGamification(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-md border border-emerald-500/20"
                      >
                        {savingGamification ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Save size={12} />
                        )}
                        Salvar e Homologar no Ranking
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* User approval screen (Right hand 1 column) */}
        <div className="space-y-6 font-sans text-slate-200">
          <div className="bg-white/5 rounded-3xl border border-white/10 shadow-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Users className="text-emerald-400" size={18} />
              <h3 className="font-bold text-white text-base">Aprovações de Membros</h3>
            </div>

            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Loader2 size={24} className="text-emerald-450 animate-spin" />
                <p className="text-xs text-slate-450">Carregando lista de logins...</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Stats indicators */}
                <div className="flex items-center justify-between text-xs font-bold px-1 text-slate-400">
                  <span>Pendentes: <strong className="text-amber-400">{pendingUsers.length}</strong></span>
                  <span>Aprovados: <strong className="text-emerald-400">{approvedUsers.length}</strong></span>
                </div>

                {/* Pending registrations list */}
                <div id="pending_users_list" className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {allUsers.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 italic py-6">Nenhum login cadastrado.</p>
                  ) : (
                    allUsers.map((user) => {
                      const isMe = user.uid === userProfile.uid;
                      const isPending = !user.isApproved;

                      return (
                        <div 
                          key={user.uid} 
                          id={`user_row_${user.uid}`}
                          className={`p-3 rounded-xl border text-xs flex flex-col gap-2 transition-all ${isPending ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/5' : 'bg-white/5 border-white/10'}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4 className="font-bold text-white leading-snug">{user.displayName}</h4>
                              <p className="text-[10px] text-slate-400 leading-none mt-1">{user.email}</p>
                            </div>
                            <span className={`inline-block px-2 py-0.5 rounded-full font-black text-[9px] uppercase border ${isPending ? 'bg-amber-500/15 text-amber-300 border-amber-500/20' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'}`}>
                              {isPending ? 'Aguardando' : 'Ativo'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5 pt-2">
                            <span>Igreja: <strong className="text-white">{user.church}</strong></span>
                            
                            {/* Approve and Delete trigger buttons */}
                            {isMe ? (
                              <span className="italic text-slate-400">Você</span>
                            ) : (
                              <div className="flex gap-1.5 items-center">
                                {confirmDeleteUserId === user.uid ? (
                                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-md p-1 px-1.5">
                                    <span className="text-[10px] text-red-300 font-bold animate-pulse">Confirmar exclusão?</span>
                                    <button
                                      type="button"
                                      disabled={updatingUserId === user.uid}
                                      onClick={() => handleDeleteUser(user.uid)}
                                      className="px-2 py-0.5 bg-red-650 hover:bg-red-500 active:bg-red-700 text-white font-black rounded-md text-[10px] cursor-pointer transition-colors shadow-sm"
                                    >
                                      {updatingUserId === user.uid ? (
                                        <Loader2 size={10} className="animate-spin" />
                                      ) : (
                                        'Sim'
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={updatingUserId === user.uid}
                                      onClick={() => setConfirmDeleteUserId(null)}
                                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-slate-300 font-bold rounded-md text-[10px] cursor-pointer transition-colors"
                                    >
                                      Não
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveUser(user.uid, user.isApproved)}
                                      disabled={updatingUserId === user.uid}
                                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${isPending ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm' : 'bg-white/10 hover:bg-amber-500/20 hover:text-amber-300 border border-white/15 text-slate-300'}`}
                                    >
                                      {updatingUserId === user.uid ? (
                                        <Loader2 size={10} className="animate-spin" />
                                      ) : isPending ? (
                                        'Aprovar'
                                      ) : (
                                        'Bloquear'
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteUserId(user.uid)}
                                      disabled={updatingUserId === user.uid}
                                      className="p-1 px-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-350 border border-red-500/25 rounded-md transition-all cursor-pointer disabled:opacity-50"
                                      title="Excluir Usuário"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
