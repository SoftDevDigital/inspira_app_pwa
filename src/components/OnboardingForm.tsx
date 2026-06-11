/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRank } from '../types';
import { COUNTRIES } from '../constants/locations';
import { ChevronDown, Bell, CheckCircle2 } from 'lucide-react';

interface OnboardingFormProps {
  onComplete: (data: Partial<User>) => void;
  userEmail: string;
}

export default function OnboardingForm({ onComplete, userEmail }: OnboardingFormProps) {
  const [formData, setFormData] = useState({
    current_rank: 'Consultora' as UserRank,
    gender: 'Mujer' as 'Mujer' | 'Hombre' | 'Otros',
    customAddress: '',
    country: '',
    state: '',
    city: '',
    birthDate: '1995-01-01',
    phone: '',
  });

  const [customCity, setCustomCity] = useState('');
  const [isOtherCitySelected, setIsOtherCitySelected] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | undefined>(undefined);
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'postponed' | undefined>(undefined);

  const selectedCountry = useMemo(() => 
    COUNTRIES.find(c => c.name === formData.country), 
  [formData.country]);

  const states = useMemo(() => 
    selectedCountry?.states || [], 
  [selectedCountry]);

  const selectedState = useMemo(() => 
    states.find(s => s.name === formData.state), 
  [states, formData.state]);

  const cities = useMemo(() => 
    selectedState?.cities || [], 
  [selectedState]);

  const isOtherCountry = formData.country === 'Otro' || (selectedCountry && states.length === 0);

  const femaleRanks: UserRank[] = [
    'Consultora',
    'Futura Directora',
    'Directora en Calificación (DIQ)',
    'Directora de Ventas Independiente',
    'Directora Senior',
    'Directora Ejecutiva',
    'Directora de Elite',
    'Directora Nacional',
    'Star Talent'
  ];

  const maleRanks: UserRank[] = [
    'Consultor',
    'Futuro Director',
    'Director en Calificación (DIQ)',
    'Director de Ventas Independiente',
    'Director Senior',
    'Director Ejecutivo',
    'Director de Elite',
    'Director Nacional',
    'Star Talent'
  ];

  const currentRanks = formData.gender === 'Hombre' ? maleRanks : femaleRanks;

  // React to gender changes to update or reset rank
  useEffect(() => {
    const isMale = formData.gender === 'Hombre';
    const rankIndex = (isMale ? femaleRanks : maleRanks).indexOf(formData.current_rank);
    
    if (rankIndex !== -1) {
      // Map to equivalent rank if possible
      const newRank = (isMale ? maleRanks : femaleRanks)[rankIndex];
      setFormData(prev => ({ ...prev, current_rank: newRank }));
    } else if (!currentRanks.includes(formData.current_rank)) {
      // Reset if not in list
      setFormData(prev => ({ ...prev, current_rank: currentRanks[0] }));
    }
  }, [formData.gender]);

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Omitimos por ahora la pantalla de notificaciones
  handleFinalize(undefined, 'postponed');
};

  const handleFinalize = (token?: string, status: 'granted' | 'denied' | 'postponed' = 'postponed') => {
    const finalData: Partial<User> = {
      ...formData,
      birthdate: formData.birthDate,
      customAddress: formData.customAddress || (formData.gender === 'Mujer' ? 'Directora' : (formData.gender === 'Hombre' ? 'Director' : 'Líder')),
      city: isOtherCitySelected ? customCity : formData.city,
      fcmToken: token,
      notificationStatus: status,
      lastNotificationPromptDate: new Date().toISOString()
    };
    onComplete(finalData);
  };

  const requestNotificationPermission = async () => {
    try {
      if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones de escritorio');
        handleFinalize(undefined, 'denied');
        return;
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const mockToken = 'mock-fcm-token-' + Math.random().toString(36).substring(7);
        setFcmToken(mockToken);
        setNotificationStatus('granted');
        setIsSuccessVisible(true);
        setTimeout(() => {
          handleFinalize(mockToken, 'granted');
        }, 2000);
      } else {
        setNotificationStatus('denied');
        handleFinalize(undefined, 'denied');
      }
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      handleFinalize(undefined, 'denied');
    }
  };

  const handlePostponeNotifications = () => {
    setNotificationStatus('postponed');
    handleFinalize(undefined, 'postponed');
  };

  const handleCountryChange = (name: string) => {
    setFormData({
      ...formData,
      country: name,
      state: '',
      city: ''
    });
    setCustomCity('');
    setIsOtherCitySelected(false);
  };

  const handleStateChange = (name: string) => {
    setFormData({
      ...formData,
      state: name,
      city: ''
    });
    setCustomCity('');
    setIsOtherCitySelected(false);
  };

  const handleCityChange = (val: string) => {
    if (val === 'custom_other') {
      setIsOtherCitySelected(true);
      setFormData({ ...formData, city: 'Otro' });
    } else {
      setIsOtherCitySelected(false);
      setFormData({ ...formData, city: val });
    }
  };

  return (
    <div className="absolute inset-0 bg-bg-deep z-[95] flex flex-col p-8 overflow-y-auto scrollbar-hide">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto w-full pt-12 pb-24"
      >
        <header className="text-center space-y-4 mb-10">
          <div className="inline-block px-4 py-1 bg-accent/20 border border-accent/40 rounded-full text-accent text-[10px] font-black uppercase tracking-widest">
            Único Paso
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Perfil de Rockstar</h1>
          <p className="text-text-dim">Queremos conocerte mejor para personalizar tu mentoría.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-dim px-2">Género</label>
              <div className="relative">
                <select
  required
  value={formData.gender}
  onChange={(e) =>
    setFormData({
      ...formData,
      gender: e.target.value as 'Mujer' | 'Hombre' | 'Otros',
    })
  }
  className="w-full bg-[#121212] border border-accent/20 rounded-2xl p-5 text-white outline-none focus:border-accent appearance-none transition-all cursor-pointer"
>
  <option value="Mujer" className="bg-[#121212] text-white">Mujer</option>
  <option value="Hombre" className="bg-[#121212] text-white">Hombre</option>
  <option value="Otros" className="bg-[#121212] text-white">Otros</option>
</select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-accent pointer-events-none" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-dim px-2">¿Cómo te llamamos?</label>
              <input
                type="text"
                value={formData.customAddress}
                onChange={(e) => setFormData({...formData, customAddress: e.target.value})}
                placeholder="Ej: Líder, Directora..."
                className="w-full bg-bg-card border border-accent/20 rounded-2xl p-5 text-text-main outline-none focus:border-accent transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-dim px-2">Rango Actual</label>
            <div className="relative">
              <select
                required
                value={formData.current_rank}
                onChange={(e) => setFormData({...formData, current_rank: e.target.value as UserRank})}
                className="w-full bg-[#121212] border border-accent/20 rounded-2xl p-5 text-white outline-none focus:border-accent appearance-none transition-all cursor-pointer"
              >
                {currentRanks.map(r => <option key={r} value={r} className="bg-[#121212] text-white">{r}</option>)}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-accent pointer-events-none" size={20} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-dim px-2">País</label>
            <div className="relative">
              <select
                required
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-[#121212] border border-accent/20 rounded-2xl p-5 text-white outline-none focus:border-accent appearance-none transition-all cursor-pointer"
              >
                <option value="" disabled className="bg-[#121212] text-white/50">Selecciona tu país...</option>
                {COUNTRIES.map(c => <option key={c.name} value={c.name} className="bg-[#121212] text-white">{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-accent pointer-events-none" size={20} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-dim px-2 text-balance leading-tight">Estado / Provincia</label>
              <div className="relative">
                {!isOtherCountry ? (
                  <>
                    <select
                      required
                      disabled={!formData.country}
                      value={formData.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full bg-[#121212] border border-accent/20 rounded-2xl p-5 text-white outline-none focus:border-accent appearance-none transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled className="bg-[#121212] text-white/50">Selecciona...</option>
                      {states.map(s => <option key={s.name} value={s.name} className="bg-[#121212] text-white">{s.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-accent pointer-events-none" size={20} />
                  </>
                ) : (
                  <input
                    required
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    placeholder="Tu estado"
                    className="w-full bg-bg-card border border-accent/20 rounded-2xl p-5 text-text-main outline-none focus:border-accent transition-all"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-dim px-2">Ciudad</label>
              <div className="relative">
                {!isOtherCountry ? (
                  <>
                    <select
                      required
                      disabled={!formData.state}
                      value={isOtherCitySelected ? 'custom_other' : formData.city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full bg-[#121212] border border-accent/20 rounded-2xl p-5 text-white outline-none focus:border-accent appearance-none transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled className="bg-[#121212] text-white/50">Selecciona...</option>
                      {cities.map(c => <option key={c} value={c} className="bg-[#121212] text-white">{c}</option>)}
                      <option value="custom_other" className="bg-[#121212] text-white">Otro / No aparece en la lista</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-accent pointer-events-none" size={20} />
                  </>
                ) : (
                  <input
                    required
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Tu ciudad"
                    className="w-full bg-bg-card border border-accent/20 rounded-2xl p-5 text-text-main outline-none focus:border-accent transition-all"
                  />
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isOtherCitySelected && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-xs font-black uppercase tracking-widest text-accent px-2">Especifica tu Ciudad/Municipio</label>
                <input
                  required
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="Escribe el nombre aquí..."
                  className="w-full bg-bg-card border border-accent rounded-2xl p-5 text-text-main outline-none shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-text-dim px-2">Fecha de Nacimiento</label>
            <div className="grid grid-cols-3 gap-3">
              {/* Day */}
              <div className="relative">
                <select
                  required
                  value={formData.birthDate.split('-')[2] || '01'}
                  onChange={(e) => {
                    const parts = formData.birthDate.split('-');
                    const year = parts[0] || '1995';
                    const month = parts[1] || '01';
                    setFormData({...formData, birthDate: `${year}-${month}-${e.target.value}`});
                  }}
                  className="w-full bg-[#121212] border border-accent/20 rounded-2xl p-4 text-white outline-none focus:border-accent appearance-none transition-all cursor-pointer text-sm"
                >
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = (i + 1).toString().padStart(2, '0');
                    return <option key={day} value={day} className="bg-[#121212] text-white">{day}</option>;
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-accent pointer-events-none opacity-50" size={14} />
              </div>

              {/* Month */}
              <div className="relative">
                <select
                  required
                  value={formData.birthDate.split('-')[1] || '01'}
                  onChange={(e) => {
                    const parts = formData.birthDate.split('-');
                    const year = parts[0] || '1995';
                    const day = parts[2] || '01';
                    setFormData({...formData, birthDate: `${year}-${e.target.value}-${day}`});
                  }}
                  className="w-full bg-[#121212] border border-accent/20 rounded-2xl p-4 text-white outline-none focus:border-accent appearance-none transition-all cursor-pointer text-sm"
                >
                  {[
                    { v: '01', l: 'Ene' }, { v: '02', l: 'Feb' }, { v: '03', l: 'Mar' },
                    { v: '04', l: 'Abr' }, { v: '05', l: 'May' }, { v: '06', l: 'Jun' },
                    { v: '07', l: 'Jul' }, { v: '08', l: 'Ago' }, { v: '09', l: 'Sep' },
                    { v: '10', l: 'Oct' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dic' }
                  ].map(m => <option key={m.v} value={m.v} className="bg-[#121212] text-white">{m.l}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-accent pointer-events-none opacity-50" size={14} />
              </div>

              {/* Year */}
              <div className="relative">
                <select
                  required
                  value={formData.birthDate.split('-')[0] || '1995'}
                  onChange={(e) => {
                    const parts = formData.birthDate.split('-');
                    const month = parts[1] || '01';
                    const day = parts[2] || '01';
                    setFormData({...formData, birthDate: `${e.target.value}-${month}-${day}`});
                  }}
                  className="w-full bg-[#121212] border border-accent/20 rounded-2xl p-4 text-white outline-none focus:border-accent appearance-none transition-all cursor-pointer text-sm"
                >
                  {Array.from({ length: (new Date().getFullYear() - 18) - 1930 + 1 }, (_, i) => {
                    const year = (new Date().getFullYear() - 18 - i).toString();
                    return <option key={year} value={year} className="bg-[#121212] text-white">{year}</option>;
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-accent pointer-events-none opacity-50" size={14} />
              </div>
            </div>
            <p className="text-[10px] font-medium text-text-dim px-2 italic opacity-60">Selecciona tu Día, Mes y Año de nacimiento</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-dim px-2">Teléfono de Contacto</label>
            <input
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="10 dígitos"
              className="w-full bg-bg-card border border-accent/20 rounded-2xl p-5 text-text-main outline-none focus:border-accent transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full h-20 bg-accent text-black rounded-3xl font-black text-xl shadow-2xl shadow-accent/40 active:scale-95 transition-all mt-8"
          >
            FINALIZAR REGISTRO
          </button>
        </form>

        <AnimatePresence>
          {showNotificationPrompt && !isSuccessVisible && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
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
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">¿Dosis de Poder?</h3>
                  <p className="text-text-dim text-sm leading-relaxed">
                    ¿Quieres que te avisemos cuando tu mentalidad de diamante necesite un refuerzo? Activa las notificaciones para no perderte ninguna mentoría.
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={requestNotificationPermission}
                    className="w-full py-4 bg-accent text-black rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-accent/20 active:scale-95 transition-all"
                  >
                    ¡Claro!
                  </button>
                  <button 
                    onClick={handlePostponeNotifications}
                    className="w-full py-4 bg-white/5 text-text-dim rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 active:scale-95 transition-all"
                  >
                    Después
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isSuccessVisible && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[110] bg-black flex items-center justify-center p-6"
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
                  <h3 className="text-2xl font-black text-white uppercase italic">¡Perfecto!</h3>
                  <p className="text-accent text-sm font-bold max-w-xs mx-auto">
                    Te avisaremos solo cuando haya algo realmente valioso para tu crecimiento.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
