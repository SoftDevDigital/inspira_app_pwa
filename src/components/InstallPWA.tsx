import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, X, Sparkles } from 'lucide-react';
import IOSInstallModal from './IOSInstallModal';

/**
 * Evento beforeinstallprompt (no está tipado en lib.dom estándar).
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

// Caché a nivel de módulo del evento beforeinstallprompt.
// El navegador dispara este evento UNA sola vez; lo guardamos aquí para que
// cualquier instancia del hook (banner o botón del menú lateral) pueda usarlo,
// sin importar cuál se montó primero.
let cachedPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(e: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    cachedPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((cb) => cb(cachedPrompt));
  });
  window.addEventListener('appinstalled', () => {
    cachedPrompt = null;
    promptListeners.forEach((cb) => cb(null));
  });
}

// Clave en localStorage donde guardamos cuándo el usuario pospuso el banner.
const DISMISS_KEY = 'inspira_pwa_install_dismissed_at';
// Días que esperamos antes de volver a mostrar el banner tras un "Ahora no".
const DISMISS_DAYS = 7;
// Retraso (ms) antes de mostrar el banner para no ser intrusivos al entrar.
const SHOW_DELAY_MS = 4000;

/**
 * Determina si la app ya está corriendo en modo instalado (standalone).
 */
const isAppInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches;
  // iOS Safari expone navigator.standalone
  const iosStandalone = (window.navigator as any).standalone === true;
  return Boolean(standalone || iosStandalone);
};

/**
 * Determina si el dispositivo es iOS (iPhone, iPad, iPod).
 */
const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
  const isMacWithTouch = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return isIosDevice || isMacWithTouch;
};

/**
 * Indica si el usuario pospuso el banner hace menos de DISMISS_DAYS días.
 */
const wasRecentlyDismissed = (): boolean => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (Number.isNaN(dismissedAt)) return false;
    const elapsedDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return elapsedDays < DISMISS_DAYS;
  } catch {
    return false;
  }
};

/**
 * Hook que encapsula toda la lógica de instalación PWA:
 * - Escucha el evento beforeinstallprompt.
 * - Detecta si ya está instalada.
 * - Controla la visibilidad del banner (retardo + regla de 7 días).
 * - Expone funciones para instalar y posponer.
 */
export const useInstallPWA = () => {
  // Inicializamos con el prompt cacheado por si el evento ya se disparó
  // antes de montar este hook.
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(cachedPrompt);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(isAppInstalled());

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout>;
    const iosMode = isIOS();

    // Nos suscribimos a los cambios del prompt cacheado a nivel de módulo.
    const onPromptChange = (e: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(e);
      if (e) {
        // El banner solo se auto-muestra si no está instalada ni fue pospuesta.
        if (!isAppInstalled() && !wasRecentlyDismissed()) {
          showTimer = setTimeout(() => setIsVisible(true), SHOW_DELAY_MS);
        }
      } else {
        // En Android, si no hay prompt disponible ocultamos el banner. En iOS seguimos mostrando.
        if (!iosMode) {
          setIsVisible(false);
        }
      }
    };

    // Cuando la app se instala efectivamente, lo marcamos.
    const onAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    promptListeners.add(onPromptChange);
    window.addEventListener('appinstalled', onAppInstalled);

    // Si es iOS, iniciamos el timer directamente ya que no hay beforeinstallprompt
    if (iosMode && !isAppInstalled() && !wasRecentlyDismissed()) {
      showTimer = setTimeout(() => setIsVisible(true), SHOW_DELAY_MS);
    }

    // Si ya teníamos un prompt cacheado al montar, evaluamos mostrar el banner.
    if (cachedPrompt && !isAppInstalled() && !wasRecentlyDismissed()) {
      showTimer = setTimeout(() => setIsVisible(true), SHOW_DELAY_MS);
    }

    return () => {
      promptListeners.delete(onPromptChange);
      window.removeEventListener('appinstalled', onAppInstalled);
      clearTimeout(showTimer);
    };
  }, []);

  /**
   * Lanza el prompt nativo de instalación.
   * Devuelve el resultado: 'accepted', 'dismissed' o null (no disponible/error).
   */
  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferredPrompt) return null;
    let result: 'accepted' | 'dismissed' | null = null;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      result = choice.outcome;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      } else {
        // Si el usuario rechaza el prompt nativo, también respetamos los 7 días.
        try {
          localStorage.setItem(DISMISS_KEY, String(Date.now()));
        } catch {
          /* noop */
        }
      }
    } catch (err) {
      console.warn('[PWA] No se pudo completar la instalación:', err);
    } finally {
      // El prompt es de un solo uso: lo limpiamos localmente y en la caché global.
      cachedPrompt = null;
      promptListeners.forEach((cb) => cb(null));
      setDeferredPrompt(null);
      setIsVisible(false);
    }
    return result;
  }, [deferredPrompt]);

  /** Cierra el banner y guarda la marca de tiempo para no mostrarlo por 7 días. */
  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setIsVisible(false);
  }, []);

  return {
    canInstall: (Boolean(deferredPrompt) || isIOS()) && !isInstalled,
    isVisible: isVisible && (Boolean(deferredPrompt) || isIOS()) && !isInstalled,
    isInstalled,
    install,
    dismiss,
  };
};

