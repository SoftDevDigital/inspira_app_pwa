/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crown, Star, ChevronRight } from 'lucide-react';
import { Speaker } from '../types';

interface StarTalentProps {
  onSelectSpeaker: (speaker: Speaker) => void;
  speakers?: Speaker[];
}

export default function StarTalent({ onSelectSpeaker, speakers = [] }: StarTalentProps) {
  return (
    <div className="pb-40 pt-8 px-6 space-y-12 max-w-4xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-text-main tracking-tighter uppercase leading-none">Salón de la Fama</h1>
        <p className="text-text-dim text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <Star size={16} className="text-accent" fill="currentColor" />
          Nuestras Maestras Tácticas
        </p>
      </header>

      <div className="grid gap-6">
        {speakers.map((speaker) => (
          <button
            key={speaker.id}
            onClick={() => onSelectSpeaker(speaker)}
            className="group relative h-72 w-full rounded-[40px] overflow-hidden card-panel border-0 active:scale-95 transition-all shadow-2xl"
          >
            <img 
              src={speaker.photoUrl} 
              alt={speaker.name} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
            
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-accent">
                  <Crown size={20} fill="currentColor" />
                  <span className="text-xs font-black uppercase tracking-widest">{speaker.role}</span>
                </div>
                <h3 className="text-4xl font-black text-white tracking-tight">{speaker.name}</h3>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-white/60 text-sm font-bold uppercase tracking-widest group-hover:text-accent transition-colors">
                <span>Explorar Legado de Liderazgo</span>
                <ChevronRight size={18} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white/5 border border-dashed border-white/10 rounded-[32px] p-8 text-center space-y-4">
        <p className="text-text-dim text-lg italic">
          "El éxito deja huellas. Sigue los pasos de las Maestras Tácticas de INSPIRA."
        </p>
      </div>
    </div>
  );
}
