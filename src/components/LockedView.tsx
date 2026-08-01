/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crown, Copy, CheckCircle2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppConfig, PlanConfig } from '../types';

interface LockedViewProps {
  title: string;
  description: string;
  buttonText?: string;
  appConfig?: AppConfig | null;
}

const DEFAULT_PLANS: PlanConfig[] = [
  {
    id: 'annual',
    name: 'Plan Visionaria (Anual)',
    badge: 'RECOMENDADO',
    price: 3600,
    subtitle: 'Equivale a $300/mes. ¡Ahorras $720!'
  },
  {
    id: 'semiannual',
    name: 'Plan Impulso (Semestral)',
    price: 1980,
    subtitle: 'Equivale a $330/mes.'
  },
  {
    id: 'monthly',
    name: 'Plan Estándar (Mensual)',
    price: 360,
    subtitle: 'Pago recurrente.'
  }
];

export default function LockedView({ title, description, buttonText, appConfig }: LockedViewProps) {
  // Usar los precios configurados por el Admin si existen; si no, los defaults.
  const plans = (appConfig?.plans && appConfig.plans.length > 0) ? appConfig.plans : DEFAULT_PLANS;
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(false); // Reset
    setTimeout(() => setCopied(true), 10);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = selectedPlan 
    ? `¡Hola, Naya! ✨ Soy una Líder lista para mi nivel de compromiso. Elegí el ${selectedPlan.name} ($${selectedPlan.price} MXN) y quiero activar mi acceso VIP a INSPIRA. 🏆`
    : `¡Hola, Naya! ✨ Soy una Líder lista para mi nivel de compromiso. Quiero activar mi acceso VIP a INSPIRA. 🏆`;

  const waNumber = appConfig?.whatsappVentas || "1234567890";
  const whatsappUrl = `https://wa.me/${waNumber.replace(/\+/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto pb-40">
      <div className="px-8 pt-20 pb-10 space-y-16">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-[2px] rounded-full bg-gradient-to-tr from-[#D4AF37] to-transparent mb-4"
          >
            <div className="w-28 h-28 rounded-full overflow-hidden bg-black border border-white/10">
              <img 
                src="https://picsum.photos/seed/naya_luxury/400/400" 
                alt="Naya" 
                className="w-full h-full object-cover grayscale opacity-90"
              />
            </div>
          </motion.div>
          <div className="space-y-4 px-2">
            <h2 className="text-4xl font-extralight text-white tracking-widest uppercase italic">
              {title}
            </h2>
            <div className="h-px w-12 bg-[#D4AF37] mx-auto" />
            <p className="text-zinc-400 text-base font-light leading-loose italic tracking-wide">
              {description}
            </p>
            <div className="pt-4 space-y-2">
              <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Instrucción VIP</p>
              <p className="text-zinc-500 text-xs italic font-medium leading-relaxed">
                Elige tu plan, realiza tu pago y <span className="text-white">captura tu comprobante</span>. Envíalo a Naya para activar tu acceso inmediato.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Cards - Ultra Clean & Airy */}
        <div className="space-y-10">
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.5em] text-center mb-8">Selecciona tu nivel de compromiso</p>
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`
                relative w-full text-left p-10 rounded-[40px] border transition-all duration-700 group active:scale-[0.98]
                ${selectedPlan?.id === plan.id 
                  ? 'border-[#D4AF37] bg-white text-black shadow-[0_30px_80px_rgba(212,175,55,0.2)]' 
                  : 'border-white/5 bg-zinc-900/40 text-white opacity-60 hover:opacity-100 hover:border-white/10'}
              `}
            >
              {plan.badge && (
                <div className="absolute -top-4 right-10 bg-[#D4AF37] text-black text-[9px] font-bold px-5 py-2 rounded-full uppercase tracking-[0.3em] shadow-xl">
                  {plan.badge}
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <h4 className={`text-2xl font-black italic tracking-tighter uppercase mb-2 ${selectedPlan?.id === plan.id ? 'text-black font-black' : 'text-white font-light'}`}>
                    {plan.name}
                  </h4>
                  <p className={`text-xs font-medium italic opacity-60 ${selectedPlan?.id === plan.id ? 'text-black' : 'text-zinc-500'}`}>
                    {plan.subtitle}
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black tracking-tighter ${selectedPlan?.id === plan.id ? 'text-black' : 'text-white'}`}>
                    ${plan.price.toLocaleString()}
                  </span>
                  <span className={`text-xs font-black uppercase tracking-widest opacity-40 ${selectedPlan?.id === plan.id ? 'text-black' : 'text-zinc-500'}`}>
                    MXN
                  </span>
                </div>
              </div>

              {selectedPlan?.id === plan.id && (
                <div className="absolute bottom-10 right-10">
                  <CheckCircle2 size={32} className="text-[#D4AF37]" strokeWidth={2.5} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Banking Expansion - Minimalist */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-[25px] p-8 space-y-8">
          <div className="flex flex-col items-center gap-2">
            <h4 className="text-white text-[10px] font-black uppercase tracking-[0.3em]">
              Datos Bancarios (México)
            </h4>
            <div className="h-px w-8 bg-[#D4AF37]/30" />
          </div>
          
          <div className="space-y-5">
            {[
              { label: 'TITULAR', value: appConfig?.bankDetails.titular || 'INSPIRA APPS DIGITAL' },
              { label: 'BANCO', value: appConfig?.bankDetails.banco || 'BBVA MÉXICO' },
              { label: 'CUENTA', value: appConfig?.bankDetails.cuenta || '0121 2121 21', isMono: true },
              { label: 'CLABE', value: appConfig?.bankDetails.clabe || '0121 8000 1212 1212 11', isMono: true },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-start gap-1">
                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{item.label}</span>
                <div className="w-full flex justify-between items-center bg-black/40 px-4 py-3 rounded-xl border border-white/5">
                  <span className={`text-[13px] text-white ${item.isMono ? 'font-mono' : 'font-light tracking-wide'}`}>{item.value}</span>
                  <button 
                    onClick={() => handleCopy(item.value)} 
                    className="text-[#D4AF37] hover:scale-125 transition-transform p-1 active:scale-90"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {copied && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em]"
              >
                ✓ Registro copiado
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <div className="space-y-8">
          <p className="text-center text-zinc-500 text-[11px] font-light leading-relaxed italic px-8">
            Envía tu comprobante de pago para habilitar tu acceso VIP de forma inmediata.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-4 bg-[#D4AF37] text-black w-full py-7 rounded-[25px] text-lg font-black hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-[#D4AF37]/20 uppercase tracking-widest whitespace-nowrap px-4"
          >
            <MessageCircle size={24} fill="currentColor" />
            <span>{buttonText || 'Confirmar en WhatsApp'}</span>
          </a>
          
          <p className="text-center text-zinc-800 text-[9px] font-black uppercase tracking-[0.3em] pb-10">
            Inspira Apps Digital • VIP Protocol
          </p>
        </div>
      </div>
    </div>
  );
}