/**
 * Banner de instalación PWA con el estilo de Inspira (negro + acento naranja).
 * Aparece en la parte inferior de la pantalla con animación suave.
 */
const InstallPWA: React.FC = () => {
  const { isVisible, install, dismiss } = useInstallPWA();
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);

  const handleInstallClick = async () => {
    if (isIOS()) {
      setIsIOSModalOpen(true);
      dismiss();
      return;
    }
    await install();
  };

  return (
    <>
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 120 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 120 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed inset-x-0 bottom-0 z-[10000] flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] sm:px-4 sm:pb-6 pointer-events-none"
          role="dialog"
          aria-label="Instalar la aplicación Inspira"
        >
          <div className="pointer-events-auto w-full max-w-md sm:max-w-lg">
            <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-[#0d0d0d]/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(255,140,0,0.45)]">
              {/* Glow decorativo */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />

              {/* Botón cerrar */}
              <button
                onClick={dismiss}
                aria-label="Cerrar"
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>

              <div className="relative flex items-start gap-4 p-5 sm:p-6">
                {/* Ícono de la app */}
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-2xl bg-accent/30 blur-md" />
                  <img
                    src="/icons/icon-192x192.png"
                    alt="Inspira"
                    className="relative h-14 w-14 rounded-2xl border border-accent/40 object-cover sm:h-16 sm:w-16"
                    onError={(e) => {
                      // Fallback al logo si el ícono PWA no carga.
                      (e.currentTarget as HTMLImageElement).src = '/logo_app.png';
                    }}
                  />
                  <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-black shadow-lg">
                    <Sparkles size={12} />
                  </span>
                </div>

                {/* Texto */}
                <div className="min-w-0 flex-1 pr-6">
                  <h3 className="text-[15px] font-black uppercase italic leading-tight tracking-wide text-white sm:text-base">
                    ¡Instala Inspira en tu dispositivo!
                  </h3>
                  <p className="mt-1 text-[12px] leading-snug text-white/60 sm:text-[13px]">
                    Accede más rápido y escucha audios en segundo plano.
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
                <button
                  onClick={handleInstallClick}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-[13px] font-black uppercase tracking-widest text-black transition hover:brightness-110 active:scale-[0.98]"
                >
                  <Download size={16} />
                  Instalar ahora
                </button>
                <button
                  onClick={dismiss}
                  className="rounded-xl bg-white/5 px-5 py-3.5 text-[13px] font-bold uppercase tracking-widest text-white/70 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    <IOSInstallModal isOpen={isIOSModalOpen} onClose={() => setIsIOSModalOpen(false)} />
    </>
  );
};

export default InstallPWA;
