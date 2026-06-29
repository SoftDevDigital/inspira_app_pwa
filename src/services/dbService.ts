import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { User, Audio, NayaMemory, Speaker, InspiraEvent, AppConfig, UsageEvent, ToolName, Book, EditorialSlot, Playlist, Payment, SuccessPath, SuccessPathLevel, TalentNotification } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';

// Helper to strip undefined values from objects (Firestore doesn't allow them)
const sanitizeData = (data: any) => {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
        clean[key] = sanitizeData(data[key]);
      } else {
        clean[key] = data[key];
      }
    }
  });
  return clean;
};

const buildAudioWritePayload = (audio: Partial<Audio>) => {
  const payload: any = { ...audio };

  // Compatibilidad bidireccional con snake_case y camelCase en Firebase.
  const audioUrl = payload.audioUrl || payload.audio_url;
  const coverUrl = payload.coverUrl || payload.cover_url;
  const previewUrl = payload.previewUrl || payload.preview_url;
  const contentType = payload.contentType || payload.content_type;

  if (audioUrl) {
    payload.audioUrl = audioUrl;
    payload.audio_url = audioUrl;
  }
  if (coverUrl) {
    payload.coverUrl = coverUrl;
    payload.cover_url = coverUrl;
  }
  if (previewUrl) {
    payload.previewUrl = previewUrl;
    payload.preview_url = previewUrl;
  }
  if (contentType) {
    payload.contentType = contentType;
    payload.content_type = contentType;
  }

  return payload;
};


