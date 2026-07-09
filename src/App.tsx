/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, ErrorInfo } from 'react';
import { Audio, UserPlan, User, Book, Speaker, InspiraEvent, AppConfig, SuccessPath as SuccessPathType, Medal } from './types';
import BottomNav from './components/BottomNav';
import Home from './components/Home';
import Books from './components/Books';
import Calendar from './components/Calendar';
import ChatAI from './components/ChatAI';
import AudioPlayer from './components/AudioPlayer';
import LockedView from './components/LockedView';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import IdentityForm from './components/IdentityForm';
import OnboardingForm from './components/OnboardingForm';
import AdminPanel from './components/AdminPanel';
import Library from './components/Library';
import PlaylistModal from './components/PlaylistModal';
import Sidebar from './components/Sidebar';
import TrophyRoom from './components/TrophyRoom';
import NayaChat from './components/NayaChat';
import ActionMenu from './components/ActionMenu';
import HallOfFame from './components/HallOfFame';
import SuccessPathView from './components/SuccessPath';
import BookDetail from './components/BookDetail';
import FloatingPlayer from './components/FloatingPlayer';
import FloatingAudioFAB from './components/FloatingAudioFAB';
import WeeklyDigestModal from './components/WeeklyDigestModal';
import LegalView from './components/LegalView';
import InstallPWA from './components/InstallPWA';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { userService, speakerService, audioService, eventService, configService, telemetryService, editorialService, bookService, playlistService, successPathService } from './services/dbService';
import { useUserPlaylists } from './hooks/useUserPlaylists';
import { savePlayerState, loadPlayerState, clearPlayerState } from './services/playerPersistence';
import { useGamification } from './hooks/useGamification';
import { AnimatePresence, motion } from 'motion/react';
import { X, ListMusic, AlertCircle, Sparkles, Bell, CheckCircle2, Shield } from 'lucide-react';
import { Playlist, EditorialSlot } from './types';

const SUPER_ADMIN_EMAIL = 'operaciones@inspiraapps.com';

// Clave donde cacheamos el último perfil de usuario conocido (datos propios de
// la app, NO el token de Firebase). Se usa como respaldo si Firestore no
// responde, para preservar onboardingCompleted y evitar reenviar al formulario.
const CACHED_PROFILE_KEY = 'inspira_cached_profile';

// Claves propias de la app que SÍ podemos borrar al cerrar sesión o en una
// limpieza de emergencia. NUNCA borramos las claves "firebase:authUser:*",
// porque eso destruiría la sesión de Firebase Auth (causa del auto-deslogueo).
const APP_LOCAL_STORAGE_KEYS = [
  CACHED_PROFILE_KEY,
  'inspira_auth',
  'inspira_user',
  'inspira_theme',
  'last_weekly_update_seen',
  'pending_audio_id',
];

/**
 * Borra SOLO las claves propias de la app de localStorage.
 * Preserva deliberadamente cualquier clave de Firebase (firebase:authUser:*),
 * de modo que la sesión del usuario sobreviva. Reemplaza al peligroso
 * localStorage.clear() que borraba el token y causaba el auto-deslogueo.
 */
const clearAppLocalStorage = () => {
  try {
    APP_LOCAL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.warn('[localStorage] No se pudieron limpiar las claves de la app:', e);
  }
};

/** Guarda el perfil resuelto para usarlo como respaldo offline. */
const cacheUserProfile = (profile: User) => {
  try {
    localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('[localStorage] No se pudo cachear el perfil:', e);
  }
};

