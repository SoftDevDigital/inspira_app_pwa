/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { BRANDING } from '../constants';

export default function SplashScreen() {
  return (
    <div className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative"
      >
        <div className="absolute inset-0 bg-accent blur-[80px] opacity-20 animate-pulse" />
        <img 
          src={BRANDING.logoUrl}
          alt={BRANDING.appName}
          className="h-32 w-auto object-contain relative z-10"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const sibling = e.currentTarget.nextElementSibling as HTMLElement;
            if (sibling) sibling.classList.remove('hidden');
          }}
        />
        <h1 className="text-6xl font-black text-white tracking-[0.3em] italic hidden relative z-10">{BRANDING.appName}</h1>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-12 space-y-2"
      >
        <h2 className="text-2xl font-serif italic text-white/90">
          "El mundo pertenece a las que se atreven."
        </h2>
        <div className="w-12 h-1 bg-accent mx-auto rounded-full mt-4" />
      </motion.div>
    </div>
  );
}
