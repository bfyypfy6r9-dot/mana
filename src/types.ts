export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  district: "Parque dos Coqueiros";
  church: "Guajiru" | "Jardim Petrópolis" | "Vale Dourado 1" | "Vale Dourado 2" | "Parque dos Coqueiros 1" | "Parque dos Coqueiros 2";
  isApproved: boolean;
  createdAt: any; // Firestore Timestamp
}

export interface DonorDetail {
  name: string;
  whatsapp: string;
}

export interface ChurchData {
  id: string; // e.g. "Guajiru_2026-06"
  church: "Guajiru" | "Jardim Petrópolis" | "Vale Dourado 1" | "Vale Dourado 2" | "Parque dos Coqueiros 1" | "Parque dos Coqueiros 2";
  monthYear: string; // "YYYY-MM"
  
  // 1. Membros Ativos
  activeMembersMeta: number;
  activeMembersTotal: number;
  
  // 2. Assinantes
  subscribersTotal: number;
  subscribersRealizado: number;
  
  // 3. Sem Assinatura
  noSubscribersTotal: number;
  noSubscribersRealizado: number;
  
  // 4. Doações da Igreja e Doadores
  churchDonationsValue: number; 
  churchDonorsMeta: number;
  churchDonorsRealizado: number;
  donorsList?: DonorDetail[];
  
  // Gamification Checkboxes
  activity1: boolean;
  activity2: boolean;
  activity3: boolean;
  activity4: boolean;
  activity5: boolean;

  pontuacaoFinal: number;
  gamificationApproved?: boolean;
  
  updatedAt: any; // Firestore Timestamp
  updatedBy: string;
}

export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  church: string;
  text: string;
  imageUrl?: string; // firebase storage URL or Base64 fallback
  createdAt: any; // Firestore Timestamp
  likes?: string[];
  comments?: FeedComment[];
}

export interface FeedComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

export const CHURCHES = [
  "Guajiru",
  "Jardim Petrópolis",
  "Vale Dourado 1",
  "Vale Dourado 2",
  "Parque dos Coqueiros 1",
  "Parque dos Coqueiros 2"
] as const;

export type ChurchType = typeof CHURCHES[number];
