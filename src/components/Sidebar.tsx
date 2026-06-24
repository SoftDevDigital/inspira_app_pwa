import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserPlan, AppConfig } from '../types';
import { X, LogOut, Sun, Moon, User as UserIcon, Settings, Headphones, MessageSquare as MessageSquareIcon, ChevronDown, ChevronUp, Bell, Sparkles, Share2, DownloadCloud, Check } from 'lucide-react';
import { BRANDING } from '../constants';
import { useInstallPWA } from './InstallPWA';
import IOSInstallModal from './IOSInstallModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  theme: 'elegant' | 'clarity';
  onThemeChange: (theme: 'elegant' | 'clarity') => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  onOpenLegal?: () => void;
  appConfig?: AppConfig | null;
  onToggleSimulation?: () => void;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  user, 
  theme, 
  onThemeChange, 
  onLogout, 
  onOpenAdmin, 
  onOpenLegal,
  appConfig,
  onToggleSimulation 
}: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);
  // Lógica de instalación PWA (compartida con el banner InstallPWA).
  const { canInstall, isInstalled, install } = useInstallPWA();
  const isSuperAdmin = user?.email === 'operaciones@inspiraapps.com';
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
  
  const identityLabel = user?.customAddress || (user?.gender === 'Mujer' ? 'Directora' : (user?.gender === 'Hombre' ? 'Director' : 'Líder'));

  const menuButtonStyle = `w-full flex flex-row items-center justify-between px-5 py-3 rounded-full border active:scale-95 transition-all text-left overflow-hidden ${
    theme === 'elegant' 
      ? 'bg-zinc-900 border-white/5 text-white' 
      : 'bg-[#F2F2F7] border-zinc-200 text-zinc-900 shadow-sm'
  }`;
  const iconTextStyle = "flex flex-row items-center gap-3 w-full overflow-hidden";
  const labelStyle = "font-bold uppercase tracking-[0.02em] text-[12px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis";

  const handleShareApp = async () => {
    const shareData = {
      title: 'INSPIRA - Plataforma de Liderazgo',
      text: '¡Descubre INSPIRA! La plataforma que está transformando nuestro negocio. Únete aquí:',
      url: window.location.origin
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error al compartir', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('¡Enlace copiado al portapapeles!');
      } catch (err) {
        console.error('Error al copiar enlace:', err);
      }
    }
  };

  // Instala la PWA con confirmación previa y feedback al finalizar o indicar incompatibilidad.
  const handleInstallApp = async () => {
    if (isInstalled) {
      window.alert(
        '¡Ya tienes INSPIRA instalada en tu dispositivo! 🎉\n\n' +
        'Puedes abrirla directamente desde tu pantalla de inicio.'
      );
      onClose();
      return;
    }

    // Detección de iOS para guiar manualmente
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent) || 
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

    if (isIos) {
      setIsIOSModalOpen(true);
      onClose(); // Cierra el sidebar para despejar la vista y dejar libre la barra de navegación de Safari
      return;
    }

    const confirmed = window.confirm(
      '¿Deseas descargar e instalar Inspira en tu dispositivo?\n\n' +
      'Tendrás acceso rápido desde tu pantalla de inicio y podrás usar la app sin conexión.'
    );
    if (!confirmed) return;

    const outcome = await install();
    if (outcome === 'accepted') {
      window.alert('¡App instalada exitosamente! 🎉\n\nBúscala en tu pantalla de inicio.');
    } else if (outcome === null) {
      console.warn('[PWA] La instalación automática no está disponible en este navegador/dispositivo.');
      window.alert(
        'La instalación automática no es compatible con tu navegador o dispositivo actual.\n\n' +
        'Para descargarla, por favor usa la opción "Agregar a la pantalla principal" o "Instalar" desde el menú de tu navegador.'
      );
    }
    onClose();
  };

  const handleWhatsApp = (type: 'support' | 'suggestion') => {
    const number = appConfig?.whatsappSoporte || "+521234567890";
    let url = `https://wa.me/${number.replace(/\+/g, '')}`;
    if (type === 'suggestion') {
      const msg = encodeURIComponent("Hola, me gustaría enviar una sugerencia sobre la app Inspira...");
      url += `?text=${msg}`;
    }
    window.open(url, '_blank');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed inset-y-0 left-0 w-[75vw] h-screen z-[210] shadow-2xl flex flex-col border-r overflow-y-auto overflow-x-hidden scrollbar-hide select-none touch-pan-y transition-colors duration-300 ${
              theme === 'elegant' ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200'
            }`}
          >
            {/* Header / Profile Section */}
            <div className="pt-12 pb-6 flex flex-col items-center relative shrink-0">
              <button 
                onClick={onClose}
                className={`absolute top-6 right-6 p-1 transition-colors ${
                  theme === 'elegant' ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'
                }`}
                id="close-sidebar-btn"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <img 
                  src={BRANDING.logoUrl}
                  alt={BRANDING.appName}
                  className="h-10 w-auto object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>

              <div className="w-20 h-20 rounded-full border-[2px] border-[#D4AF37] p-1 mb-4 shadow-[0_0_20px_rgba(212,175,55,0.2)]" id="avatar-container">
                <div className={`w-full h-full rounded-full flex items-center justify-center text-3xl font-normal border transition-colors ${
                  theme === 'elegant' ? 'bg-zinc-900 border-white/10 text-white' : 'bg-[#F2F2F7] border-zinc-200 text-zinc-900'
                }`}>
                  {userInitial}
                </div>
              </div>

              <div className="text-center space-y-1 w-full px-4 overflow-hidden">
                <h2 className={`text-[16px] font-bold uppercase tracking-tight truncate whitespace-nowrap transition-colors ${
                  theme === 'elegant' ? 'text-white' : 'text-zinc-900'
                }`} id="user-name-display">
                  {user?.name || 'ELENA GÓMEZ'}
                </h2>
                <p className={`text-zinc-500 text-[10px] font-black uppercase tracking-[0.1em] ${theme === 'elegant' ? 'text-white/40' : 'text-zinc-400'}`}>
                   {identityLabel} VIP INSPIRA
                </p>
                
                <div className="mt-3 flex justify-center">
                  <div className={`px-5 py-0.5 border rounded-full transition-colors ${
                    theme === 'elegant' ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5' : 'border-[#D4AF37]/30 bg-white shadow-sm'
                  }`} id="plan-badge">
                    <span className="text-[#D4AF37] text-[9px] font-black uppercase tracking-[0.2em] leading-none">
                      {user?.plan || 'GRATIS'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 px-5 py-4 space-y-2 flex flex-col">
              <button onClick={() => handleWhatsApp('support')} className={menuButtonStyle} id="service-client-btn">
                <div className={iconTextStyle}>
                  <Headphones size={18} className={theme === 'elegant' ? 'text-white' : 'text-zinc-900'} />
                  <span className={labelStyle}>Servicio al cliente</span>
                </div>
              </button>

              <button onClick={() => handleWhatsApp('suggestion')} className={menuButtonStyle} id="feedback-btn">
                <div className={iconTextStyle}>
                  <MessageSquareIcon size={18} className={theme === 'elegant' ? 'text-white' : 'text-zinc-900'} />
                  <span className={labelStyle}>Buzón de sugerencias</span>
                </div>
              </button>

              <button onClick={handleShareApp} className={`${menuButtonStyle} border-[#D4AF37]/30 bg-[#D4AF37]/5`} id="share-app-btn">
                <div className={iconTextStyle}>
                  <Share2 size={18} className="text-[#D4AF37]" />
                  <span className={`${labelStyle} text-[#D4AF37]`}>Compartir INSPIRA 🚀</span>
                </div>
              </button>

              {/* Botón Descargar App (PWA) — visible siempre.
                  Funciona en escritorio y móvil. Si no hay prompt nativo o ya está instalada, 
                  provee instrucciones o confirmación en handleInstallApp. */}
              <button
                onClick={handleInstallApp}
                className={`${menuButtonStyle} ${
                  isInstalled 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : 'border-accent/50 bg-accent/10 shadow-[0_0_20px_rgba(255,140,0,0.2)]'
                }`}
                id="install-pwa-btn"
              >
                <div className={iconTextStyle}>
                  {isInstalled ? (
                    <>
                      <Check size={18} className="text-green-500" />
                      <span className={`${labelStyle} text-green-500`}>App Instalada</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud size={18} className="text-accent" />
                      <span className={`${labelStyle} text-accent`}>Descargar App</span>
                    </>
                  )}
                </div>
                {!isInstalled && <Sparkles size={14} className="text-accent shrink-0" />}
              </button>

              {/* Accordion Settings */}
              <div className="space-y-2">
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={menuButtonStyle}
                  id="settings-accordion-btn"
                >
                  <div className={iconTextStyle}>
                    <Settings size={18} className={theme === 'elegant' ? 'text-white' : 'text-zinc-900'} />
                    <span className={labelStyle}>Configuración</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isSettingsOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown size={16} className={theme === 'elegant' ? "text-zinc-500" : "text-zinc-900"} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isSettingsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden space-y-2 pb-5"
                    >
                      {isSuperAdmin && (
                        <div className="px-1 mb-4 space-y-2">
                          <button 
                            onClick={() => {
                              onOpenAdmin?.();
                              onClose();
                            }}
                            className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 border-2 border-orange-300 rounded-[20px] text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                          >
                            <span className="text-xl">👑</span>
                            <span className="text-xs font-black uppercase tracking-[0.1em]">Panel Admin</span>
                          </button>

                          <button 
                            onClick={onToggleSimulation}
                            className={`w-full py-3 rounded-[15px] border-2 transition-all active:scale-95 flex items-center justify-center gap-2 ${
                              user?.plan === 'Premium' 
                                ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' 
                                : 'bg-zinc-800/50 border-white/5 text-zinc-400'
                            }`}
                          >
                            <Sparkles size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              { user?.plan === 'Premium' ? '✨ VER COMO: GRATIS' : '👑 VER COMO: PREMIUM' }
                            </span>
                          </button>
                        </div>
                      )}
                      <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest italic transition-colors ${
                        theme === 'elegant' ? 'bg-zinc-900/30 border-white/5 text-zinc-500' : 'bg-[#F2F2F7] border-zinc-100 text-zinc-400 shadow-sm'
                      }`}>
                        <Sun size={12} />
                        <span>Apariencia y Tema</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 px-1">
                        <button 
                          onClick={() => onThemeChange('elegant')}
                          className={`py-2 rounded-full text-[10px] uppercase font-bold tracking-widest border transition-all ${
                            theme === 'elegant' 
                              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' 
                              : 'border-zinc-200 text-zinc-400 bg-zinc-100'
                          }`}
                        >
                          Elegante
                        </button>
                        <button 
                          onClick={() => onThemeChange('clarity')}
                          className={`py-2 rounded-full text-[10px] uppercase font-bold tracking-widest border transition-all ${
                            theme === 'clarity' 
                              ? 'border-blue-600 text-blue-600 bg-blue-50' 
                              : 'border-zinc-200 text-zinc-400 bg-zinc-100'
                          }`}
                        >
                          Claridad
                        </button>
                      </div>
                      <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest italic transition-colors ${
                        theme === 'elegant' ? 'bg-zinc-900/30 border-white/5 text-zinc-500' : 'bg-[#F2F2F7] border-zinc-100 text-zinc-400 shadow-sm'
                      }`}>
                        <Bell size={12} />
                        <span>Notificaciones</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer / Logout */}
            <div className={`px-5 py-6 pb-12 space-y-4 shrink-0 border-t transition-colors ${
              theme === 'elegant' ? 'border-white/5 bg-zinc-950/50' : 'border-zinc-200 bg-white/80'
            }`}>
              <button
                onClick={() => {
                  onOpenLegal?.();
                  onClose();
                }}
                className={`w-full flex items-center justify-center gap-4 px-6 py-2.5 rounded-full border active:scale-95 transition-all text-left mb-2 ${
                  theme === 'elegant' ? 'bg-white/5 text-white/60 border-white/10' : 'bg-zinc-100 text-zinc-600 border-zinc-200 shadow-sm'
                }`}
              >
                <span className="font-bold uppercase tracking-[0.2em] text-[9px] whitespace-nowrap">⚖️ Legal y Privacidad</span>
              </button>

              <button
                onClick={onLogout}
                className={`w-full flex items-center justify-center gap-4 px-6 py-3 rounded-full border active:scale-95 transition-all text-left ${
                  theme === 'elegant' ? 'bg-red-500/5 text-red-500/80 border-red-500/10' : 'bg-red-50/50 text-red-600 border-red-100 shadow-sm'
                }`}
                id="logout-btn"
              >
                <LogOut size={16} />
                <span className="font-bold uppercase tracking-[0.2em] text-[10px] whitespace-nowrap">Cerrar Sesión</span>
              </button>
              
              <p className={`text-center text-[10px] font-black uppercase tracking-[0.3em] italic transition-colors ${
                theme === 'elegant' ? 'text-zinc-700' : 'text-zinc-400'
              }`}>
                INSPIRA V2.0 • ELITE
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    <IOSInstallModal isOpen={isIOSModalOpen} onClose={() => setIsIOSModalOpen(false)} />
    </>
  );
}