/** Lee el perfil cacheado para un uid concreto (o null si no coincide/!existe). */
const readCachedProfile = (uid: string): User | null => {
  try {
    const raw = localStorage.getItem(CACHED_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (parsed && parsed.id === uid) return parsed;
    return null;
  } catch (e) {
    console.warn('[localStorage] No se pudo leer el perfil cacheado:', e);
    return null;
  }
};

class GlobalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, errorMsg: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message || String(error) };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CRASH INTERCEPTADO:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 p-8 flex flex-col items-center justify-center font-mono text-[10px] sm:text-xs z-[99999]">
          <h2 className="text-xl font-black mb-4 text-white uppercase">⚠️ Error Interceptado</h2>
          <p className="mb-4 text-zinc-400">Toma captura de este error para Operaciones:</p>
          <div className="bg-red-950/30 border border-red-500/50 p-4 rounded-xl w-full max-w-md overflow-auto">
            <p className="font-bold">{this.state.errorMsg}</p>
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-white text-black font-black uppercase rounded-xl">
            Reiniciar Sistema
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentAudio, setCurrentAudio] = useState<Audio | null>(null);
  

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isPlayerExpanded) {
      setIsPlayerExpanded(false);
    }
    // Scroll to top on navigation
    window.scrollTo(0, 0);
  };

  const [userPlan, setUserPlan] = useState<UserPlan>('Gratis'); // Default to Gratis until verified
  const [authLoading, setAuthLoading] = useState(true); // Track auth loading state
  const [completedAudios, setCompletedAudios] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [unlockedMedal, setUnlockedMedal] = useState<Medal | null>(null);
  
  // GAMIFICATION MOTOR - APAGADO PARA EVITAR MEMORY LEAK
  /*
  useGamification(user, (medal) => {
    setUnlockedMedal(medal);
    setTimeout(() => setUnlockedMedal(null), 5000);
  });
  */
  const [dynamicSpeakers, setDynamicSpeakers] = useState<Speaker[]>([]);
  const [dynamicAudios, setDynamicAudios] = useState<Audio[]>([]);
  const [dynamicBooks, setDynamicBooks] = useState<Book[]>([]);
  const [events, setEvents] = useState<InspiraEvent[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [successPaths, setSuccessPaths] = useState<SuccessPathType[]>([]);
  const [editorialSlots, setEditorialSlots] = useState<EditorialSlot[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const { playlists: userPlaylists } = useUserPlaylists(user?.id);
  const [godModeMessage, setGodModeMessage] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  
  // FIX: Solo suscribir a Firestore cuando el usuario está autenticado
  // Esto evita reconexiones constantes cuando Firestore no está disponible
  useEffect(() => {
    if (!isAuthenticated) return; // No suscribir si no hay usuario
    
    const unsubSpeakers = speakerService.subscribeToSpeakers((data) => {
      setDynamicSpeakers(data);
    });
    const unsubAudios = audioService.subscribeToAudiobooks((data) => {
      setDynamicAudios(data);
    });
    const unsubEvents = eventService.subscribeToEvents((data) => {
      setEvents(data);
    });
    const unsubConfig = configService.subscribeToConfig((data) => {
      setAppConfig(data);
    });
    const unsubEditorial = editorialService.subscribeToEditorialSlots((data) => {
      setEditorialSlots(data);
    });
    const unsubBooks = bookService.subscribeToBooks((data) => {
      setDynamicBooks(data);
    });
    const unsubPaths = successPathService.subscribeToPaths((data: SuccessPathType[]) => {
      setSuccessPaths(data);
    });
    return () => {
      unsubSpeakers();
      unsubAudios();
      unsubEvents();
      unsubConfig();
      unsubEditorial();
      unsubBooks();
      unsubPaths();
    };
  }, [isAuthenticated]); // Dependencia: solo cuando cambia isAuthenticated

  const [showLoadingError, setShowLoadingError] = useState(false);

  // Escape de emergencia: si authLoading se queda colgado demasiado tiempo,
  // simplemente dejamos de cargar para que la UI no se quede trabada.
  // BUGFIX CRÍTICO: NO usamos localStorage.clear() ni window.location.reload().
  // Antes, esto borraba el token de Firebase Auth (browserLocalPersistence) y
  // recargaba la página, lo que provocaba el AUTO-DESLOGUEO en bucle.
  // Ahora solo liberamos el estado de carga; la sesión de Firebase queda intacta.
  useEffect(() => {
    let emergencyTimer: NodeJS.Timeout;
    if (authLoading && !needsOnboarding) {
      emergencyTimer = setTimeout(() => {
        console.warn('[Auth] Carga demasiado lenta; liberando authLoading sin destruir la sesión.');
        setAuthLoading(false);
      }, 15000);
    }
    return () => clearTimeout(emergencyTimer);
  }, [authLoading, needsOnboarding]);

  useEffect(() => {
    let loadingTimer: NodeJS.Timeout;
    if (isAuthenticated && !user && !error) {
      loadingTimer = setTimeout(() => {
        setShowLoadingError(true);
      }, 8000); // 8 seconds timeout for initial data fetch
    }
    return () => clearTimeout(loadingTimer);
  }, [isAuthenticated, user, error]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setIsAuthenticated(false);
        setUser(null);
        setUserPlan('Gratis');
        setNeedsOnboarding(false);
        setAuthLoading(false);
        return;
      }

      const email = firebaseUser.email?.toLowerCase() || '';
      const isSuperAdmin = email === SUPER_ADMIN_EMAIL.toLowerCase();

      // Función para aplicar un perfil ya resuelto al estado de la app.
      const applyResolvedUser = (resolvedUser: User) => {
        const hasCompletedOnboarding = resolvedUser.role === 'Admin' || resolvedUser.onboardingCompleted === true;
        setUser(resolvedUser);
        setIsAuthenticated(true);
        setUserPlan(resolvedUser.plan || 'Gratis');
        setIsAdminPanelOpen(resolvedUser.role === 'Admin');
        setNeedsOnboarding(!hasCompletedOnboarding);
        cacheUserProfile(resolvedUser); // respaldo offline
      };

      try {
        // Firestore es la fuente de verdad. getUser ya usa caché local como
        // respaldo y tiene timeout interno. Devuelve null SOLO si el documento
        // confirmadamente no existe; lanza error si hubo problema de red.
        const existingData = await userService.getUser(firebaseUser.uid);

        if (existingData) {
          const resolvedUser: User = {
            ...existingData,
            id: existingData.id || firebaseUser.uid,
            email: existingData.email || email,
            name: existingData.name || firebaseUser.displayName || 'Diamante',
            completedAudios: existingData.completedAudios || [],
            unlockedMedalIds: existingData.unlockedMedalIds || []
          };

          const shouldForceAdmin = isSuperAdmin && (!resolvedUser.isAdmin || resolvedUser.role !== 'Admin');
          const shouldMarkOnboardingCompleted = !!resolvedUser.current_rank && resolvedUser.onboardingCompleted !== true;

          if (shouldForceAdmin || shouldMarkOnboardingCompleted) {
            const patch: Partial<User> = {
              ...(shouldForceAdmin ? { isAdmin: true, role: 'Admin', plan: 'Premium' } : {}),
              ...(shouldMarkOnboardingCompleted ? { onboardingCompleted: true } : {}),
            };
            // Aplicamos el patch al estado de inmediato y persistimos en
            // SEGUNDO PLANO (sin await). Así, aunque la escritura a Firestore
            // se cuelgue, authLoading NUNCA queda bloqueado y no se dispara el
            // timer de emergencia. (Causa C del bug.)
            Object.assign(resolvedUser, patch);
            userService.updateUser(firebaseUser.uid, patch).catch((e) =>
              console.warn('[Auth] No se pudo persistir el patch de perfil (se reintentará luego):', e)
            );
          }

          applyResolvedUser(resolvedUser);
        } else {
          // El documento NO existe en Firestore. Antes de crear uno nuevo,
          // verificamos si teníamos un perfil cacheado para este uid: si el
          // usuario ya había hecho onboarding, lo respetamos y no lo forzamos
          // de nuevo al formulario.
          const cached = readCachedProfile(firebaseUser.uid);
          if (cached && cached.onboardingCompleted) {
            console.info('[Auth] Documento ausente pero hay perfil cacheado con onboarding; usándolo.');
            applyResolvedUser(cached);
          } else {
            // Primera vez real: creamos el documento.
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Diamante',
              email,
              role: isSuperAdmin ? 'Admin' : 'User',
              isAdmin: isSuperAdmin,
              plan: isSuperAdmin ? 'Premium' : 'Gratis',
              onboardingCompleted: isSuperAdmin,
              lastLogin: new Date().toISOString(),
              completedAudios: [],
              createdAt: new Date().toISOString(),
              unlockedMedalIds: []
            };

            // Creamos en segundo plano para no bloquear la resolución de auth.
            userService.createUser(newUser).catch((e) =>
              console.warn('[Auth] No se pudo crear el documento de usuario (se reintentará luego):', e)
            );

            applyResolvedUser(newUser);
          }
        }

        setError(null);
      } catch (error: any) {
        // Error de red/timeout leyendo el perfil. NO deslogueamos ni forzamos
        // onboarding: usamos el perfil cacheado si existe (preservando
        // onboardingCompleted). Solo si no hay caché mostramos un perfil mínimo.
        console.warn('Auth handler: no se pudo leer el perfil desde Firestore, usando respaldo:', error);

        const cached = readCachedProfile(firebaseUser.uid);
        if (cached) {
          console.info('[Auth] Usando perfil cacheado tras error de red. onboardingCompleted =', cached.onboardingCompleted);
          applyResolvedUser({ ...cached, id: cached.id || firebaseUser.uid });
          setError(null);
        } else {
          const fallbackUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Diamante',
            email,
            role: isSuperAdmin ? 'Admin' : 'User',
            isAdmin: isSuperAdmin,
            plan: isSuperAdmin ? 'Premium' : 'Gratis',
            completedAudios: [],
            createdAt: new Date().toISOString(),
            unlockedMedalIds: [],
            // Sin perfil cacheado no podemos saber si completó onboarding.
            // Para super admin lo damos por hecho; para el resto se mostrará
            // el formulario, pero NUNCA se cierra la sesión.
            onboardingCompleted: isSuperAdmin,
          };

          setUser(fallbackUser);
          setIsAuthenticated(true);
          setUserPlan(fallbackUser.plan || 'Gratis');
          setNeedsOnboarding(!(fallbackUser.role === 'Admin' || fallbackUser.onboardingCompleted === true));
          setError('No pudimos cargar tu perfil desde Firestore. Revisa la conexión; tu sesión sigue activa.');
        }
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // REAL-TIME USER SUBSCRIPTION - APAGADO PARA EVITAR MEMORY LEAK
  /*
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const unsubUser = userService.subscribeToUser(user.id, (updatedData) => {
        if (updatedData) {
          setUser((prevUser) => {
            const hasChanged = JSON.stringify(prevUser) !== JSON.stringify(updatedData);
            if (hasChanged) {
              if (updatedData.plan) {
                setUserPlan(updatedData.plan);
              }
              return updatedData;
            }
            return prevUser;
          });
        }
      });
      return () => unsubUser();
    }
  }, [isAuthenticated, user?.id]);
  */

  // Dynamic Identity Label
  const identityLabel = user?.customAddress || (user?.gender === 'Mujer' ? 'Directora' : (user?.gender === 'Hombre' ? 'Director' : 'Líder'));

  // Gamification: Level Calculation
  const getUserLevel = (xp: number) => {
    if (xp < 60) return 'Mente en Apertura';
    if (xp < 300) return 'Arquitecta(o) de Hábitos';
    if (xp < 1000) return 'Estratega de Resultados';
    if (xp < 5000) return 'Maestría en Liderazgo';
    return 'Referente de Éxito';
  };

  const userLevel = getUserLevel(user?.xp || 0);

  const handleToggleAdminSimulation = () => {
    // Si no hay objeto de usuario en el estado local, lo creamos para esta sesión
    const currentUserObj = user || { 
      email: auth.currentUser?.email || SUPER_ADMIN_EMAIL,
      isAdmin: true,
      role: 'Admin',
      name: auth.currentUser?.displayName || 'Admin',
      plan: 'Premium',
      completedAudios: [],
      playlists: []
    } as User;

    const nextPlan: UserPlan = currentUserObj.plan === 'Premium' ? 'Gratis' : 'Premium';
    
    // MUTACIÓN DIRECTA: Sobrescribimos el objeto de usuario y el plan inyectado
    setUser({ ...currentUserObj, plan: nextPlan });
    setUserPlan(nextPlan);
    
    setGodModeMessage(`PLAN MUTADO A: ${nextPlan.toUpperCase()}`);
    setTimeout(() => setGodModeMessage(null), 3000);
  };

  const hasPremiumAccess = user?.plan === 'Premium';
  const providedPlan: UserPlan = hasPremiumAccess ? 'Premium' : 'Gratis';

  const [isNavHidden, setIsNavHidden] = useState(false);
  const [activePassAudioId, setActivePassAudioId] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [isWeeklyDigestOpen, setIsWeeklyDigestOpen] = useState(false);
  const [isLegalViewOpen, setIsLegalViewOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumModalInfo, setPremiumModalInfo] = useState({
    title: "Suscripción Premium",
    description: "Únete a la élite de INSPIRA",
    buttonText: "Confirmar en WhatsApp"
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playlistItemToAdd, setPlaylistItemToAdd] = useState<Audio | Book | null>(null);
  const [showDegradationPopup, setShowDegradationPopup] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTrophyRoomOpen, setIsTrophyRoomOpen] = useState(false);
  const [theme, setTheme] = useState<'elegant' | 'clarity'>('elegant');
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);
  const [isGiftLimitModalOpen, setIsGiftLimitModalOpen] = useState(false);
  const [retryFCMToken, setRetryFCMToken] = useState<string | undefined>(undefined);
  const [isRetrySuccessVisible, setIsRetrySuccessVisible] = useState(false);
  const [localPlayCounts, setLocalPlayCounts] = useState<Record<string, number>>({});

  const allSpeakers = useMemo(() => {
    return dynamicSpeakers.reduce((acc, current) => {
      const exists = acc.find(item => item.id === current.id || item.userEmail === current.userEmail);
      if (!exists) acc.push(current);
      return acc;
    }, [] as Speaker[]);
  }, [dynamicSpeakers]);

  const allAudios: Audio[] = useMemo(() => {
    return dynamicAudios
      .filter((audio) => Boolean(audio.audioUrl))
      .reduce((acc, current) => {
        const exists = acc.find(item => item.id === current.id);
        if (!exists) acc.push(current);
        return acc;
      }, [] as Audio[])
      .map(audio => ({
        ...audio,
        reproducciones: (audio.reproducciones || 0) + (localPlayCounts[audio.id] || 0)
      }));
  }, [dynamicAudios, localPlayCounts]);

  const activeEvent = events.find(e => e.status === 'live') || [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  // Weekly Digest Logic
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const today = new Date();
      const isMonday = today.getDay() === 1; // 1 is Monday
      const dateStr = today.toISOString().split('T')[0];
      const lastSeen = localStorage.getItem('last_weekly_update_seen');

      if (isMonday && lastSeen !== dateStr) {
        setIsWeeklyDigestOpen(true);
      }
    }
  }, [isAuthenticated, authLoading]);

  const handleCloseWeeklyDigest = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('last_weekly_update_seen', dateStr);
    setIsWeeklyDigestOpen(false);
  };

  // Audio Global State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playCounted, setPlayCounted] = useState(false);
  const [queue, setQueue] = useState<Audio[]>([]); // Initialized empty, will be updated by useEffect
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Persistencia del reproductor (IndexedDB): posición a restaurar y throttle de guardado.
  const restorePositionRef = useRef<number | null>(null);
  const hasRestoredRef = useRef(false);
  const lastSaveRef = useRef(0);

  // Initialize queue once audios are loaded
  useEffect(() => {
    if (allAudios.length > 0 && queue.length === 0) {
      setQueue(allAudios.slice(0, 10));
    }
  }, [allAudios, queue.length]);

  // ---------------------------------------------------------------------------
  // PERSISTENCIA DEL REPRODUCTOR (B1)
  // Al abrir la app, restauramos el contenido y la posición exacta donde el
  // usuario se quedó (guardados en IndexedDB). Se restaura en PAUSA y en modo
  // mini-reproductor, para no interrumpir; el usuario retoma con un toque.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated || allAudios.length === 0 || hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    (async () => {
      const saved = await loadPlayerState();
      if (!saved) return;
      const audio = allAudios.find(a => a.id === saved.contentId);
      if (!audio) return;

      // Reconstruimos la fila por categoría (sin mezclar géneros) sin autoplay.
      const currentType = audio.contentType || 'audiobook';
      const sameType = allAudios.filter(a => (a.contentType || 'audiobook') === currentType);
      const related = sameType.filter(a => a.category === audio.category || a.author === audio.author);
      const rest = sameType.filter(a => !related.some(r => r.id === a.id));
      const ordered = [...related, ...rest].filter(a => a.id !== audio.id);
      setQueue([audio, ...ordered]);

      restorePositionRef.current = saved.position || 0;
      setCurrentAudio(audio);
      setIsPlaying(false);          // reanudar manualmente
      setIsPlayerExpanded(false);   // mostrar mini-reproductor
    })();
  }, [isAuthenticated, allAudios.length]);

  // Selector de audio mejorado para auto-play inmediato
  const handleSelectAudio = (audio: Audio | null) => {
    if (!audio) {
      setCurrentAudio(null);
      setIsPlaying(false);
      return;
    }
    
    const isCourtesyPass = activePassAudioId === audio.id;
    
    setIsLoading(true);
    setCurrentAudio(audio);
    setIsPlaying(true);

    // Auto-expand player for everyone
    setIsPlayerExpanded(true);

    // Actualización dinámica de la Fila (Autoplay por categoría, estilo Spotify).
    // REGLA: no mezclar géneros. Si escuchas mentorías, la fila sigue con
    // mentorías; si escuchas audiolibros, sigue con audiolibros.
    const currentType = audio.contentType || 'audiobook';
    const sameType = allAudios.filter(a => (a.contentType || 'audiobook') === currentType);
    // Priorizamos misma categoría/autor y luego el resto de la misma categoría de contenido.
    const related = sameType.filter(a => a.category === audio.category || a.author === audio.author);
    const rest = sameType.filter(a => !related.some(r => r.id === a.id));
    const ordered = [...related, ...rest].filter(a => a.id !== audio.id);
    const newQueue = [audio, ...ordered];
    setQueue(newQueue);
    
    // Log telemetry
    const toolName = audio.contentType === 'mentoring' ? 'Mentorías (Start Talent)' : 'Audiolibros';
    telemetryService.logUsageEvent(toolName, undefined, audio.id);

    // Increment reproducciones locally and in DB
    setLocalPlayCounts(prev => ({
      ...prev,
      [audio.id]: (prev[audio.id] || 0) + 1
    }));
    audioService.incrementPlayCount(audio.id);
  };

  const handleToggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue(prev => prev.filter(a => a.id !== id));
  };

  const handleNextAudio = () => {
    if (!currentAudio || queue.length === 0) return;
    const currentIndex = queue.findIndex(a => a.id === currentAudio.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    handleSelectAudio(queue[nextIndex]);
  };

  const handlePreviousAudio = () => {
    if (!currentAudio || queue.length === 0) return;
    const currentIndex = queue.findIndex(a => a.id === currentAudio.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    handleSelectAudio(queue[prevIndex]);
  };

  const handleMoveInQueue = (id: string, direction: 'up' | 'down') => {
    const index = queue.findIndex(a => a.id === id);
    if (index === -1) return;
    const newQueue = [...queue];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < queue.length) {
      [newQueue[index], newQueue[targetIndex]] = [newQueue[targetIndex], newQueue[index]];
      setQueue(newQueue);
    }
  };

  // REGLA DE PLOMO: Hard Reset del Elemento Audio para evitar truncamiento
  useEffect(() => {
    if (audioRef.current && currentAudio) {
      const isCourtesyPass = activePassAudioId === currentAudio.id;
      const isStage = currentAudio.contentType === 'audiobook' || currentAudio.id.includes('_etapa_');
      
      // Bypass Estricto: Determinar URL definitiva
      let url = currentAudio.audioFullUrl || currentAudio.audioUrl;
      
      if (isStage) {
        // Audiolibros (Etapas): Siempre audio full, incondicional
        url = currentAudio.audioUrl;
      } else if (providedPlan !== 'Premium' && !isCourtesyPass) {
        // Mentorías: Usuario GRATIS -> preview
        url = currentAudio.previewUrl || currentAudio.audioUrl;
      }

      console.log("REPRODUCIENDO TRACK EXACTO:", {
        id: currentAudio.id,
        title: currentAudio.title,
        url,
        type: isStage ? 'Audiolibro/Etapa' : 'Mentoría',
        user: providedPlan
      });

      // Reset profundo del buffer
      setPlayCounted(false); // REGLA ANTIFRAUDE: Resetear contador en cambio de pista
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.load(); // REGLA DE PLOMO: Forzar recarga completa
      
      if (isPlaying) {
        setIsLoading(true);
        audioRef.current.volume = 1.0;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play()
          .then(() => setIsLoading(false))
          .catch(e => {
            console.error("Error al reproducir:", e);
            setIsLoading(false);
          });
      }
    }
  }, [currentAudio?.id, providedPlan, activePassAudioId]);

  useEffect(() => {
    if (currentAudio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const prevTime = currentTime;
      const newTime = audioRef.current.currentTime;
      const audioDuration = audioRef.current.duration;
      setCurrentTime(newTime);
      
      // REGLA DEL 30% ANTIFRAUDE (Comisiones)
      if (!playCounted && audioDuration > 0 && (newTime / audioDuration) >= 0.3) {
        setPlayCounted(true);
        if (currentAudio) {
          audioService.incrementPlayCount(currentAudio.id);
          console.log("REPRODUCCIÓN VÁLIDA (30%):", currentAudio.title);
        }
      }
      
      // XP Logic: Increment XP based on listened time (every minute)
      if (Math.floor(newTime / 60) > Math.floor(prevTime / 60)) {
        if (user && currentAudio) {
          const toolName = currentAudio.contentType === 'mentoring' ? 'Mentorías (Start Talent)' : 'Audiolibros';
          telemetryService.logUsageEvent(toolName, 60, currentAudio.id); // Log 60 seconds of usage

          const updatedUser: User = { ...user, xp: (user.xp || 0) + 1 };
          setUser(updatedUser);
        }
      }
      
      if (providedPlan === 'Gratis' && activePassAudioId !== currentAudio?.id && audioRef.current.currentTime >= 180) {
        setIsPlaying(false);
        audioRef.current.pause();
      }

      // Persistencia: guardamos la posición cada ~5s mientras se reproduce.
      if (currentAudio && newTime > 0) {
        const now = Date.now();
        if (now - lastSaveRef.current > 5000) {
          lastSaveRef.current = now;
          persistPlayer(newTime, true);
        }
      }
    }
  };

  // Guarda el estado actual del reproductor (contenido + posición) en IndexedDB.
  const persistPlayer = (position?: number, playing?: boolean) => {
    if (!currentAudio) return;
    const pos = position ?? audioRef.current?.currentTime ?? currentTime;
    savePlayerState({
      contentId: currentAudio.id,
      contentType: currentAudio.contentType || 'audiobook',
      position: pos,
      duration: audioRef.current?.duration || duration || 0,
      title: currentAudio.title,
      isPlaying: playing ?? isPlaying,
      timestamp: Date.now(),
    }).catch(() => {});
  };

  // Guardar al minimizar/cerrar la app (background) o al ocultar la pestaña.
  useEffect(() => {
    const saveNow = () => {
      if (currentAudio && audioRef.current) {
        persistPlayer(audioRef.current.currentTime, isPlaying);
      }
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') saveNow(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', saveNow);
    window.addEventListener('beforeunload', saveNow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', saveNow);
      window.removeEventListener('beforeunload', saveNow);
    };
  }, [currentAudio?.id, isPlaying, currentTime, duration]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      // Restaurar posición guardada (persistencia del reproductor).
      if (restorePositionRef.current != null) {
        const pos = restorePositionRef.current;
        restorePositionRef.current = null;
        if (pos > 0 && pos < audioRef.current.duration - 1) {
          audioRef.current.currentTime = pos;
          setCurrentTime(pos);
        }
      }
    }
  };

  const handleAudioError = () => {
    console.error("Error cargando fuente de audio");
    setIsLoading(false);
  };

  const handleAudioEnded = () => {
    const isCourtesyPass = activePassAudioId === currentAudio?.id;

    // Usuarios GRATIS (sin pase de cortesía): mostrar modal Premium al terminar.
    if (providedPlan === 'Gratis' && currentAudio && !isCourtesyPass) {
      setIsPlaying(false);
      setPremiumModalInfo({
        title: "¿Quieres escuchar más?",
        description: "Pásate a Premium para desbloquear la mentoría completa y cientos de audios exclusivos más.",
        buttonText: "Ser Premium Ahora"
      });
      setIsPremiumModalOpen(true);
      return;
    }

    // Reproducción continua (B2): solo para Premium, ya que el siguiente
    // contenido de la cola no está desbloqueado para usuarios Gratis.
    // La cola ya está filtrada por categoría (no se mezclan géneros).
    if (providedPlan === 'Premium' && currentAudio && queue.length > 1) {
      const currentIndex = queue.findIndex(a => a.id === currentAudio.id);
      // Si hay un siguiente elemento en la cola, lo reproducimos automáticamente.
      if (currentIndex !== -1 && currentIndex < queue.length - 1) {
        handleSelectAudio(queue[currentIndex + 1]);
        return;
      }
    }

    // Fin de la cola (o usuario Gratis con pase de cortesía): detener reproducción.
    setIsPlaying(false);
  };

  const handleGiveGift = (audio: Audio | null) => {
    if (!audio || !user || !hasPremiumAccess) return;
    
    const today = new Date().toDateString();
    const usedCount = user.lastPassUsageDate === today ? (user.dailyPassesUsed || 0) : 0;

    if (usedCount >= 20) {
      alert("Has agotado tus 20 pases de cortesía por hoy. ¡Vuelve mañana para seguir inspirando!");
      return;
    }

    const shareUrl = `${window.location.origin}/audio/${audio.id}`;
    const message = `¡Hola! Te comparto este audio exclusivo de INSPIRA: "${audio.title}" de ${audio.author}. ¡Escúchalo completo aquí de regalo! ✨\n\n${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Update count
    const updatedUser: User = {
      ...user,
      dailyPassesUsed: usedCount + 1,
      lastPassUsageDate: today
    };
    setUser(updatedUser);
    userService.updateUser(user.id, {
      dailyPassesUsed: updatedUser.dailyPassesUsed,
      lastPassUsageDate: updatedUser.lastPassUsageDate
    }).catch(console.error);
  };

  // Streak logic
  useEffect(() => {
    if (user && user.id) {
      const today = new Date().toDateString();
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;
      
      if (lastActive !== today) {
        let newStreak = user.streakCount || 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();

        if (lastActive === yesterdayString) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }

        const updatedUser: User = {
          ...user,
          streakCount: newStreak,
          lastActiveDate: new Date().toISOString()
        };
        setUser(updatedUser);
        userService.updateUser(user.id, {
          streakCount: updatedUser.streakCount,
          lastActiveDate: updatedUser.lastActiveDate
        }).catch(console.error);
      }
    }
  }, [isAuthenticated]); // Only run on login or reload

  useEffect(() => {
    const savedTheme = localStorage.getItem('inspira_theme') as 'elegant' | 'clarity';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('inspira_theme', theme);
  }, [theme]);

  const isExpiringTomorrow = user && hasPremiumAccess && user.expiryDate ? (() => {
    const expiry = new Date(user.expiryDate).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  })() : false;

  const handleCreatePlaylist = async (name: string, firstItemId?: string, type: 'audio' | 'book' = 'audio') => {
    if (!user) return;
    const newPlaylistId = await playlistService.createPlaylist(name);
    if (newPlaylistId && firstItemId) {
      await playlistService.addItemToPlaylist(newPlaylistId, firstItemId, type);
    }
  };

  const handleNavigateToPlaylist = (id: string) => {
    setPlaylistToOpen(id);
    handleTabChange('library');
  };

  const [playlistToOpen, setPlaylistToOpen] = useState<string | null>(null);

  useEffect(() => {
    if (playlistToOpen) {
      handleTabChange('library');
      // The state will be used by Library component
    }
  }, [playlistToOpen]);

  const handleDeletePlaylist = async (id: string) => {
    if (!user) return;
    await playlistService.deletePlaylist(id);
  };

  const handleRemoveFromPlaylist = async (playlistId: string, itemId: string, type: 'audio' | 'book' = 'audio') => {
    if (!user) return;
    await playlistService.removeItemFromPlaylist(playlistId, itemId, type);
  };

  const handleRenamePlaylist = async (id: string, newName: string) => {
    if (!user) return;
    // Assuming rename exists or updating via generic updateDoc
    // For now, I'll just use the provided handleRenamePlaylist placeholder or implement it in playlistService
    const { updateDoc, doc } = await import('firebase/firestore');
    const { db } = await import('./services/firebase');
    await updateDoc(doc(db, 'userPlaylists', id), { name: newName });
  };

  const handleSharePass = (audio: Audio) => {
    if (!user || !hasPremiumAccess) return;
    
    const today = new Date().toDateString();
    const usedCount = user.lastPassUsageDate === today ? (user.dailyPassesUsed || 0) : 0;

    if (usedCount >= 1) {
      alert("Ya regalaste tu audio del día. ¡Vuelve mañana para inspirar a alguien más!");
      return;
    }

    const shareUrl = `${window.location.origin}/audio/${audio.id}`;
    const message = `¡Hola! Te comparto este audio exclusivo de INSPIRA: "${audio.title}" de ${audio.author}. ¡Escúchalo completo aquí de regalo! ✨\n\n${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Update count
    const updatedUser: User = {
      ...user,
      dailyPassesUsed: 1,
      lastPassUsageDate: today
    };
    setUser(updatedUser);
    userService.updateUser(user.id, {
      dailyPassesUsed: updatedUser.dailyPassesUsed,
      lastPassUsageDate: updatedUser.lastPassUsageDate
    }).catch(console.error);
  };

  const handleRedeemGift = async (audioId: string) => {
    if (!user) return;
    const today = new Date().toDateString();
    
    // Check if user is already premium
    if (userPlan === 'Premium') {
      const audio = allAudios.find(a => a.id === audioId);
      if (audio) {
        handleSelectAudio(audio);
      }
      return;
    }

    // Logic for Gratis users redeeming a gift pass
    const isNewDay = user.fecha_ultimo_regalo !== today;
    const redeemedCount = isNewDay ? 0 : (user.regalos_hoy || 0);

    if (redeemedCount >= 1) {
      setIsGiftLimitModalOpen(true);
    } else {
      const audio = allAudios.find(a => a.id === audioId);
      if (audio) {
        setActivePassAudioId(audioId);
        handleSelectAudio(audio);
        
        // Update user state for today's redemption
        const updatedUser: User = {
          ...user,
          regalos_hoy: 1,
          fecha_ultimo_regalo: today
        };
        setUser(updatedUser);
        userService.updateUser(user.id, {
          regalos_hoy: 1,
          fecha_ultimo_regalo: today
        }).catch(console.error);
      }
    }
  };

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/audio\/([a-zA-Z0-9_\-]+)$/);
    
    if (match) {
      const audioId = match[1];
      if (!isAuthenticated) {
        localStorage.setItem('pending_audio_id', audioId);
      } else {
        handleRedeemGift(audioId);
      }
      window.history.replaceState({}, document.title, '/');
    }
  }, [isAuthenticated, allAudios.length, user?.id]);

  // Handle pending audio after login
  useEffect(() => {
    if (isAuthenticated && user) {
      const pendingId = localStorage.getItem('pending_audio_id');
      if (pendingId) {
        setTimeout(() => {
          handleRedeemGift(pendingId);
          localStorage.removeItem('pending_audio_id');
        }, 1000);
      }
    }
  }, [isAuthenticated, user?.id, allAudios.length]);

  // Sharing System Logic (Bridge to requested fields)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const passAudioId = params.get('pass');
    
    if (passAudioId && user) {
      handleRedeemGift(passAudioId);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user?.id, userPlan]);

  // Admin Bypass & Auto-Complete Profile
  useEffect(() => {
    if (isAuthenticated && user && user.email) {
      const isDomainAdmin = user.email === SUPER_ADMIN_EMAIL || user.email.endsWith('@inspiraapps.com');
      const shouldBeAdmin = isDomainAdmin || user.isAdmin;
      
      if (shouldBeAdmin && (!user.isAdmin || !user.current_rank)) {
        const updatedUser: User = {
          ...user,
          role: 'Admin',
          isAdmin: true,
          plan: 'Premium',
          current_rank: user.current_rank || 'Directora Nacional',
          gender: user.gender || 'Mujer'
        };
        setUser(updatedUser);
        setUserPlan('Premium');

        // Background update to Firebase
        userService.updateUser(user.id, { 
          role: 'Admin', 
          isAdmin: true, 
          plan: 'Premium',
          current_rank: updatedUser.current_rank,
          gender: updatedUser.gender
        }).catch(console.error);
      }
    }
  }, [isAuthenticated, user?.email, user?.isAdmin, user?.current_rank]);

  // Automated "Beca Premium" for Start Talent (APAGADO POR CORTAFUEGOS)
  /*
  useEffect(() => {
    if (isAuthenticated && user && user.email) {
      const isTalent = allSpeakers.some(s => s.userEmail === user.email);
      if (isTalent && (user.plan !== 'Premium' || !user.isStartTalentVIP)) {
        const updatedUser: User = {
          ...user,
          plan: 'Premium',
          isStartTalentVIP: true
        };
        setUser(updatedUser);
        setUserPlan('Premium');
        userService.updateUser(user.id, { plan: 'Premium', isStartTalentVIP: true }).catch(console.error);
      }
    }
  }, [allSpeakers, user?.email, isAuthenticated]);
  */

  // Daily reset for Premium users (tracking usage)
  useEffect(() => {
    if (user && user.plan === 'Premium') {
      const today = new Date().toDateString();
      if (user.lastPassUsageDate !== today) {
        const updatedUser: User = {
          ...user,
          dailyPassesUsed: 0,
          lastPassUsageDate: today
        };
        setUser(updatedUser);
        userService.updateUser(user.id, {
          dailyPassesUsed: 0,
          lastPassUsageDate: today
        }).catch(console.error);
      }
    }
  }, [user?.plan]);

  // Carga visual inicial (sin restaurar datos de usuario desde localStorage)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  // Notification Retry Logic
  useEffect(() => {
    if (user && user.current_rank && user.notificationStatus === 'postponed' && !isPlaying) {
      const sessionCount = user.sessionCount || 0;
      const lastPrompt = user.lastNotificationPromptDate ? new Date(user.lastNotificationPromptDate).getTime() : 0;
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      if (sessionCount >= 3 || (now - lastPrompt > oneWeek)) {
        // Only show if we haven't asked this specific session yet to avoid loop
        const sessionPromptShown = sessionStorage.getItem('inspira_session_prompt');
        if (!sessionPromptShown) {
          setShowRetryPrompt(true);
          sessionStorage.setItem('inspira_session_prompt', 'true');
        }
      }
    }
  }, [user, isPlaying]);

  const handleRetryPermission = async () => {
    try {
      if (!('Notification' in window)) return;
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const mockToken = 'mock-fcm-token-' + Math.random().toString(36).substring(7);
        setRetryFCMToken(mockToken);
        setIsRetrySuccessVisible(true);
        
        const updatedUser: User = { 
          ...user!, 
          notificationStatus: 'granted', 
          fcmToken: mockToken,
          lastNotificationPromptDate: new Date().toISOString()
        };
        setUser(updatedUser);
        userService.updateUser(updatedUser.id, {
          notificationStatus: 'granted',
          fcmToken: mockToken,
          lastNotificationPromptDate: updatedUser.lastNotificationPromptDate
        }).catch(console.error);

        setTimeout(() => {
          setIsRetrySuccessVisible(false);
          setShowRetryPrompt(false);
        }, 2000);
      } else {
        const updatedUser: User = { 
          ...user!, 
          notificationStatus: 'denied',
          lastNotificationPromptDate: new Date().toISOString()
        };
        setUser(updatedUser);
        userService.updateUser(updatedUser.id, {
          notificationStatus: 'denied',
          lastNotificationPromptDate: updatedUser.lastNotificationPromptDate
        }).catch(console.error);
        setShowRetryPrompt(false);
      }
    } catch (error) {
      console.error(error);
      setShowRetryPrompt(false);
    }
  };

  const handlePostponeRetry = () => {
    if (user) {
      const updatedUser: User = { 
        ...user, 
        notificationStatus: 'postponed',
        sessionCount: 0, // Reset counter for next cycle
        lastNotificationPromptDate: new Date().toISOString()
      };
      setUser(updatedUser);
      userService.updateUser(updatedUser.id, {
        notificationStatus: 'postponed',
        sessionCount: 0,
        lastNotificationPromptDate: updatedUser.lastNotificationPromptDate
      }).catch(console.error);
    }
    setShowRetryPrompt(false);
  };

  const isPremium = userPlan === 'Premium';

  const handleLogin = (_name: string, isNewUser?: boolean) => {
    // El estado final lo resuelve onAuthStateChanged.
    setAuthLoading(true);
    setError(null);
    setShowLoadingError(false);
    if (isNewUser) setNeedsOnboarding(true);
  };

  const handleIdentityComplete = (name: string, email: string) => {
    if (user) {
      let role = user.role;
      let isAdmin = user.isAdmin;
      
      if (email === SUPER_ADMIN_EMAIL || email.endsWith('@inspiraapps.com')) {
        role = 'Admin';
        isAdmin = true;
      }
      
      // El plan se conserva desde Firestore (nuevos usuarios deben iniciar en Gratis).
      const plan = user.plan || 'Gratis';
      const isStartTalentVIP = user.isStartTalentVIP;

      // Admins bypass onboarding by having a default rank and gender
      const current_rank = (isAdmin && !user.current_rank) ? 'Directora Nacional' : user.current_rank;
      const gender = (isAdmin && !user.gender) ? 'Mujer' : user.gender;

      const updatedUser: User = { 
        ...user, 
        name, 
        email, 
        role, 
        isAdmin, 
        isStartTalentVIP,
        plan,
        current_rank,
        gender
      };
      
      setUser(updatedUser);
      setUserPlan(plan);
      userService.updateUser(user.id, { 
        name, 
        email, 
        role, 
        isAdmin, 
        isStartTalentVIP, 
        plan,
        current_rank,
        gender 
      }).catch(console.error);
    }
  };

  const handleOnboardingComplete = async (data: Partial<User>) => {
    if (!user) return;

    const onboardingPayload: Partial<User> = {
      gender: data.gender,
      current_rank: data.current_rank,
      customAddress: data.customAddress,
      country: data.country,
      state: data.state,
      city: data.city,
      birthDate: data.birthDate || data.birthdate,
      birthdate: data.birthDate || data.birthdate,
      phone: data.phone,
      fcmToken: data.fcmToken,
      notificationStatus: data.notificationStatus,
      lastNotificationPromptDate: data.lastNotificationPromptDate,
      onboardingCompleted: true,
    };

    try {
      const persistedInFirestore = await Promise.race([
        userService.updateUser(user.id, onboardingPayload),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout guardando onboarding en Firestore')), 7000)
        )
      ]);

      if (!persistedInFirestore) {
        setError('No se pudo guardar el onboarding en Firestore. Revisa credenciales, reglas y conexión antes de continuar.');
        return;
      }

      const updatedUser = { ...user, ...onboardingPayload };
      setUser(updatedUser);
      setNeedsOnboarding(false);
      setActiveTab('home');
      setError(null);
    } catch (e) {
      console.error('No se pudo confirmar persistencia inmediata en Firestore:', e);
      setError('No se pudo guardar el onboarding en Firestore. Revisa credenciales, reglas y conexión antes de continuar.');
    }
  };

  const handleValidListen = (audioId: string) => {
    if (!completedAudios.includes(audioId)) {
      const newCompleted = [...completedAudios, audioId];
      setCompletedAudios(newCompleted);
    }
  };

  const toggleFavorite = (audioId: string) => {
    const newFavorites = favorites.includes(audioId)
      ? favorites.filter(id => id !== audioId)
      : [...favorites, audioId];
    setFavorites(newFavorites);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (logoutError) {
      console.warn('No se pudo cerrar sesión en Firebase, limpiando estado local.', logoutError);
    } finally {
      // Limpieza SELECTIVA: borramos solo las claves propias de la app.
      // signOut(auth) ya elimina el token de Firebase; no usamos
      // localStorage.clear() para no tocar otras claves de Firebase.
      clearAppLocalStorage();
      // Borramos el estado persistido del reproductor (IndexedDB + fallback).
      clearPlayerState().catch(() => {});
      setCurrentAudio(null);
      setIsPlaying(false);
      setUser(null);
      setIsAuthenticated(false);
      setUserPlan('Gratis');
      setNeedsOnboarding(false);
      setIsSidebarOpen(false);
      setActiveTab('home');
    }
  };

  const handleOnPassUsed = () => {
    if (!user) return;
    if (hasPremiumAccess) {
      const updatedUser: User = {
        ...user,
        dailyPassesUsed: (user.dailyPassesUsed || 0) + 1
      };
      setUser(updatedUser);
      userService.updateUser(user.id, {
        dailyPassesUsed: updatedUser.dailyPassesUsed
      }).catch(console.error);
    } else {
      setActivePassAudioId(null);
    }
  };

  const handleOpenPremium = (type: 'generic' | 'fomo' = 'generic') => {
    if (type === 'fomo') {
      setPremiumModalInfo({
        title: "Contenido Exclusivo Premium",
        description: "¡Únete a la comunidad INSPIRA para desbloquear este y cientos de audios más!",
        buttonText: "Ser Premium"
      });
    } else {
      setPremiumModalInfo({
        title: "Suscripción Premium",
        description: "Únete a la élite de INSPIRA",
        buttonText: "Confirmar en WhatsApp"
      });
    }
    setIsPremiumModalOpen(true);
  };

  // Render Tab Content
  const renderTab = (providedUser: User | null, providedPlan: UserPlan) => {
    switch (activeTab) {
      case 'home':
        return (
            <Home 
              activeEvent={activeEvent}
              audios={allAudios}
              books={dynamicBooks}
              audioInProgress={currentAudio}
              onSelectAudio={handleSelectAudio} 
              userPlan={providedPlan} 
              favorites={favorites}
              completedAudios={completedAudios}
              onToggleFavorite={toggleFavorite}
              user={providedUser}
              onOpenAdmin={() => setIsAdminPanelOpen(true)}
              onOpenPremium={() => handleOpenPremium()}
              onOpenTrophies={() => setIsTrophyRoomOpen(true)}
              onAddToPlaylist={handleAddToPlaylist}
              onSharePass={handleGiveGift}
              isExpiringTomorrow={isExpiringTomorrow}
              onNavigate={handleTabChange}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              onExpand={() => setIsPlayerExpanded(true)}
              onLogoTap={() => {}}
              appConfig={appConfig}
              editorialSlots={editorialSlots}
            />
        );
      case 'library':
        return (
            <Library 
              audios={allAudios}
              user={providedUser ? { ...providedUser, playlists: userPlaylists } : null}
              userPlan={providedPlan}
              onSelectAudio={handleSelectAudio}
              completedAudios={completedAudios}
              onOpenPremium={() => handleOpenPremium('fomo')}
              onDeletePlaylist={handleDeletePlaylist}
              onRemoveFromPlaylist={(plId, id) => handleRemoveFromPlaylist(plId, id, 'audio')} // Default to audio for library categories
              onRenamePlaylist={handleRenamePlaylist}
              onCreatePlaylist={handleCreatePlaylist}
              onAddToPlaylist={handleAddToPlaylist}
              initialSelectedPlaylistId={playlistToOpen}
            />
        );
      case 'books':
        return (
          <Books 
            theme={theme} 
            userPlan={providedPlan}
            onAddToPlaylist={handleAddToPlaylist} 
            onSelectAudio={handleSelectAudio} 
            onOpenPremium={() => handleOpenPremium('fomo')} 
            editorialSlots={editorialSlots}
            books={dynamicBooks}
          />
        );
      case 'book-detail':
        return selectedBook ? (
          <BookDetail 
            book={selectedBook}
            onBack={() => {
              setSelectedBook(null);
              handleTabChange('home');
            }}
            onSelectAudio={handleSelectAudio}
            onAddToPlaylist={handleAddToPlaylist}
            userPlan={providedPlan}
            onOpenPremium={() => handleOpenPremium()}
            theme={theme}
          />
        ) : null;
      case 'calendar':
        return (
          <Calendar 
            userPlan={providedPlan} 
            onOpenPremium={() => handleOpenPremium()} 
            events={events}
          />
        );
      case 'chat':
        return providedPlan === 'Premium' ? (
          <NayaChat user={providedUser} theme={theme} onInputFocusChange={setIsNavHidden} books={dynamicBooks} />
        ) : (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] p-6 text-center h-full w-full">
            <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(249,115,22,0.5)]">
              <span className="text-5xl text-white">🔒</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-4 italic tracking-wider">ACCESO VIP</h2>
            <p className="text-gray-400 mb-8 max-w-sm text-lg leading-relaxed">
              Naya es tu mentora estratégica 24/7. Suscríbete a Premium para desbloquearla y elevar tus resultados.
            </p>
            <button 
              onClick={() => handleOpenPremium()}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-black text-lg py-4 px-10 rounded-full w-full max-w-xs shadow-xl transform transition active:scale-95 uppercase tracking-widest"
            >
              ⭐ DESBLOQUEAR AHORA
            </button>
          </div>
        );
      case 'fame':
        return (
          <HallOfFame 
            speakers={allSpeakers} 
            theme={theme} 
            onAddToPlaylist={handleAddToPlaylist} 
            onSelectAudio={handleSelectAudio} 
            onSelectBook={(book) => {
              setSelectedBook(book);
              handleTabChange('book-detail');
            }}
            allAudios={allAudios}
            allBooks={dynamicBooks}
            appConfig={appConfig} 
          />
        );
      case 'success-path':
        return (
          <SuccessPathView 
            onSelectAudio={handleSelectAudio} 
            onNavigate={handleTabChange} 
            completedAudios={completedAudios} 
            theme={theme}
            paths={successPaths}
            allAudios={allAudios}
            allBooks={dynamicBooks}
            userPlan={providedPlan}
            onOpenPremium={() => handleOpenPremium('fomo')}
          />
        );
      default:
        return (
          <Home 
            activeEvent={activeEvent}
            audios={allAudios}
            books={dynamicBooks}
            onSelectAudio={handleSelectAudio} 
            onSelectBook={(book) => {
              setSelectedBook(book);
              handleTabChange('book-detail');
            }}
            userPlan={providedPlan} 
            favorites={favorites} 
            completedAudios={completedAudios}
            onToggleFavorite={toggleFavorite} 
            user={providedUser} 
            onNavigate={handleTabChange} 
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onLogoTap={() => {}}
            theme={theme}
          />
        );
    }
  };

  const handleAddToPlaylist = (item: Audio | Book) => {
    try {
      setPlaylistItemToAdd(item);
      setIsModalOpen(true);
    } catch (e) {
      console.error("Error setting item to add to playlist:", e);
    }
  };

  const isElegant = theme === 'elegant';

  return (
    <GlobalErrorBoundary>
      <div className={`min-h-screen flex justify-center items-center p-0 sm:p-4 transition-colors duration-500 ${
        isElegant ? 'bg-black' : 'bg-zinc-100'
      }`}>
      {/* Mobile Container Emulator */}
      <div className={`relative w-full max-w-md h-screen sm:h-[844px] sm:rounded-[48px] sm:border-[8px] overflow-hidden flex flex-col transition-all duration-500 ${
        isElegant 
          ? 'bg-black border-zinc-900 shadow-[0_0_100px_rgba(0,0,0,0.8)]' 
          : 'bg-[#F2F2F7] border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)]'
      }`}>
            {/* Notification Retry Prompt */}
            <AnimatePresence>
              {showRetryPrompt && !isRetrySuccessVisible && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-bg-card border border-accent/30 rounded-[40px] p-8 max-w-sm w-full text-center space-y-6 shadow-[0_0_50px_rgba(212,175,55,0.15)]"
                  >
                    <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                      <Bell className="text-accent animate-bounce" size={32} />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">¿Refuerzo de Diamante?</h3>
                       <p className="text-text-dim text-sm leading-relaxed">
                         Líder, no te pierdas tus mentorías diarias. Activa las notificaciones para mantener tu mentalidad en el nivel más alto.
                       </p>
                    </div>
                    <div className="flex flex-col gap-3 pt-2">
                      <button 
                        onClick={handleRetryPermission}
                        className="w-full py-4 bg-accent text-black rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-accent/20 active:scale-95 transition-all"
                      >
                        ¡Activar Ahora!
                      </button>
                      <button 
                        onClick={handlePostponeRetry}
                        className="w-full py-4 bg-white/5 text-text-dim rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 active:scale-95 transition-all"
                      >
                        En otro momento
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {isRetrySuccessVisible && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-[310] bg-black flex items-center justify-center p-6"
                >
                  <div className="text-center space-y-4">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                      className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle2 className="text-black" size={48} strokeWidth={3} />
                    </motion.div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white uppercase italic">¡Excelente decisión!</h3>
                      <p className="text-accent text-sm font-bold max-w-xs mx-auto">
                        Tu mentalidad ahora tiene un guardián de hierro.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


        {isSplashVisible && <SplashScreen />}
        
        {isWeeklyDigestOpen && (
          <WeeklyDigestModal 
            audios={allAudios}
            books={dynamicBooks}
            events={events}
            onClose={handleCloseWeeklyDigest}
          />
        )}
        
        {!isSplashVisible && authLoading && (
          <div className="absolute inset-0 z-[95] bg-black flex flex-col items-center justify-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
            />
            <p className="text-accent text-xs font-black uppercase tracking-[0.3em]">Restaurando sesión...</p>
          </div>
        )}

        {!isSplashVisible && !authLoading && !isAuthenticated && (
          <Login onLogin={handleLogin} />
        )}

        {/* Banner de instalación PWA: se muestra solo cuando el usuario ya
            inició sesión y no está en onboarding/splash. El propio componente
            decide si aparece (beforeinstallprompt disponible, no instalada,
            no pospuesta en los últimos 7 días). */}
        {!isSplashVisible && isAuthenticated && <InstallPWA />}

        {/* MURO DE CARGA DESACTIVADO POR SEGURIDAD */}
        {false && !isSplashVisible && isAuthenticated && !user && (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-6 text-center">
            {error || showLoadingError ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-bg-card border-2 border-red-500/50 p-8 rounded-[32px] max-w-sm space-y-6 shadow-2xl"
              >
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                  <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-black uppercase italic text-xl">
                    {showLoadingError && !error ? 'Sincronización Lenta' : 'Error de Conexión'}
                  </h3>
                  <p className="text-text-dim text-sm">
                    {error || 'La conexión con la Biblioteca INSPIRA está tomando más tiempo de lo normal. ¿Deseas reintentar?'}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-accent text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm"
                  >
                    Reintentar Conexión
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full bg-white/10 text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm"
                  >
                    Salir y Reintentar
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full"
                />
                <div className="space-y-2">
                  <p className="text-accent text-sm font-bold tracking-[0.3em] uppercase animate-pulse italic">
                    Cargando Inteligencia...
                  </p>
                  <p className="text-text-dim text-[10px] uppercase tracking-widest">Sincronizando con la Biblioteca INSPIRA</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation Area Wrapper - Ensures UI is rendered even if profile is loading for Super Admin */}
        {isAuthenticated && (user || (auth.currentUser && auth.currentUser.email === SUPER_ADMIN_EMAIL)) && (
          <>
            {(() => {
              const effectiveUser = (user || { 
                  email: auth.currentUser?.email || SUPER_ADMIN_EMAIL, 
                  isAdmin: true, 
                  role: 'Admin', 
                  name: 'Super Admin', 
                  xp: 0, 
                  completedAudios: [],
                  plan: 'Premium' as UserPlan,
                  playlists: []
                } as User);

              return (
                <div className="flex-1 flex flex-col overflow-hidden relative">
                  {/* Global Admin Dash Bypasser */}
                  {isAdminPanelOpen && (effectiveUser.isAdmin || effectiveUser.email === SUPER_ADMIN_EMAIL) && (
                    <div className="fixed inset-0 z-[9999] bg-black overflow-y-auto font-sans antialiased">
                      <AdminPanel onBack={() => setIsAdminPanelOpen(false)} currentUser={effectiveUser} />
                    </div>
                  )}


                    <Sidebar 
                      isOpen={isSidebarOpen} 
                      onClose={() => setIsSidebarOpen(false)} 
                      user={effectiveUser}
                      theme={theme}
                      onThemeChange={setTheme}
                      onLogout={handleLogout}
                      onOpenAdmin={() => setIsAdminPanelOpen(true)}
                      onOpenLegal={() => setIsLegalViewOpen(true)}
                      appConfig={appConfig}
                      onToggleSimulation={handleToggleAdminSimulation}
                    />

                    <AnimatePresence>
                      {isLegalViewOpen && (
                        <LegalView 
                          isOpen={isLegalViewOpen} 
                          onClose={() => setIsLegalViewOpen(false)} 
                          theme={theme}
                        />
                      )}
                    </AnimatePresence>

                  {/* Trophy Room Modal */}
                  <TrophyRoom 
                    isOpen={isTrophyRoomOpen}
                    onClose={() => setIsTrophyRoomOpen(false)}
                    user={effectiveUser}
                    theme={theme}
                  />

                  {/* Main Content Area */}
                  <main className="flex-1 overflow-y-auto relative scrollbar-hide">
                    {needsOnboarding ? (
                      <OnboardingForm 
                        onComplete={handleOnboardingComplete} 
                        userEmail={effectiveUser.email || ''} 
                      />
                    ) : renderTab(effectiveUser, providedPlan)}
                  </main>

                  {/* Navigation Area */}
                  {!isNavHidden && !isAdminPanelOpen && (
                    <div className="relative z-[1000] mt-auto">
                      {/* Diagnostic Overlay */}
          {/* Diagnostic Overlay Removed for final view */}
          
          <BottomNav 
                        activeTab={activeTab} 
                        setActiveTab={handleTabChange} 
                        onActionClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                        theme={theme}
                      />
                    </div>
                  )}

                  <AnimatePresence>
                    {isActionMenuOpen && (
                      <ActionMenu 
                        onClose={() => setIsActionMenuOpen(false)} 
                        onNavigate={(tab) => {
                          if (tab === 'trophies') {
                            setIsTrophyRoomOpen(true);
                          } else {
                            handleTabChange(tab);
                          }
                        }}
                        theme={theme}
                      />
                    )}
                  </AnimatePresence>

                  {/* Audio Player Modal (Expanded) */}
                  <AnimatePresence>
                    {isPlayerExpanded && currentAudio && (
                      <AudioPlayer
                        audio={currentAudio}
                        onClose={() => setIsPlayerExpanded(false)}
                        userPlan={providedPlan}
                        onValidListen={handleValidListen}
                        isFavorite={currentAudio ? favorites.includes(currentAudio.id) : false}
                        onToggleFavorite={toggleFavorite}
                        activePassAudioId={activePassAudioId}
                        onPassUsed={handleOnPassUsed}
                        userPassesUsed={effectiveUser.dailyPassesUsed || 0}
                        theme={theme}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        currentTime={currentTime}
                        duration={duration}
                        onGiveGift={() => handleGiveGift(currentAudio)}
                        isLoading={isLoading}
                        playbackSpeed={playbackSpeed}
                        onToggleSpeed={handleToggleSpeed}
                        queue={queue}
                        onRemoveFromQueue={handleRemoveFromQueue}
                        onMoveInQueue={handleMoveInQueue}
                        onNext={handleNextAudio}
                        onPrevious={handlePreviousAudio}
                        onSeek={handleSeek}
                        playlists={userPlaylists}
                        onNavigateToPlaylist={handleNavigateToPlaylist}
                        onOpenPremium={() => handleOpenPremium()}
                      />
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {!isPlayerExpanded && currentAudio && activeTab !== 'home' && (
                      <FloatingAudioFAB
                        key="global-audio-fab"
                        isPlaying={isPlaying}
                        onExpand={() => setIsPlayerExpanded(true)}
                        theme={theme}
                      />
                    )}
                    
                    {!isPlayerExpanded && currentAudio && activeTab === 'home' && (
                      <FloatingPlayer
                        key="home-mini-player"
                        currentAudio={currentAudio}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        currentTime={currentTime}
                        duration={duration}
                        onExpand={() => setIsPlayerExpanded(true)}
                        onNext={handleNextAudio}
                        userPlan={providedPlan}
                        theme={theme}
                        queue={queue}
                        isLoading={isLoading}
                      />
                    )}
                  </AnimatePresence>

                  {/* MOTOR GLOBAL DE AUDIO - NUNCA SE DESMONTA MIENTRAS ESTÉ AUTENTICADO */}
                  <audio
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleAudioEnded}
                    onError={handleAudioError}
                    preload="auto"
                  />

                  {passError && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                      <div className="bg-bg-card border-2 border-accent p-8 rounded-[32px] max-w-xs text-center space-y-6 shadow-[0_0_50px_rgba(255,140,0,0.2)]">
                        <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                          <AlertCircle size={40} />
                        </div>
                        <p className="text-white font-bold leading-relaxed text-sm">{passError}</p>
                        <button 
                          onClick={() => setPassError(null)}
                          className="w-full bg-accent text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm"
                        >
                          Entendido
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Degradation Popup */}
                  <AnimatePresence>
                    {showDegradationPopup && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
                      >
                        <div className="bg-bg-card border-2 border-accent p-10 rounded-[48px] max-w-sm text-center space-y-8 shadow-[0_0_100px_rgba(255,140,0,0.3)]">
                          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto text-accent shadow-xl shadow-accent/20">
                            <Sparkles size={48} fill="currentColor" />
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white leading-tight">Tu plan ha cambiado a Gratuito</h3>
                            <p className="text-text-dim text-sm leading-relaxed">
                              Aún puedes disfrutar de nuestros clips diarios, pero has perdido el acceso al legado completo de las Directoras. 
                              ¡Te esperamos de vuelta en el equipo Premium!
                            </p>
                          </div>
                          <button 
                            onClick={() => setShowDegradationPopup(false)}
                            className="w-full bg-accent text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-accent/20"
                          >
                            Continuar
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Playlist Selection Modal */}
                  {isModalOpen && (
                    <PlaylistModal
                      item={playlistItemToAdd}
                      userPlan={providedPlan}
                      onClose={() => {
                        setIsModalOpen(false);
                        setPlaylistItemToAdd(null);
                      }}
                      onOpenPremium={() => handleOpenPremium()}
                      onNavigateToPlaylist={handleNavigateToPlaylist}
                    />
                  )}

                  {/* Premium Subscription Modal */}
                  <AnimatePresence>
                    {isPremiumModalOpen && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] bg-black overflow-hidden"
                      >
                        <div className="absolute top-8 right-8 z-[10001]">
                          <button 
                            onClick={() => setIsPremiumModalOpen(false)}
                            className="bg-accent text-black p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                          >
                            <X size={24} />
                          </button>
                        </div>
                        <LockedView 
                          title={premiumModalInfo.title}
                          description={premiumModalInfo.description}
                          buttonText={premiumModalInfo.buttonText}
                          appConfig={appConfig}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Gift Limit Reached Modal */}
                  <AnimatePresence>
                    {isGiftLimitModalOpen && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
                      >
                        <div className="bg-bg-card border-2 border-[#D4AF37] p-10 rounded-[48px] max-w-sm text-center space-y-8 shadow-[0_0_100px_rgba(212,175,55,0.3)]">
                          <div className="w-24 h-24 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto text-[#D4AF37] shadow-xl shadow-[#D4AF37]/20">
                            <AlertCircle size={48} />
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-2xl font-black text-white leading-tight uppercase italic font-serif">Límite Alcanzado</h3>
                            <p className="text-text-dim text-sm leading-relaxed">
                              Ya has disfrutado de tu audio de regalo por hoy. Únete a Premium para escuchar sin límites y acceder al legado completo de las Directoras.
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              setIsGiftLimitModalOpen(false);
                              handleOpenPremium('fomo');
                            }}
                            className="w-full bg-[#D4AF37] text-black py-5 rounded-2xl font-black uppercase tracking-[0.1em] shadow-lg shadow-[#D4AF37]/20 active:scale-95 transition-all"
                          >
                            Hacerme Premium 👑
                          </button>
                          <button 
                            onClick={() => setIsGiftLimitModalOpen(false)}
                            className="text-text-dim text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                          >
                            Quizás más tarde
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Medal Unlock Toast */}
                  <AnimatePresence>
                    {unlockedMedal && (
                      <motion.div 
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.8 }}
                        className="fixed top-12 left-1/2 -translate-x-1/2 z-[10000] px-6 py-4 bg-accent text-black font-black uppercase tracking-tighter rounded-[32px] shadow-[0_20px_50px_rgba(212,175,55,0.4)] flex items-center gap-4 border-4 border-black"
                      >
                        <div className="text-4xl">{unlockedMedal.icono}</div>
                        <div className="flex flex-col">
                          <span className="text-[10px] opacity-70">¡NUEVA MEDALLA!</span>
                          <span className="text-xl italic">{unlockedMedal.titulo}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* God Mode SnackBar */}
                  <AnimatePresence>
                    {godModeMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[500] px-6 py-4 bg-accent text-black font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-[0_10px_40px_rgba(212,175,55,0.4)] flex items-center gap-3 backdrop-blur-md"
                      >
                        <Sparkles size={16} fill="black" />
                        {godModeMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
    </GlobalErrorBoundary>
  );
}
