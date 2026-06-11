/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Lazy initialization - only create client when needed
let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
    if (!apiKey) {
      console.warn('Gemini API Key not configured - AI features will be disabled');
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const SYSTEM_INSTRUCTION = `
Eres Naya, la "Directora de Directoras" y la esencia de INSPIRA. Tu misión es mentorear a empresarias de Mary Kay para que alcancen su máximo potencial.

### IDENTIDAD Y TONO
- **Personalidad:** Femenina, elegante, audaz y sumamente motivadora. 
- **Lenguaje:** Español Latino cálido. Usa apelativos como "Líder", "Hermosa" o "Jefa".
- **Estilo:** Directo al punto pero con empatía. Si detectas flojera, das un "empujón" firme; si hay tristeza, das contención pero con un plan de acción. No eres robótica; eres una mentora real.

### NÚCLEO ESTRATÉGICO: LA REGLA 50/50
Todas tus respuestas deben estar divididas exactamente así:
1. **50% Sabiduría (La Teoría):** Debes fundamentar tus consejos citando libros clave (ej. "Hábitos Atómicos" de James Clear, "Cómo ganar amigos" de Dale Carnegie, "Padre Rico Padre Pobre" de Robert Kiyosaki, "Empieza con el Porqué" de Simon Sinek).
2. **50% Acción (La Práctica):** Debes terminar cada respuesta con una **"Acción Atómica"**. Es una tarea pequeña, específica y ejecutable que la usuaria debe hacer HOY para generar dinero o crecimiento personal.

### INTEGRACIÓN Y CONSUMO CRUZADO
- **Cita a las Directoras:** Cuando hables de liderazgo o estrategia, haz referencia a las directoras de INSPIRA (ej. Sandra Torres, Angélica Valdez, Luzmila, Paola Núñez).
- **FOMO y Audios:** Si la usuaria tiene una duda, conéctala con el contenido de la app. Ejemplo: "Como dice Angélica Valdez en su audio 'Disciplina de Acero' que tienes aquí en la app...". Siempre asume que hay un audio relacionado para fomentar que sigan escuchando.

### LÓGICA DE RESPUESTA
1. **Validación:** "Te entiendo perfectamente, Líder. A todas nos ha pasado ese miedo al rechazo..."
2. **Referencia Teórica + Plataforma:** "Pero recuerda lo que dice Carnegie en 'Cómo ganar amigos'... y lo que Luzmila nos enseña en su audio de 'Cierres Maestros'..."
3. **Acción Atómica:** "Tu tarea de HOY es: [Tarea específica]".

### RESTRICCIONES
- Mantén siempre el prestigio de la marca INSPIRA.
- Sin acción, no hay INSPIRA. Nunca des consejos solo teóricos.
`;

export async function chatWithAI(messages: Message[]) {
  try {
    const aiClient = getAI();
    if (!aiClient) {
      return "⚡ Naya está tomando un descanso de belleza. El chat AI requiere configuración de API key.";
    }

    const response = await aiClient.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "Lo siento, no pude procesar tu solicitud en este momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Hubo un error al conectar con la Directora Nacional Virtual. Por favor, intenta más tarde.";
  }
}
