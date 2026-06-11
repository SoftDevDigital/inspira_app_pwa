import { motion } from 'motion/react';
import { X, ShieldCheck, Scale, ScrollText } from 'lucide-react';

interface LegalViewProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'elegant' | 'clarity';
}

export default function LegalView({ isOpen, onClose, theme }: LegalViewProps) {
  if (!isOpen) return null;

  const sectionStyle = `p-6 mb-4 rounded-[24px] border ${
    theme === 'elegant' ? 'bg-white/5 border-white/5' : 'bg-[#F2F2F7] border-zinc-200'
  }`;

  const titleStyle = `text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2 ${
    theme === 'elegant' ? 'text-white' : 'text-zinc-900'
  }`;

  const textStyle = `text-xs leading-relaxed space-y-4 ${
    theme === 'elegant' ? 'text-white/60' : 'text-zinc-600'
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 z-[3000] flex flex-col bg-black overflow-hidden"
    >
      {/* Header */}
      <div className={`p-6 pt-12 flex items-center justify-between border-b ${
        theme === 'elegant' ? 'border-white/10 bg-zinc-950' : 'border-zinc-200 bg-white'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className={`text-xl font-black uppercase tracking-tighter leading-none ${
              theme === 'elegant' ? 'text-white' : 'text-zinc-900'
            }`}>Legal y Privacidad</h2>
            <p className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mt-1">Cumplimiento Normativo</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className={`p-2 rounded-full border transition-all ${
            theme === 'elegant' ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
          }`}
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-2xl mx-auto space-y-4 pb-20">
          
          {/* Section: Terms and Conditions */}
          <div className={sectionStyle}>
            <h3 className={titleStyle}>
              <ScrollText size={18} className="text-[#D4AF37]" />
              Términos y Condiciones
            </h3>
            <div className={textStyle}>
              <p>
                <strong>1. Aceptación de los Términos:</strong> Al acceder y utilizar la aplicación INSPIRA, usted acepta estar sujeto a estos Términos y Condiciones de Uso. Si no está de acuerdo con alguno de estos términos, tiene prohibido utilizar o acceder a este sitio.
              </p>
              <p>
                <strong>2. Licencia de Uso:</strong> Se concede permiso para descargar temporalmente una copia de los materiales (información o software) en la aplicación INSPIRA para visualización transitoria personal y no comercial únicamente. Esta es la concesión de una licencia, no una transferencia de título.
              </p>
              <p>
                <strong>3. Restricciones:</strong> Usted no puede: modificar o copiar los materiales; usar los materiales para cualquier propósito comercial o para cualquier exhibición pública (comercial o no comercial); intentar descompilar o realizar ingeniería inversa de cualquier software contenido en la aplicación INSPIRA.
              </p>
              <p>
                <strong>4. Propiedad Intelectual:</strong> Todo el contenido presente en esta plataforma, incluyendo audios, textos, diseños y logotipos, es propiedad intelectual de INSPIRA y sus Star Talents. Cualquier reproducción total o parcial sin autorización expresa está estrictamente prohibida.
              </p>
              <p>
                <strong>5. Limitaciones:</strong> En ningún caso INSPIRA o sus proveedores serán responsables de los daños que surjan del uso o la imposibilidad de usar los materiales en INSPIRA, incluso si INSPIRA o un representante autorizado de INSPIRA ha sido notificado verbalmente o por escrito de la posibilidad de tales daños.
              </p>
            </div>
          </div>

          {/* Section: Privacy Policy */}
          <div className={sectionStyle}>
            <h3 className={titleStyle}>
              <Scale size={18} className="text-[#D4AF37]" />
              Aviso de Privacidad
            </h3>
            <div className={textStyle}>
              <p>
                <strong>1. Recolección de Datos:</strong> Recopilamos información personal que usted nos proporciona voluntariamente, como su nombre, dirección de correo electrónico y datos de perfil. También recopilamos datos de uso para mejorar la experiencia del usuario.
              </p>
              <p>
                <strong>2. Uso de la Información:</strong> Los datos recolectados se utilizan para personalizar su experiencia, procesar sus solicitudes, mejorar nuestro servicio y enviarle comunicaciones relacionadas con su cuenta y novedades de la plataforma.
              </p>
              <p>
                <strong>3. Seguridad de los Datos:</strong> Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales contra el acceso no autorizado, la alteración o la destrucción.
              </p>
              <p>
                <strong>4. Cookies:</strong> Utilizamos cookies y tecnologías similares para entender cómo usa nuestra plataforma y para recordar sus preferencias de configuración.
              </p>
              <p>
                <strong>5. Terceros:</strong> No vendemos, intercambiamos ni transferimos su información personal a terceros no autorizados. Esto no incluye a socios de confianza que nos asisten en la operación de nuestra aplicación, siempre que dichas partes acuerden mantener esta información confidencial.
              </p>
              <p>
                <strong>6. Derechos del Usuario:</strong> Usted tiene derecho a acceder, rectificar o eliminar sus datos personales en cualquier momento a través de la configuración de su cuenta o contactando a nuestro equipo de soporte.
              </p>
            </div>
          </div>

          {/* Version and Brand */}
          <div className="text-center py-8">
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${
              theme === 'elegant' ? 'text-zinc-700' : 'text-zinc-400'
            }`}>
              INSPIRA V2.0 • COMPLIANCE DEPARTMENT
            </p>
            <p className="text-[#D4AF37] text-[9px] font-bold mt-2">© 2026 INSPIRA APPS. TODOS LOS DERECHOS RESERVADOS.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
