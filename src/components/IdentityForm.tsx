/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail } from 'lucide-react';

interface IdentityFormProps {
  onComplete: (name: string, email: string) => void;
}

export default function IdentityForm({ onComplete }: IdentityFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!validateEmail(email)) {
      setError('Por favor, ingresa un correo electrónico válido');
      return;
    }
    setError('');
    onComplete(name.trim(), email.trim());
  };

  return (
    <div className="absolute inset-0 bg-bg-deep z-[95] flex flex-col items-center justify-center p-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-12"
      >
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-block px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Nivel 1: Identidad</span>
          </motion.div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-tight">
            Tu Identidad de <span className="text-accent">Diamante</span>
          </h2>
          <p className="text-text-dim text-sm italic">
            Líder, necesitamos tu nombre y correo para vincular tu progreso a la eternidad de INSPIRA.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-dim px-2">Nombre Completo</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-accent/50 group-focus-within:text-accent transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre aquí..."
                  className="w-full bg-bg-card border border-accent/20 focus:border-accent rounded-[24px] py-5 pl-14 pr-6 text-white outline-none transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-dim px-2">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-accent/50 group-focus-within:text-accent transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-bg-card border border-accent/20 focus:border-accent rounded-[24px] py-5 pl-14 pr-6 text-white outline-none transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] placeholder:text-white/20"
                />
              </div>
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full h-20 bg-accent text-black rounded-[32px] font-black text-xl shadow-[0_10px_40px_rgba(212,175,55,0.3)] active:scale-95 transition-all mt-8 uppercase tracking-widest"
          >
            Continuar
          </button>
        </form>
      </motion.div>
    </div>
  );
}
