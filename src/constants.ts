/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Audio, InspiraEvent, SuccessPathLevel, Speaker, Book } from './types';

export const SPEAKERS: Speaker[] = [
  {
    id: 's1',
    name: 'Luzmila',
    role: 'Directora Nacional Elite',
    bio: 'Con más de 20 años de trayectoria, Luzmila ha transformado la vida de miles de mujeres. Su maestría en ventas y liderazgo la han posicionado como una de las voces mas influyentes de la industria.',
    photoUrl: 'https://picsum.photos/seed/speaker1/600/800',
    userEmail: 'luzmila@inspira.com'
  },
  {
    id: 's2',
    name: 'Paola Núñez',
    role: 'Directora Nacional',
    bio: 'Experta en prospectación digital y mentalidad de abundancia. Paola combina técnicas modernas de marketing con la filosofía clásica del éxito para resultados extraordinarios.',
    photoUrl: 'https://picsum.photos/seed/speaker2/600/800',
    userEmail: 'paola@inspira.com'
  },
  {
    id: 's3',
    name: 'Sofía Castro',
    role: 'Directora Nacional',
    bio: 'La reina del manejo de objeciones y el cierre maestro. Sofía es conocida por su energía inagotable y su capacidad para convertir cada "no" en un "sí" rotundo.',
    photoUrl: 'https://picsum.photos/seed/speaker3/600/800',
    userEmail: 'sofia@inspira.com'
  }
];

export const MOCK_AUDIOS: Audio[] = [
  {
    id: '1',
    title: 'Cierre Maestro en 5 Pasos',
    author: 'Sofía Castro',
    tags: ['Ventas', 'Motivación'],
    duration: 600,
    coverUrl: 'https://picsum.photos/seed/sales1/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    isPremium: true,
    plays: 12500,
    weeklyPlays: 850,
    reproducciones: 1500,
    uploadedAt: '2024-03-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'Mi Camino al Éxito',
    author: 'Luzmila',
    tags: ['Testimonios', 'Motivación'],
    duration: 480,
    coverUrl: 'https://picsum.photos/seed/test1/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    isPremium: false,
    plays: 45000,
    weeklyPlays: 1200,
    reproducciones: 2500,
    uploadedAt: '2024-03-25T10:00:00Z',
  },
  {
    id: '3',
    title: 'Prospectación Digital 2024',
    author: 'Paola Núñez',
    tags: ['Prospectación', 'Ventas'],
    duration: 720,
    coverUrl: 'https://picsum.photos/seed/pros1/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    isPremium: true,
    plays: 8900,
    weeklyPlays: 450,
    reproducciones: 800,
    uploadedAt: '2024-04-10T10:00:00Z',
  },
  {
    id: '4',
    title: 'Mentalidad de Diamante',
    author: 'Luzmila',
    tags: ['Motivación', 'Testimonios'],
    duration: 300,
    coverUrl: 'https://picsum.photos/seed/mot1/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    isPremium: false,
    plays: 32000,
    weeklyPlays: 980,
    reproducciones: 1800,
    uploadedAt: '2024-04-15T10:00:00Z',
  },
  {
    id: '5',
    title: 'Manejo de Objeciones',
    author: 'Sofía Castro',
    tags: ['Ventas', 'Prospectación'],
    duration: 540,
    coverUrl: 'https://picsum.photos/seed/sales2/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    isPremium: true,
    plays: 7500,
    weeklyPlays: 320,
    reproducciones: 600,
    uploadedAt: '2024-04-16T10:00:00Z',
  },
  {
    id: '6',
    title: 'Liderazgo Situacional',
    author: 'Paola Núñez',
    tags: ['Motivación', 'Ventas'],
    duration: 900,
    coverUrl: 'https://picsum.photos/seed/lead1/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    isPremium: true,
    plays: 15400,
    weeklyPlays: 1100,
    reproducciones: 2100,
    uploadedAt: '2024-04-17T10:00:00Z',
  },
  {
    id: '7',
    title: 'Ventas por WhatsApp',
    author: 'Sofía Castro',
    tags: ['Ventas', 'Prospectación'],
    duration: 420,
    coverUrl: 'https://picsum.photos/seed/wa1/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    isPremium: false,
    plays: 11200,
    weeklyPlays: 600,
    reproducciones: 1100,
    uploadedAt: '2024-04-18T10:00:00Z',
  },
  {
    id: '8',
    title: 'Autoestima y Poder',
    author: 'Luzmila',
    tags: ['Motivación'],
    duration: 600,
    coverUrl: 'https://picsum.photos/seed/conf1/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    isPremium: true,
    plays: 28000,
    weeklyPlays: 750,
    reproducciones: 1400,
    uploadedAt: '2024-04-12T10:00:00Z',
  },
  {
    id: '9',
    title: 'Redes de Mercadeo',
    author: 'Paola Núñez',
    tags: ['Prospectación'],
    duration: 1200,
    coverUrl: 'https://picsum.photos/seed/net1/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    isPremium: true,
    plays: 6800,
    weeklyPlays: 250,
    reproducciones: 400,
    uploadedAt: '2024-04-11T10:00:00Z',
  },
  {
    id: '10',
    title: 'El Arte de Escuchar',
    author: 'Luzmila',
    tags: ['Motivación', 'Ventas'],
    duration: 540,
    coverUrl: 'https://picsum.photos/seed/list1/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    isPremium: false,
    plays: 19500,
    weeklyPlays: 1350,
    reproducciones: 2300,
    uploadedAt: '2024-04-05T10:00:00Z',
  },
  {
    id: '11',
    title: 'Duplicación Masiva',
    author: 'Paola Núñez',
    tags: ['Ventas', 'Prospectación'],
    duration: 840,
    coverUrl: 'https://picsum.photos/seed/dup1/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    isPremium: true,
    plays: 5400,
    weeklyPlays: 150,
    reproducciones: 300,
    uploadedAt: '2024-04-01T10:00:00Z',
  }
];