const toNumber = (value: any, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const inferContentType = (raw: any): 'mentoring' | 'audiobook' => {
  const explicit = String(raw?.contentType || raw?.content_type || '').toLowerCase();
  if (['mentoring', 'mentoria', 'mentoría', 'mentor'].includes(explicit)) return 'mentoring';
  if (['audiobook', 'audio_book', 'book', 'libro'].includes(explicit)) return 'audiobook';

  const hints = [raw?.category, raw?.type, raw?.title, ...(raw?.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (hints.includes('mentor')) return 'mentoring';
  return 'audiobook';
};

const normalizeAudioDoc = (id: string, data: any): Audio => {
  const raw = data || {};
  const contentType = inferContentType(raw);

  return {
    id,
    title: raw.title || raw.titulo || 'Sin título',
    author: raw.author || raw.autor || 'INSPIRA',
    description: raw.description || raw.descripcion,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    duration: toNumber(raw.duration, 0),
    coverUrl: raw.coverUrl || raw.cover_url || raw.portadaUrl || raw.imageUrl || '',
    audioUrl: raw.audioUrl || raw.audio_url || raw.url || raw.fullAudioUrl || '',
    audioFullUrl: raw.audioFullUrl || raw.audio_full_url || raw.fullUrl,
    previewUrl: raw.previewUrl || raw.preview_url || raw.clipUrl || raw.demoUrl,
    contentType,
    isPremium: typeof raw.isPremium === 'boolean' ? raw.isPremium : (typeof raw.is_premium === 'boolean' ? raw.is_premium : contentType === 'mentoring'),
    plays: toNumber(raw.plays, 0),
    weeklyPlays: toNumber(raw.weeklyPlays, 0),
    reproducciones: toNumber(raw.reproducciones, toNumber(raw.plays, 0)),
    pendingPlays: toNumber(raw.pendingPlays, 0),
    isPendingDigest: Boolean(raw.isPendingDigest),
    uploadedAt: raw.uploadedAt || raw.createdAt || new Date().toISOString(),
    category: raw.category || raw.categoria || (contentType === 'mentoring' ? 'Mentorías' : 'Audiolibros'),
    rating: toNumber(raw.rating, 5),
    nayaReasoned: Boolean(raw.nayaReasoned),
    createdAt: raw.createdAt,
  };
};

const normalizeSpeakerDoc = (id: string, data: any): Speaker => {
  const raw = data || {};
  return {
    id,
    name: raw.name || raw.nombre || 'Speaker',
    bio: raw.bio || raw.descripcion || '',
    photoUrl: raw.photoUrl || raw.photo_url || raw.fotoUrl || raw.avatarUrl || 'https://picsum.photos/seed/speaker/600/800',
    role: raw.role || raw.rango || 'Speaker',
    userEmail: raw.userEmail || raw.email,
    totalPlays: toNumber(raw.totalPlays, 0),
    pendingPlays: toNumber(raw.pendingPlays, 0),
    createdAt: raw.createdAt,
  };
};

const normalizeEventDoc = (id: string, data: any): InspiraEvent => {
  const raw = data || {};
  const statusRaw = String(raw.status || raw.estado || 'live').toLowerCase();
  const status: 'live' | 'recorded' = ['recorded', 'replay', 'repeticion', 'repetición'].includes(statusRaw) ? 'recorded' : 'live';

  return {
    id,
    title: raw.title || raw.titulo || 'Evento INSPIRA',
    description: raw.description || raw.descripcion || '',
    date: raw.date || raw.fecha || raw.startDate || new Date().toISOString(),
    url: raw.url || raw.zoomUrl || raw.link || '',
    status,
    isPendingDigest: Boolean(raw.isPendingDigest),
    createdAt: raw.createdAt,
  };
};

const normalizeBookDoc = (id: string, data: any): Book => {
  const raw = data || {};
  const arrayStages = Array.isArray(raw.etapas)
    ? raw.etapas
    : Array.isArray(raw.stages)
      ? raw.stages
      : Array.isArray(raw.capitulos)
        ? raw.capitulos
        : [];

  const etapasFromArray = arrayStages.map((etapa: any, idx: number) => ({
    nombre: etapa?.nombre || etapa?.name || etapa?.titulo || `Etapa ${idx + 1}`,
    url: etapa?.url || etapa?.audioUrl || etapa?.audio_url || etapa?.link || null,
  }));

  const fallbackStageUrls = [
    raw.etapa1Url || raw.etapa_1_url || raw.stage1Url || raw.stage_1_url,
    raw.etapa2Url || raw.etapa_2_url || raw.stage2Url || raw.stage_2_url,
  ].filter(Boolean);

  const etapas = etapasFromArray.length > 0
    ? etapasFromArray
    : fallbackStageUrls.map((url: string, idx: number) => ({ nombre: `Etapa ${idx + 1}`, url }));

  return {
    id,
    title: raw.title || raw.titulo || 'Sin título',
    author: raw.author || raw.autor || 'INSPIRA',
    review: raw.review || raw.resena || raw.descripcion || '',
    rating: toNumber(raw.rating, 5),
    coverUrl: raw.coverUrl || raw.cover_url || raw.portadaUrl || raw.imageUrl || '',
    type: raw.type || raw.tipo || 'Audiolibro',
    category: raw.category || raw.categoria,
    viewCount: toNumber(raw.viewCount, 0),
    isPendingDigest: Boolean(raw.isPendingDigest),
    createdAt: raw.createdAt,
    etapas,
  };
};

// User Services
export const commissionService = {
  async getPayments(): Promise<Payment[]> {
    const path = 'payments';
    try {
      const snapshot = await getDocs(collection(db, 'payments'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToPayments(callback: (payments: Payment[]) => void) {
    const path = 'payments';
    return onSnapshot(collection(db, 'payments'), (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      // Sort by date desc
      payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(payments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async settleTalent(talentId: string, talentName: string, amount: number, playsSettled: number) {
    const path = `payments`;
    try {
      // 1. Create payment record
      const payment: Omit<Payment, 'id'> = {
        talentId,
        talentName,
        amount,
        playsSettled,
        date: new Date().toISOString()
      };
      const cleanPayment = sanitizeData(payment);
      const newPaymentRef = doc(collection(db, 'payments'));
      await setDoc(newPaymentRef, { ...cleanPayment, id: newPaymentRef.id });

      // 2. Reset pending plays for the talent
      const talentRef = doc(db, 'speakers', talentId);
      await updateDoc(talentRef, { pendingPlays: 0 });

      // 3. Reset pending plays for all audios by this talent
      const audioQuery = query(collection(db, 'audiobooks'), where('author', '==', talentName));
      const audioSnap = await getDocs(audioQuery);
      
      for (const audioDoc of audioSnap.docs) {
        const audioRef = doc(db, 'audiobooks', audioDoc.id);
        await updateDoc(audioRef, { pendingPlays: 0 });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
};

export { userService } from './userService';

// Audiobook (Audio) Services
export const audioService = {
  async getAudiobooks(): Promise<Audio[]> {
    const path = 'audiobooks';
    try {
      const querySnapshot = await getDocs(collection(db, 'audiobooks'));
      return querySnapshot.docs.map(doc => normalizeAudioDoc(doc.id, doc.data()));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToAudiobooks(callback: (audios: Audio[]) => void) {
    const path = 'audiobooks';
    return onSnapshot(collection(db, 'audiobooks'), (snapshot) => {
      const audios = snapshot.docs.map(doc => normalizeAudioDoc(doc.id, doc.data()));
      callback(audios);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async createAudiobook(audio: Omit<Audio, 'id'>): Promise<string> {
    const path = 'audiobooks';
    try {
      const cleanAudio = sanitizeData(buildAudioWritePayload({
        ...audio,
        isPendingDigest: true
      }));
      const newDocRef = doc(collection(db, 'audiobooks'));
      await setDoc(newDocRef, { ...cleanAudio, id: newDocRef.id });
      return newDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async updateAudio(audioId: string, updates: Partial<Audio>) {
    const path = `audiobooks/${audioId}`;
    try {
      const cleanUpdates = sanitizeData(buildAudioWritePayload(updates));
      const docRef = doc(db, 'audiobooks', audioId);
      await updateDoc(docRef, cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async incrementPlayCount(audioId: string) {
    const path = `audiobooks/${audioId}`;
    try {
      const audioRef = doc(db, 'audiobooks', audioId);
      const audioSnap = await getDoc(audioRef);
      if (audioSnap.exists()) {
        const audioData = audioSnap.data() as Audio;
        await updateDoc(audioRef, { 
          plays: (audioData.plays || 0) + 1,
          reproducciones: (audioData.reproducciones || 0) + 1,
          pendingPlays: (audioData.pendingPlays || 0) + 1
        });

        // Match with speaker/talent to increment their plays
        const speakerQuery = query(collection(db, 'speakers'), where('name', '==', audioData.author));
        const speakerSnap = await getDocs(speakerQuery);
        
        if (!speakerSnap.empty) {
          const speakerDoc = speakerSnap.docs[0];
          const speakerRef = doc(db, 'speakers', speakerDoc.id);
          const speakerData = speakerDoc.data();
          await updateDoc(speakerRef, {
            totalPlays: (speakerData.totalPlays || 0) + 1,
            pendingPlays: (speakerData.pendingPlays || 0) + 1
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
  
  async deleteAudio(audioId: string) {
    const path = `audiobooks/${audioId}`;
    try {
      await deleteDoc(doc(db, 'audiobooks', audioId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

// Speaker (Start Talent) Services
export const speakerService = {
  async getSpeakers(): Promise<Speaker[]> {
    const path = 'speakers';
    try {
      const querySnapshot = await getDocs(collection(db, 'speakers'));
      return querySnapshot.docs.map(doc => normalizeSpeakerDoc(doc.id, doc.data()));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToSpeakers(callback: (speakers: Speaker[]) => void) {
    const path = 'speakers';
    return onSnapshot(collection(db, 'speakers'), (snapshot) => {
      const speakers = snapshot.docs.map(doc => normalizeSpeakerDoc(doc.id, doc.data()));
      callback(speakers);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async createSpeaker(speaker: Omit<Speaker, 'id'>): Promise<string> {
    const path = 'speakers';
    try {
      const cleanSpeaker = sanitizeData(speaker);
      const newDocRef = doc(collection(db, 'speakers'));
      await setDoc(newDocRef, { ...cleanSpeaker, id: newDocRef.id });
      return newDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async updateSpeaker(speakerId: string, updates: Partial<Speaker>) {
    const path = `speakers/${speakerId}`;
    try {
      const cleanUpdates = sanitizeData(updates);
      const docRef = doc(db, 'speakers', speakerId);
      await updateDoc(docRef, cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteSpeaker(speakerId: string) {
    const path = `speakers/${speakerId}`;
    try {
      await deleteDoc(doc(db, 'speakers', speakerId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

// Event Services
export const eventService = {
  async getEvents(): Promise<InspiraEvent[]> {
    const path = 'events';
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      return querySnapshot.docs.map(doc => normalizeEventDoc(doc.id, doc.data()));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToEvents(callback: (events: InspiraEvent[]) => void) {
    const path = 'events';
    return onSnapshot(collection(db, 'events'), (snapshot) => {
      const events = snapshot.docs.map(doc => normalizeEventDoc(doc.id, doc.data()));
      callback(events);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async createEvent(event: Omit<InspiraEvent, 'id'>): Promise<string> {
    const path = 'events';
    try {
      const cleanEvent = sanitizeData({
        ...event,
        isPendingDigest: true
      });
      const newDocRef = doc(collection(db, 'events'));
      await setDoc(newDocRef, { ...cleanEvent, id: newDocRef.id });
      return newDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async updateEvent(eventId: string, updates: Partial<InspiraEvent>) {
    const path = `events/${eventId}`;
    try {
      const cleanUpdates = sanitizeData(updates);
      const docRef = doc(db, 'events', eventId);
      await updateDoc(docRef, cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteEvent(eventId: string) {
    const path = `events/${eventId}`;
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

// Naya Memory Services
export const nayaMemoryService = {
  async getMemory(userId: string): Promise<NayaMemory | null> {
    const path = 'naya_memory';
    try {
      const q = query(collection(db, 'naya_memory'), where('user_id', '==', userId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as NayaMemory;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async saveMemory(memory: NayaMemory) {
    const path = `naya_memory/${memory.id}`;
    try {
      const cleanMemory = sanitizeData(memory);
      await setDoc(doc(db, 'naya_memory', memory.id), cleanMemory);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};

// Config Services
export const configService = {
  async getConfig(): Promise<AppConfig | null> {
    const path = 'config/global';
    try {
      const docRef = doc(db, 'config', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AppConfig;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  subscribeToConfig(callback: (config: AppConfig | null) => void) {
    const path = 'config/global';
    return onSnapshot(doc(db, 'config', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as AppConfig);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  async updateConfig(updates: Partial<AppConfig>) {
    const path = 'config/global';
    try {
      const cleanUpdates = sanitizeData(updates);
      const docRef = doc(db, 'config', 'global');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, { ...cleanUpdates, updatedAt: new Date().toISOString() });
      } else {
        await setDoc(docRef, { ...cleanUpdates, id: 'global', updatedAt: new Date().toISOString() });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};

export const bookService = {
  async getBooks(): Promise<Book[]> {
    const path = 'books';
    try {
      const snapshot = await getDocs(collection(db, 'books'));
      return snapshot.docs.map(doc => normalizeBookDoc(doc.id, doc.data()));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToBooks(callback: (books: Book[]) => void) {
    const path = 'books';
    return onSnapshot(collection(db, 'books'), (snapshot) => {
      const books = snapshot.docs.map(doc => normalizeBookDoc(doc.id, doc.data()));
      callback(books);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async createBook(book: Omit<Book, 'id'>): Promise<string> {
    const path = 'books';
    try {
      const cleanBook = sanitizeData({
        ...book,
        isPendingDigest: true
      });
      const newDocRef = doc(collection(db, 'books'));
      await setDoc(newDocRef, { ...cleanBook, id: newDocRef.id });
      return newDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async updateBook(bookId: string, updates: Partial<Book>) {
    const path = `books/${bookId}`;
    try {
      const cleanUpdates = sanitizeData(updates);
      const docRef = doc(db, 'books', bookId);
      await updateDoc(docRef, cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteBook(bookId: string) {
    const path = `books/${bookId}`;
    try {
      await deleteDoc(doc(db, 'books', bookId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

// Telemetry Services
export const telemetryService = {
  async logUsageEvent(toolName: ToolName, duration?: number, contextId?: string) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const path = 'usage_events';
    try {
      const event: UsageEvent = {
        userId,
        toolName,
        timestamp: new Date().toISOString(),
        duration,
        contextId
      };
      const cleanEvent = sanitizeData(event);
      await setDoc(doc(collection(db, 'usage_events')), cleanEvent);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  subscribeToUsageEvents(callback: (events: UsageEvent[]) => void) {
    const path = 'usage_events';
    // Optionally limit to last N events or last 30 days
    return onSnapshot(collection(db, 'usage_events'), (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UsageEvent));
      callback(events);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};

// Editorial Services
export const editorialService = {
  async getEditorialSlots(): Promise<EditorialSlot[]> {
    const path = 'editorial_calendar';
    try {
      const snapshot = await getDocs(collection(db, 'editorial_calendar'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EditorialSlot));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToEditorialSlots(callback: (slots: EditorialSlot[]) => void) {
    const path = 'editorial_calendar';
    return onSnapshot(collection(db, 'editorial_calendar'), (snapshot) => {
      const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EditorialSlot));
      callback(slots);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async updateEditorialSlot(slotId: string, updates: Partial<EditorialSlot>) {
    const path = `editorial_calendar/${slotId}`;
    try {
      const cleanUpdates = sanitizeData(updates);
      await updateDoc(doc(db, 'editorial_calendar', slotId), cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async createEditorialSlot(slot: Omit<EditorialSlot, 'id'>) {
    const path = 'editorial_calendar';
    try {
      const slots = await this.getEditorialSlots();
      
      // If priority is high, we need to shift subsequent slots
      if (slot.isPriority) {
        const sameTypeSlots = slots
          .filter(s => s.type === slot.type && s.startDate >= slot.startDate)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        for (const s of sameTypeSlots) {
          const newStart = new Date(s.startDate);
          const newEnd = new Date(s.endDate);
          
          if (slot.type === 'weekly_audio') {
            newStart.setDate(newStart.getDate() + 7);
            newEnd.setDate(newEnd.getDate() + 7);
          } else {
            newStart.setMonth(newStart.getMonth() + 1);
            newEnd.setMonth(newEnd.getMonth() + 1);
          }

          await this.updateEditorialSlot(s.id, {
            startDate: newStart.toISOString(),
            endDate: newEnd.toISOString()
          });
        }
      }

      const cleanSlot = sanitizeData(slot);
      return await addDoc(collection(db, 'editorial_calendar'), cleanSlot);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getLeastPlayedAudios(limitCount: number = 8): Promise<Audio[]> {
    const audios = await audioService.getAudiobooks();
    return [...audios]
      .sort((a, b) => (a.plays || 0) - (b.plays || 0))
      .slice(0, limitCount);
  },
  async autoProgramAudios() {
    const audios = await audioService.getAudiobooks();
    const editorialSlots = await this.getEditorialSlots();

    const mentoringAudios = [...audios]
      .filter(a => a.contentType === 'mentoring')
      .sort((a, b) => (a.plays || 0) - (b.plays || 0));

    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
    nextMonday.setHours(0, 0, 0, 0);

    for (let i = 0; i < 20; i++) {
      const startDate = new Date(nextMonday);
      startDate.setDate(startDate.getDate() + (i * 7));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      const existing = editorialSlots.find(s => s.type === 'weekly_audio' && s.startDate === startDate.toISOString());
      if (!existing && mentoringAudios[i]) {
        await this.createEditorialSlot({
          type: 'weekly_audio',
          contentType: 'mentoring',
          contentId: mentoringAudios[i].id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      }
    }
  },

  async autoProgramBooks() {
    const audios = await audioService.getAudiobooks();
    const editorialSlots = await this.getEditorialSlots();

    const bookAudios = [...audios]
      .filter(a => a.contentType === 'audiobook')
      .sort((a, b) => (a.plays || 0) - (b.plays || 0));

    const firstOfNextMonth = new Date();
    firstOfNextMonth.setMonth(firstOfNextMonth.getMonth() + 1);
    firstOfNextMonth.setDate(1);
    firstOfNextMonth.setHours(0, 0, 0, 0);

    for (let i = 0; i < 5; i++) {
      const startDate = new Date(firstOfNextMonth);
      startDate.setMonth(startDate.getMonth() + i);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); 
      endDate.setHours(23, 59, 59, 999);

      const existing = editorialSlots.find(s => s.type === 'monthly_book' && s.startDate === startDate.toISOString());
      if (!existing && bookAudios[i]) {
        await this.createEditorialSlot({
          type: 'monthly_book',
          contentType: 'audiobook',
          contentId: bookAudios[i].id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      }
    }
  },

  async clearPendingDigest() {
    try {
      // Clear audios
      const audios = await audioService.getAudiobooks();
      const pendingAudios = audios.filter(a => a.isPendingDigest);
      for (const audio of pendingAudios) {
        await audioService.updateAudio(audio.id, { isPendingDigest: false });
      }

      // Clear books
      const books = await bookService.getBooks();
      const pendingBooks = books.filter(b => b.isPendingDigest);
      for (const book of pendingBooks) {
        await bookService.updateBook(book.id, { isPendingDigest: false });
      }

      // Clear events
      const events = await eventService.getEvents();
      const pendingEvents = events.filter(e => e.isPendingDigest);
      for (const event of pendingEvents) {
        await eventService.updateEvent(event.id, { isPendingDigest: false });
      }
    } catch (error) {
      console.error('Error clearing pending digest:', error);
      throw error;
    }
  }
};

export const playlistService = {
  async createPlaylist(name: string): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) return '';

    const path = 'userPlaylists';
    try {
      const playlist: Omit<Playlist, 'id'> = {
        userId,
        name,
        audioIds: [],
        createdAt: new Date().toISOString()
      };
      const cleanPlaylist = sanitizeData(playlist);
      const newDocRef = doc(collection(db, 'userPlaylists'));
      await setDoc(newDocRef, { ...cleanPlaylist, id: newDocRef.id });
      return newDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async addItemToPlaylist(playlistId: string, itemId: string, type: 'audio' | 'book') {
    const path = `userPlaylists/${playlistId}`;
    try {
      const docRef = doc(db, 'userPlaylists', playlistId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const field = type === 'audio' ? 'audioIds' : 'bookIds';
        const ids = data[field] || [];
        if (!ids.includes(itemId)) {
          await updateDoc(docRef, { [field]: [...ids, itemId] });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async removeItemFromPlaylist(playlistId: string, itemId: string, type: 'audio' | 'book') {
    const path = `userPlaylists/${playlistId}`;
    try {
      const docRef = doc(db, 'userPlaylists', playlistId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const field = type === 'audio' ? 'audioIds' : 'bookIds';
        const ids = data[field] || [];
        await updateDoc(docRef, { [field]: ids.filter((id: string) => id !== itemId) });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deletePlaylist(playlistId: string) {
    const path = `userPlaylists/${playlistId}`;
    try {
      await deleteDoc(doc(db, 'userPlaylists', playlistId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeToPlaylists(userId: string, callback: (playlists: Playlist[]) => void) {
    const path = 'userPlaylists';
    const q = query(collection(db, 'userPlaylists'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const playlists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist));
      callback(playlists);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};

export const successPathService = {
  async getPaths(): Promise<SuccessPath[]> {
    const path = 'success_paths';
    try {
      const snapshot = await getDocs(collection(db, 'success_paths'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SuccessPath));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToPaths(callback: (paths: SuccessPath[]) => void) {
    const path = 'success_paths';
    return onSnapshot(collection(db, 'success_paths'), (snapshot) => {
      const paths = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SuccessPath));
      callback(paths);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async updatePath(pathId: string, updates: Partial<SuccessPath>) {
    const path = `success_paths/${pathId}`;
    try {
      const cleanUpdates = sanitizeData(updates);
      const docRef = doc(db, 'success_paths', pathId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { ...cleanUpdates, updatedAt: new Date().toISOString() });
      } else {
        await setDoc(docRef, { ...cleanUpdates, id: pathId, updatedAt: new Date().toISOString() });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async createPath(pathData: Omit<SuccessPath, 'id'>): Promise<string> {
    const path = 'success_paths';
    try {
      const cleanData = sanitizeData(pathData);
      const newDocRef = doc(collection(db, 'success_paths'));
      await setDoc(newDocRef, { ...cleanData, id: newDocRef.id, updatedAt: new Date().toISOString() });
      return newDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async deletePath(pathId: string) {
    const path = `success_paths/${pathId}`;
    try {
      await deleteDoc(doc(db, 'success_paths', pathId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

// Talent Notifications Services
export const talentNotificationService = {
  async sendNotification(notification: Omit<TalentNotification, 'id'>) {
    const path = 'talent_notifications';
    try {
      const cleanData = sanitizeData(notification);
      const newRef = doc(collection(db, 'talent_notifications'));
      await setDoc(newRef, { ...cleanData, id: newRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  subscribeToNotificationsByTalent(talentName: string, callback: (msgs: TalentNotification[]) => void) {
    const path = 'talent_notifications';
    const q = query(collection(db, 'talent_notifications'), where('talentName', '==', talentName));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as TalentNotification);
      msgs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};
