/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'Ventas' | 'Testimonios' | 'Prospectación' | 'Motivación';

export interface EditorialSlot {
  id: string;
  type: 'weekly_audio' | 'monthly_book';
  contentType: 'mentoring' | 'audiobook' | 'book';
  contentId: string;
  startDate: string; // ISO format
  endDate: string;   // ISO format
  isPriority?: boolean;
}

export interface Audio {
  id: string;
  title: string;
  author: string;
  tags?: string[];
  description?: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  audioFullUrl?: string; // Explicitly for Mentoring full audio
  previewUrl?: string; // Short version for free users
  contentType?: 'audiobook' | 'mentoring';
  isPremium?: boolean;
  plays?: number;
  weeklyPlays?: number;
  reproducciones?: number;
  pendingPlays?: number; // New: Unpaid plays for commission breakdown
  isPendingDigest?: boolean; // New: Tracking items for the weekly digest
  uploadedAt?: string; // ISO format
  category?: string;
  rating?: number;
  nayaReasoned?: boolean;
  createdAt?: string;
}

export interface SuccessPathLevel {
  id: string;
  title: string; // "Nivel 1", etc.
  rank: string;  // "Bronce", etc.
  audioIds: string[];
  bookIds: string[];
  description: string;
  color?: string;
}

export interface SuccessPath {
  id: string;
  name: string;
  levels: SuccessPathLevel[];
  updatedAt: string;
}

export interface InspiraEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO format
  url: string;
  status: 'live' | 'recorded';
  isPendingDigest?: boolean;
  createdAt?: string;
}

export interface AppConfig {
  id: string;
  whatsappVentas: string;
  whatsappSoporte: string;
  commissionRate: number; // Added: MXN/USD per valid play
  bankDetails: {
    banco: string;
    titular: string;
    cuenta: string;
    clabe: string;
  };
  updatedAt?: string;
}

export type SubscriptionType = 'Mensual' | 'Semestral' | 'Anual';

export type UserPlan = 'Gratis' | 'Premium';

export type UserRank = 
  | 'Consultora' | 'Futura Directora' | 'Directora en Calificación (DIQ)' | 'Directora de Ventas Independiente' | 'Directora Senior' | 'Directora Ejecutiva' | 'Directora de Elite' | 'Directora Nacional' | 'Star Talent'
  | 'Consultor' | 'Futuro Director' | 'Director en Calificación (DIQ)' | 'Director de Ventas Independiente' | 'Director Senior' | 'Director Ejecutivo' | 'Director de Elite' | 'Director Nacional';

export interface Permissions {
  dashboard?: boolean;
  inventory?: boolean;
  crm?: boolean;
  audiobooks?: boolean;
  mentoring?: boolean;
  talent?: boolean;
  commissions?: boolean;
  events?: boolean;
  editorial?: boolean;
  routes?: boolean;
}

export type MedalTrigger = 'login' | 'racha_dias' | 'audios_completados' | 'favoritos_agregados' | 'compartir_app' | 'ruta_nivel_completado';

export interface Medal {
  id: string | number;
  titulo: string;
  descripcion: string;
  icono: string; // Emoji
  tipoTrigger: MedalTrigger;
  meta: number;
  color?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  plan: UserPlan;
  subscriptionType?: SubscriptionType;
  expiryDate?: string; // ISO format
  fecha_ultimo_regalo?: string; 
  regalos_hoy?: number; 
  current_rank?: UserRank; // renamed from rank
  gender?: 'Mujer' | 'Hombre' | 'Otros';
  points?: number; // added
  customAddress?: string;
  country?: string;
  city?: string;
  state?: string;
  birthDate?: string;
  birthdate?: string; // compat alias para persistencia en Firestore
  phone?: string;
  completedAudios: string[]; // IDs of completed audios
  completedBooks?: string[]; // IDs of completed books
  createdAt: string;
  playlists?: Playlist[];
  // Sharing System
  dailyPassesUsed?: number;
  lastPassUsageDate?: string;
  dailyPassesRedeemedCount?: number;
  lastPassRedeemedDate?: string;
  fcmToken?: string;
  notificationStatus?: 'granted' | 'denied' | 'postponed';
  sessionCount?: number;
  lastNotificationPromptDate?: string;
  isAdmin?: boolean;
  isStartTalentVIP?: boolean;
  permissions?: Permissions;
  // Gamification
  streakCount?: number;
  lastActiveDate?: string;
  xp?: number; // Minutes listened
  unlockedMedalIds: string[]; // renamed from trophies
  lastLogin?: string;
  onboardingCompleted?: boolean;
}

export interface Speaker {
  id: string;
  name: string;
  bio: string;
  photoUrl: string;
  role: string;
  userEmail?: string; // Link to user for VIP access
  totalPlays?: number;   // Historical
  pendingPlays?: number; // Unpaid
  createdAt?: string;
}

export interface BookEtapa {
  nombre: string;
  url: string | null;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  review: string;
  rating: number;
  coverUrl: string;
  type: string;
  category?: string;
  viewCount?: number;
  isPendingDigest?: boolean;
  createdAt?: string;
  etapas?: BookEtapa[];
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  audioIds: string[];
  bookIds?: string[];
  createdAt: string;
}

export interface NayaMemory {
  id: string;
  user_id: string;
  last_interaction_timestamp: string;
  short_term_context: string[];
  long_term_summary: string;
}

export interface Payment {
  id: string;
  talentId: string;
  talentName: string;
  amount: number;
  playsSettled: number;
  date: string; // ISO format
}

export type ToolName = 'Chat Naya (IA)' | 'Audiolibros' | 'Mentorías (Start Talent)' | 'Eventos Zoom';

export interface UsageEvent {
  id?: string;
  userId: string;
  toolName: ToolName;
  timestamp: string;
  duration?: number; // duration in seconds if applicable
  contextId?: string; // audioId, bookId, etc.
}

export interface TalentNotification {
  id: string;
  talentName: string;
  authorName: string;
  message: string;
  adminId: string;
  adminName: string;
  date: string;
  read: boolean;
  audioTitle?: string;
  rank?: number;
}

export interface UsageSummary {
  toolName: ToolName;
  totalInteractions: number;
  totalDurationHours: number;
}
