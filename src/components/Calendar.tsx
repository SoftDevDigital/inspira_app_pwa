/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Video, MapPin, ExternalLink, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, User, Sparkles, X, PlayCircle } from 'lucide-react';
import { InspiraEvent, UserPlan } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { telemetryService } from '../services/dbService';

interface CalendarProps {
  userPlan: UserPlan;
  onOpenPremium: () => void;
  events?: InspiraEvent[];
}

export default function Calendar({ userPlan, onOpenPremium, events = [] }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewingEvent, setViewingEvent] = useState<InspiraEvent | null>(null);
  const [showFomoModal, setShowFomoModal] = useState(false);

  const handleDayClick = (dayEvents: InspiraEvent[]) => {
    if (dayEvents.length === 0) return;
    setViewingEvent(dayEvents[0]);
  };

  // Helper to get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const eventDate = new Date(e.date);
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === day
      );
    });
  };

  return (
    <div className="pb-40 pt-8 px-6 space-y-8 max-w-4xl mx-auto">
      <header>
        <h1 className="text-4xl font-black text-text-main tracking-tighter">Nuestros Eventos</h1>
        <p className="text-text-dim text-sm font-bold uppercase tracking-[0.2em]">Agenda de Masterclasses</p>
      </header>

      {/* Interactive Calendar UI */}
      <div className="bg-bg-card border border-border rounded-[40px] p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-3 bg-bg-hover rounded-xl text-text-dim hover:text-accent transition-colors border border-border">
              <ChevronLeft size={24} />
            </button>
            <button onClick={nextMonth} className="p-3 bg-bg-hover rounded-xl text-text-dim hover:text-accent transition-colors border border-border">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map(d => (
            <div key={d} className="text-center text-[10px] font-black uppercase text-text-dim py-2">
              {d}
            </div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const hasEvent = dayEvents.length > 0;
            const isToday = new Date().getDate() === day && new Date().getMonth() === selectedDate.getMonth();
            
            return (
              <button
                key={day}
                onClick={() => handleDayClick(dayEvents)}
                className={`
                  relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border group
                  ${hasEvent 
                    ? 'bg-accent/5 border-accent/20 text-white hover:bg-accent hover:text-black hover:border-accent' 
                    : 'bg-transparent border-white/5 text-text-dim/40 hover:border-white/20'}
                  ${isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-deep' : ''}
                `}
              >
                <span className={`text-lg font-bold ${isToday ? 'text-accent group-hover:text-black' : ''}`}>{day}</span>
                <div className="flex gap-1 mt-1">
                  {dayEvents.map((e, idx) => (
                    <div 
                      key={idx} 
                      className={`w-1.5 h-1.5 rounded-full ${e.status === 'live' ? 'bg-blue-400' : 'bg-green-400'} group-hover:bg-black transition-colors`} 
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Event Details View (Reseña del Evento) */}
      <div className="space-y-6">
        {viewingEvent ? (
          <div className="bg-bg-card border-2 border-accent rounded-[32px] p-6 animate-in slide-in-from-bottom-4 duration-500 shadow-[0_0_40px_rgba(255,140,0,0.1)]">
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-accent">
                    <CalendarIcon size={14} />
                    <span className="!text-[10px] font-black uppercase tracking-widest">Reseña de Evento</span>
                  </div>
                  <h3 className="!text-[16px] !font-semibold text-white !leading-[1.2] uppercase">
                    {viewingEvent.title}
                  </h3>
                </div>
                <div className={`px-3 py-1 rounded-lg !text-[10px] font-black shadow-lg ${viewingEvent.status === 'live' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                  {viewingEvent.status === 'live' ? 'En Vivo' : 'Repetición'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/10">
                <div className="space-y-1">
                  <p className="!text-[11px] !font-medium text-text-dim uppercase tracking-widest">Estado</p>
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-accent" />
                    <p className="!text-[11px] !font-medium text-white truncate">{viewingEvent.status === 'live' ? 'Zoom Live' : 'Grabación Disponibe'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="!text-[11px] !font-medium text-text-dim uppercase tracking-widest">Fecha y Hora</p>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-accent" />
                    <p className="!text-[11px] !font-medium text-white">{new Date(viewingEvent.date).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Descripción</p>
                <p className="text-text-dim leading-relaxed text-[11px] font-medium">
                  {viewingEvent.description}
                </p>
              </div>

              {viewingEvent.url && (
                <button
                  onClick={() => {
                    if (userPlan === 'Gratis') {
                      setShowFomoModal(true);
                    } else {
                      telemetryService.logUsageEvent('Eventos Zoom');
                      window.open(viewingEvent.url, '_blank');
                    }
                  }}
                  className={`flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-[14px] font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl ${
                    viewingEvent.status === 'live' ? 'bg-red-600 text-white shadow-red-900/40' : 'bg-accent text-black shadow-accent/40'
                  }`}
                >
                  {viewingEvent.status === 'live' ? <Video size={18} /> : <PlayCircle size={18} />}
                  <span>{viewingEvent.status === 'live' ? 'Unirse al Zoom' : 'Ver Repetición'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-bg-card border border-border border-dashed rounded-[40px] p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-text-dim/20">
              <CalendarIcon size={32} />
            </div>
            <p className="text-text-dim font-bold uppercase tracking-widest text-sm">Selecciona un día marcado con el punto para ver la reseña</p>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-4">
        <div className="flex items-center gap-3 text-accent">
          <CalendarIcon size={24} />
          <h4 className="font-black uppercase tracking-tight">Reglas de la Agenda</h4>
        </div>
        <p className="text-text-dim text-sm leading-relaxed font-medium capitalize">
          las sesiones de zoom se graban y se suben a la sección de <span className="text-white font-bold uppercase">Testimonios</span> 24 horas después del evento para que no te pierdas ningún legado.
        </p>
      </div>

      {/* FOMO Modal */}
      <AnimatePresence>
        {showFomoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-card border-2 border-accent p-10 rounded-[48px] max-w-sm w-full text-center space-y-8 shadow-[0_0_100px_rgba(255,140,0,0.3)] relative"
            >
              <button 
                onClick={() => setShowFomoModal(false)}
                className="absolute top-6 right-6 text-text-dim hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto text-accent shadow-xl shadow-accent/20">
                <Sparkles size={48} fill="currentColor" />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white leading-tight">¡No te quedes fuera!</h3>
                <p className="text-text-dim text-sm leading-relaxed">
                  Hazte Premium para acceder a esta y todas las masterclasses en vivo del mes. ¡Únete a la élite ahora! 👑
                </p>
              </div>

              <button 
                onClick={() => {
                  setShowFomoModal(false);
                  onOpenPremium();
                }}
                className="w-full bg-accent text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95"
              >
                Hacerse Premium
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
