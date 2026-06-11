/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Clock, Share2, MoreVertical, Plus, Gift, Trophy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Speaker, Audio, UserPlan, TalentNotification } from '../types';
import { MOCK_AUDIOS } from '../constants';
import MarqueeTitle from './MarqueeTitle';
import { talentNotificationService } from '../services/dbService';
import { auth } from '../services/firebase';

interface StarTalentWallProps {
  speaker: Speaker;
  onBack: () => void;
  onSelectAudio: (audio: Audio) => void;
  onAddToPlaylist?: (audio: Audio) => void;
  onSharePass?: (audio: Audio) => void;
  userPlan?: UserPlan;
}

export default function StarTalentWall({ speaker, onBack, onSelectAudio, onAddToPlaylist, onSharePass, userPlan }: StarTalentWallProps) {
  const [notifications, setNotifications] = useState<TalentNotification[]>([]);
  const isOwnProfile = auth.currentUser?.displayName === speaker.name || auth.currentUser?.email?.includes(speaker.id);

  useEffect(() => {
    const unsub = talentNotificationService.subscribeToNotificationsByTalent(speaker.name, (msgs) => {
      setNotifications(msgs);
    });
    return () => unsub();
  }, [speaker.name]);

  const speakerAudios = MOCK_AUDIOS.filter(a => a.author === speaker.name);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="absolute inset-0 bg-bg-deep z-[55] flex flex-col overflow-y-auto scrollbar-hide">
      {/* Header / Cover */}
      <div className="relative h-[450px] flex-shrink-0">
        <img 
          src={speaker.photoUrl} 
          alt={speaker.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-deep via-bg-deep/40 to-transparent" />
        
        <button 
          onClick={onBack}
          className="absolute top-12 left-6 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="absolute bottom-8 px-8 space-y-4">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-accent">Salón de la Fama</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter leading-none">
            {speaker.name}
          </h1>
          <p className="text-accent text-xl font-bold">{speaker.role}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-10 space-y-12 pb-40">
        {/* Bio */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-text-dim">Muro de Éxito</h3>
          <p className="text-xl text-text-dim leading-relaxed font-medium italic">
            "{speaker.bio}"
          </p>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center gap-6">
          <button 
            className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-black shadow-2xl shadow-accent/40 active:scale-95 transition-transform"
            onClick={() => speakerAudios.length > 0 && onSelectAudio(speakerAudios[0])}
          >
            <Play size={40} fill="currentColor" className="ml-1" />
          </button>
          <button className="w-14 h-14 border border-border rounded-full flex items-center justify-center text-text-dim">
            <Share2 size={24} />
          </button>
          <button className="w-14 h-14 border border-border rounded-full flex items-center justify-center text-text-dim">
            <MoreVertical size={24} />
          </button>
        </div>

        {/* Reconocimientos (Solo si hay alguno) */}
        {notifications.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                <Trophy size={18} />
              </div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Reconocimientos de INSPIRA</h3>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="min-w-[280px] max-w-[280px] bg-gradient-to-br from-amber-500/10 to-bg-deep border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <Trophy size={32} className="text-amber-500/10" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-black text-black">
                        #{notif.rank}
                      </div>
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">En el Top 10</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">DICE LA DIRECTIVA:</p>
                      <p className="text-sm font-medium text-white italic leading-relaxed">
                        "{notif.message}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center text-accent">
                          <CheckCircle2 size={10} />
                        </div>
                        <span className="text-[8px] font-black text-text-dim uppercase tracking-widest">{notif.adminName}</span>
                      </div>
                      <span className="text-[8px] font-bold text-text-dim uppercase">{new Date(notif.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Audio List */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-border pb-4">
            <h3 className="text-xl font-black text-text-main tracking-tight">Legado de Liderazgo</h3>
            <span className="text-xs text-text-dim font-bold">{speakerAudios.length} LECCIONES</span>
          </div>
          
          <div className="space-y-4">
            {speakerAudios.map((audio, idx) => (
              <motion.button
                key={audio.id}
                whileHover={{ x: 10 }}
                onClick={() => onSelectAudio(audio)}
                className="flex items-center gap-6 w-full text-left p-4 rounded-3xl hover:bg-bg-hover transition-colors group"
              >
                <span className="text-text-dim font-black text-lg w-6">{idx + 1}</span>
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                  <img src={audio.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={24} className="text-white" fill="currentColor" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <MarqueeTitle 
                    title={audio.title}
                    className="text-lg font-bold text-text-main"
                  />
                  <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest mt-1">
                    <span className="text-accent">{audio.tags[0]}</span>
                    <span className="text-text-dim flex items-center gap-1.5">
                      <Clock size={14} />
                      {formatDuration(audio.duration)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {userPlan === 'Premium' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSharePass?.(audio);
                      }}
                      className="p-4 bg-bg-hover text-text-dim rounded-2xl hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Gift size={24} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToPlaylist?.(audio);
                    }}
                    className="p-4 bg-bg-hover text-text-dim rounded-2xl hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
