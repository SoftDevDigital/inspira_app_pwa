/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flame, Globe, Mail, Lock, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { BRANDING } from '../constants';
import { auth } from '../services/firebase';
import { userService } from '../services/dbService';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from 'firebase/auth';

interface LoginProps {
  onLogin: (name: string, isPhone?: boolean) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [view, setView] = useState<'selection' | 'email' | 'signup' | 'forgot'>('selection');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const ensureUserInFirestore = async (firebaseUser: any) => {
    if (!firebaseUser?.uid) return;

    const existingUser = await userService.getUser(firebaseUser.uid);
    if (existingUser) {
      return;
    }

    await userService.createUser({
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Diamante',
      email: (firebaseUser.email || '').toLowerCase(),
      role: 'User',
      isAdmin: false,
      plan: 'Gratis',
      onboardingCompleted: false,
      completedAudios: [],
      createdAt: new Date().toISOString(),
      unlockedMedalIds: [],
    });
  };

  useEffect(() => {
    const resolveRedirectAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await ensureUserInFirestore(result.user);
          onLogin(result.user.displayName || result.user.email?.split('@')[0] || 'Diamante', false);
        }
      } catch (err: any) {
        console.error('[Login][Google Redirect] ERROR', err);
        setError('Error al completar el login con Google (redirect).');
      }
    };

    resolveRedirectAuth();
  }, [onLogin]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await ensureUserInFirestore(result.user);
        onLogin(result.user.displayName || result.user.email?.split('@')[0] || 'Diamante', false);
      }
    } catch (err: any) {
      // En navegadores con bloqueo de popups usamos redirect como fallback oficial
      if (err?.code === 'auth/popup-blocked') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithRedirect(auth, provider);
        return;
      }

      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Cancelaste el popup de Google. Intenta nuevamente.');
        return;
      }

      setError('Error al iniciar sesión con Google. Verifica tu conexión e inténtalo otra vez.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      if (result.user) {
        await ensureUserInFirestore(result.user);
        onLogin(result.user.displayName || result.user.email?.split('@')[0] || 'Diamante', false);
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Acceso Denegado: Correo o contraseña incorrectos. Verifica tus credenciales.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Inténtalo más tarde.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.');
      } else {
        setError('Error al conectar con INSPIRA: ' + err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    try {
      setLoading(true);
      setError(null);

      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      if (result.user) {
        await ensureUserInFirestore({ ...result.user, displayName: name });
        onLogin(name, true); // true for new user (registrations)
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está en uso. Intenta iniciar sesión.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('No pudimos crear tu cuenta por conexión inestable. Inténtalo nuevamente.');
      } else {
        setError('Error al crear cuenta: ' + (err.message || 'Inténtalo de nuevo.'));
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo electrónico');
      } else {
        setError('Error al enviar el enlace. Verifica tu conexión.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderSelection = () => (
    <div className="w-full space-y-4">
      {/* Botón de Google deshabilitado temporalmente
      <motion.button
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-white text-black h-20 rounded-[32px] flex items-center justify-center gap-4 font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
      >
        <Globe size={28} />
        {loading ? 'Cargando...' : 'Entrar con Google'}
      </motion.button>
      */}

      <motion.button
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => setView('email')}
        className="w-full bg-bg-card border border-border text-text-main h-20 rounded-[32px] flex items-center justify-center gap-4 font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <Mail size={28} className="text-accent" />
        Entrar con Email
      </motion.button>

      <div className="flex items-center gap-4 py-2">
  <div className="h-[1px] flex-1 bg-border" />

  <span className="text-[12px] font-black text-text-dim uppercase tracking-[0.22em]">
    ¿Nuevo aquí?
  </span>

  <div className="h-[1px] flex-1 bg-border" />
</div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => setView('signup')}
        className="w-full h-16 rounded-[24px] border border-accent/20 text-accent font-black text-sm uppercase tracking-widest hover:bg-accent/5 transition-all"
      >
        Registrarte Gratis
      </motion.button>

      {error && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center pt-2"
        >
          {error}
        </motion.p>
      )}
    </div>
  );

  const renderEmailForm = () => (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleEmailLogin}
      className="w-full space-y-6"
    >
      <div className="space-y-4">
        <div className="relative group">
          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={20} />
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            required
            className="w-full bg-bg-card border border-border rounded-[24px] py-5 px-14 text-white outline-none focus:border-accent transition-all"
          />
        </div>
        <div className="relative group">
          <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={20} />
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            className="w-full bg-bg-card border border-border rounded-[24px] py-5 px-14 text-white outline-none focus:border-accent transition-all"
          />
        </div>
        
        <button 
          type="button"
          onClick={() => setView('forgot')}
          className="text-accent text-[10px] font-black uppercase tracking-widest hover:underline px-2 py-3 block w-max transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>
      )}

      <div className="space-y-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-black h-20 rounded-[32px] font-black text-xl shadow-xl shadow-accent/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Accediendo...' : 'Iniciar Sesión'}
        </button>
        <button
          type="button"
          onClick={() => {
            setView('selection');
            setError(null);
          }}
          className="w-full text-text-dim text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 py-4"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
      </div>
    </motion.form>
  );

  const renderSignupForm = () => (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSignup}
      className="w-full space-y-6"
    >
      <div className="text-center space-y-1 mb-2">
        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Crear Cuenta</h3>
        <p className="text-text-dim text-xs">Únete a la mayor red de liderazgo.</p>
      </div>

      <div className="space-y-4">
        <div className="relative group">
          <Flame className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={20} />
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu Nombre Completo"
            required
            className="w-full bg-bg-card border border-border rounded-[24px] py-5 px-14 text-white outline-none focus:border-accent transition-all"
          />
        </div>
        <div className="relative group">
          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={20} />
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            required
            className="w-full bg-bg-card border border-border rounded-[24px] py-5 px-14 text-white outline-none focus:border-accent transition-all"
          />
        </div>
        <div className="relative group">
          <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={20} />
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña (mín. 6 caracteres)"
            required
            minLength={6}
            className="w-full bg-bg-card border border-border rounded-[24px] py-5 px-14 text-white outline-none focus:border-accent transition-all"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>
      )}

      <div className="space-y-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-black h-20 rounded-[32px] font-black text-xl shadow-xl shadow-accent/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Comenzar Ahora'}
        </button>
        <button
          type="button"
          onClick={() => {
            setView('selection');
            setError(null);
          }}
          className="w-full text-text-dim text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 py-4"
        >
          <ArrowLeft size={16} />
          Ya tengo cuenta
        </button>
      </div>
    </motion.form>
  );

  const renderForgotForm = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full space-y-8"
    >
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Recuperar Acceso</h3>
        <p className="text-text-dim text-xs">Ingresa tu correo y te enviaremos un enlace de diamante para restablecer tu contraseña.</p>
      </div>

      {!resetSent ? (
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="relative group">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={20} />
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              required
              className="w-full bg-bg-card border border-border rounded-[24px] py-5 px-14 text-white outline-none focus:border-accent transition-all"
            />
          </div>

          {error && (
            <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-accent text-black h-20 rounded-[32px] font-black text-xl shadow-xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            <Send size={24} />
            {loading ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>
      ) : (
        <div className="bg-accent/10 border border-accent/20 rounded-[32px] p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-black" />
          </div>
          <p className="text-white font-bold">¡Enlace Enviado!</p>
          <p className="text-text-dim text-xs">Revisa tu bandeja de entrada y sigue las instrucciones para recuperar tu poder.</p>
        </div>
      )}

      <button
        onClick={() => {
          setView('email');
          setResetSent(false);
          setError(null);
        }}
        className="w-full text-text-dim text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 py-4"
      >
        <ArrowLeft size={16} />
        Volver al inicio de sesión
      </button>
    </motion.div>
  );

  return (
    <div className={`absolute inset-0 bg-bg-deep z-[90] flex flex-col p-6 sm:p-10 overflow-y-auto overflow-x-hidden scrollbar-hide`}>
      <div className="flex-1 flex flex-col items-center justify-center py-10 max-w-md mx-auto w-full relative z-[100]">
        <motion.div
           initial={{ y: -50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="flex flex-col items-center gap-4 w-full mb-12"
        >
          <div className="relative w-full flex flex-col items-center gap-6">
            <img 
              src={BRANDING.logoUrl}
              alt={BRANDING.appName}
              className="h-20 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                if (sibling) sibling.classList.remove('hidden');
              }}
            />
            <h1 className="text-5xl font-black text-white tracking-[0.2em] italic hidden">{BRANDING.appName}</h1>
            <div className="w-16 h-1 bg-accent/30 rounded-full" />
          </div>
          <p className="text-text-dim text-[10px] font-black uppercase tracking-[0.4em] mt-2">SISTEMA DE ÉXITO EXCLUSIVO</p>
        </motion.div>

        <AnimatePresence mode="wait">
          <div className="w-full relative z-[110]">
            {view === 'selection' && renderSelection()}
            {view === 'email' && renderEmailForm()}
            {view === 'signup' && renderSignupForm()}
            {view === 'forgot' && renderForgotForm()}
          </div>
        </AnimatePresence>

        <div className="mt-8 mb-4">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-text-dim text-[10px] font-bold uppercase tracking-widest text-center"
          >
            ÚNETE A LA COMUNIDAD EXCLUSIVA DE LÍDERES INSPIRA
          </motion.p>
        </div>

        {/* 100px Spacer requested to separate form from decorative elements */}
        <div className="h-[100px] w-full" />

        {/* Decorative Vertical List requested */}
        <div className="w-full py-12 flex flex-col items-center gap-4 opacity-10 pointer-events-none select-none z-[50]">
          {['LIDERAZGO', 'VENTAS', 'MENTE', 'VERDAD'].map((text, idx) => (
            <motion.span 
              key={text}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + (idx * 0.1) }}
              className="text-[10px] font-black uppercase tracking-[0.6em] text-white"
            >
              {text}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}