export const RECOMMENDED_BOOKS: Book[] = [
  {
    id: '1',
    title: 'El club de las 5 de la mañana',
    author: 'Robin Sharma',
    review: 'Un método revolucionario para dominar tus mañanas y elevar tu vida.',
    rating: 5,
    coverUrl: 'https://picsum.photos/seed/sharma/400/600',
    type: 'Resumen VIP'
  },
  {
    id: '2',
    title: 'Hábitos Atómicos',
    author: 'James Clear',
    review: 'Pequeños cambios, resultados extraordinarios. Una guía para construir buenos hábitos.',
    rating: 5,
    coverUrl: 'https://picsum.photos/seed/habits/400/600',
    type: 'Mentoría'
  },
  {
    id: '3',
    title: 'Los 7 Hábitos de la Gente Altamente Efectiva',
    author: 'Stephen Covey',
    review: 'Lecciones fundamentales sobre liderazgo y efectividad personal.',
    rating: 5,
    coverUrl: 'https://picsum.photos/seed/covey/400/600',
    type: 'Resumen VIP'
  }
];

export const SUCCESS_PATH_LEVELS: SuccessPathLevel[] = [
  {
    id: 'bronze',
    title: 'Bronce',
    rank: 'Bronce',
    audioIds: ['2', '4'],
    bookIds: ['2'],
    description: 'Fundamentos de mentalidad y primeros pasos hacia la cima.',
    color: '#CD7F32',
  },
  {
    id: 'silver',
    title: 'Plata',
    rank: 'Plata',
    audioIds: ['7', '10', '1'],
    bookIds: ['1'],
    description: 'Maestría en ventas y comunicación efectiva.',
    color: '#C0C0C0',
  },
  {
    id: 'gold',
    title: 'Oro',
    rank: 'Oro',
    audioIds: ['3', '6', '11'],
    bookIds: ['3'],
    description: 'Liderazgo de alto impacto y duplicación masiva.',
    color: '#FFD700',
  },
];

export const MOCK_EVENTS: InspiraEvent[] = [
  {
    id: 'e1',
    title: 'Lunes de Enfoque Profundo',
    description: 'Comienza la semana con la mentalidad correcta. En esta sesión revisaremos las metas semanales y las estrategias de cierre rápido.',
    date: '2026-04-20T09:00:00',
    url: 'https://zoom.us/j/123456789',
    status: 'live'
  },
  {
    id: 'e3',
    title: 'Taller de Prospectación Digital',
    description: 'Transforma tus redes sociales en máquinas de prospección. Aprende a crear contenido que atraiga a tu cliente ideal.',
    date: '2026-04-22T10:00:00',
    url: 'https://zoom.us/j/112233445',
    status: 'live'
  },
  {
    id: 'e4',
    title: 'Mentalidad de Nacional',
    description: 'Sesión exclusiva sobre el salto cuántico necesario para llegar al nivel Nacional. Rompiendo techos de cristal.',
    date: '2026-04-24T17:00:00',
    url: 'https://zoom.us/j/556677889',
    status: 'live'
  },
  {
    id: 'e2',
    title: 'Cierre de Quincena Explosivo',
    description: 'Técnicas de urgencia y escasez para asegurar tus metas de volumen al cierre de la quincena.',
    date: '2026-04-30T18:00:00',
    url: 'https://zoom.us/j/987654321',
    status: 'live'
  }
];

export const WHATSAPP_PREMIUM_LINK = "https://wa.me/1234567890?text=Hola!%20Quiero%20ser%20miembro%20Premium%20de%20INSPIRA";

export const BRANDING = {
  logoUrl: '/logo_app.png',
  appName: 'INSPIRA'
};

export const CATEGORIES = [
  'Ventas',
  'Motivación',
  'Liderazgo',
  'Prospectación',
  'Testimonios',
  'Mentalidad',
  'Estrategia'
];

/**
 * Weekly Audio Algorithm Helper
 * Priority: Newest content (7-14 days).
 * Returns the same audio for everyone during the current week.
 */
export function getWeeklyAudio(audios: Audio[]): Audio {
  const now = new Date();
  
  // To keep it unified but dynamic based on the date, we can use the week number as a seed
  const weekNumber = getWeekNumber(now);
  
  // Filter audios by age (simulated)
  const sortedByDate = [...audios].sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  
  // If there are very new audios, pick from the top 3
  // Using weekNumber to cycle through them if there are multiple recent ones
  const candidates = sortedByDate.slice(0, 3);
  return candidates[weekNumber % candidates.length];
}

function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export const getAudio = (id: string) => MOCK_AUDIOS.find(a => a.id === id);
export const getBook = (id: string) => RECOMMENDED_BOOKS.find(b => b.id === id);
