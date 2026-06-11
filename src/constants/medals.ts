import { Medal } from '../types';

export const MEDALS_CATALOG: Medal[] = [
  // PILAR 1: CONSTANCIA (racha_dias)
  { id: 1, titulo: "Primer Paso", descripcion: "Iniciaste sesión por primera vez.", icono: "🐣", tipoTrigger: "racha_dias", meta: 1 },
  { id: 2, titulo: "Fuego Inicial", descripcion: "3 días seguidos de racha.", icono: "🔥", tipoTrigger: "racha_dias", meta: 3 },
  { id: 3, titulo: "Semana Invencible", descripcion: "7 días de racha perfecta.", icono: "🛡️", tipoTrigger: "racha_dias", meta: 7 },
  { id: 4, titulo: "Quincena de Poder", descripcion: "15 días sin fallar.", icono: "⚡", tipoTrigger: "racha_dias", meta: 15 },
  { id: 5, titulo: "Mes de Hierro", descripcion: "30 días continuos de disciplina.", icono: "🦾", tipoTrigger: "racha_dias", meta: 30 },
  { id: 6, titulo: "Trimestre Imparable", descripcion: "90 días de enfoque total.", icono: "🚀", tipoTrigger: "racha_dias", meta: 90 },
  { id: 7, titulo: "Leyenda Anual", descripcion: "365 días de con-stancia. Eres el 1%.", icono: "👑", tipoTrigger: "racha_dias", meta: 365 },

  // PILAR 2: CONSUMO DE AUDIOS (audios_completados)
  { id: 8, titulo: "Oído Curioso", descripcion: "Completaste tu primer audio.", icono: "🎧", tipoTrigger: "audios_completados", meta: 1 },
  { id: 9, titulo: "Mente Abierta", descripcion: "Completaste 5 audios.", icono: "🧠", tipoTrigger: "audios_completados", meta: 5 },
  { id: 10, titulo: "Estudiante Estrella", descripcion: "Completaste 20 audios.", icono: "⭐", tipoTrigger: "audios_completados", meta: 20 },
  { id: 11, titulo: "Devoradora de Libros", descripcion: "Completaste 50 audios.", icono: "📚", tipoTrigger: "audios_completados", meta: 50 },
  { id: 12, titulo: "Biblioteca Andante", descripcion: "Completaste 100 audios.", icono: "🏛️", tipoTrigger: "audios_completados", meta: 100 },
  { id: 13, titulo: "Mente Maestra", descripcion: "Completaste 250 audios.", icono: "🧘‍♀️", tipoTrigger: "audios_completados", meta: 250 },
  { id: 14, titulo: "Iluminada", descripcion: "Completaste 500 audios.", icono: "🌟", tipoTrigger: "audios_completados", meta: 500 },
  { id: 15, titulo: "Gurú del Audio", descripcion: "Completaste 1,000 audios.", icono: "🦉", tipoTrigger: "audios_completados", meta: 1000 },

  // PILAR 3: FAVORITOS Y COLECCIÓN (favoritos_agregados)
  { id: 16, titulo: "Cazadora de Joyas", descripcion: "Agregaste 1 audio a favoritos.", icono: "💎", tipoTrigger: "favoritos_agregados", meta: 1 },
  { id: 17, titulo: "Coleccionista", descripcion: "Agregaste 5 audios a favoritos.", icono: "🎒", tipoTrigger: "favoritos_agregados", meta: 5 },
  { id: 18, titulo: "Curadora", descripcion: "Agregaste 10 audios a favoritos.", icono: "🖼️", tipoTrigger: "favoritos_agregados", meta: 10 },
  { id: 19, titulo: "Tesorera", descripcion: "Agregaste 25 audios a favoritos.", icono: "🏺", tipoTrigger: "favoritos_agregados", meta: 25 },
  { id: 20, titulo: "Bóveda de Sabiduría", descripcion: "Agregaste 50 audios a favoritos.", icono: "🏦", tipoTrigger: "favoritos_agregados", meta: 50 },

  // PILAR 4: DIFUSIÓN (compartir_app)
  { id: 21, titulo: "Evangelista", descripcion: "Compartiste la app por primera vez.", icono: "📢", tipoTrigger: "compartir_app", meta: 1 },
  { id: 22, titulo: "Conectora", descripcion: "Compartiste la app 5 veces.", icono: "🤝", tipoTrigger: "compartir_app", meta: 5 },
  { id: 23, titulo: "Influencer", descripcion: "Compartiste la app 10 veces.", icono: "📱", tipoTrigger: "compartir_app", meta: 10 },
  { id: 24, titulo: "Embajadora", descripcion: "Compartiste la app 25 veces.", icono: "🌍", tipoTrigger: "compartir_app", meta: 25 },
  { id: 25, titulo: "Líder de Masas", descripcion: "Compartiste la app 50 veces.", icono: "🗽", tipoTrigger: "compartir_app", meta: 50 },

  // PILAR 5: RUTA AL ÉXITO (ruta_nivel_completado)
  { id: 26, titulo: "Rompiendo el Cascarón", descripcion: "Completaste el Nivel 1.", icono: "🌱", tipoTrigger: "ruta_nivel_completado", meta: 1 },
  { id: 27, titulo: "Visión de Plata", descripcion: "Completaste el Nivel 2.", icono: "🥈", tipoTrigger: "ruta_nivel_completado", meta: 2 },
  { id: 28, titulo: "Mente de Oro", descripcion: "Completaste el Nivel 3.", icono: "🥇", tipoTrigger: "ruta_nivel_completado", meta: 3 },
  { id: 29, titulo: "Actitud Platino", descripcion: "Completaste el Nivel 4.", icono: "💍", tipoTrigger: "ruta_nivel_completado", meta: 4 },
  { id: 30, titulo: "Corona de Diamante", descripcion: "Completaste el Nivel 5.", icono: "👑💎", tipoTrigger: "ruta_nivel_completado", meta: 5 }
];
