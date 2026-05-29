const MODELS = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-12b-it:free',
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'openrouter/auto'
];

const callOpenRouter = async (prompt) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("API Key de OpenRouter no encontrada");

  for (const model of MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Previmed AI',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
        })
      });

      if (!response.ok) {
        throw new Error(`Error en modelo ${model}: ${response.statusText}`);
      }

      const data = await response.json();
      return { content: data.choices[0].message.content, modelUsed: model };
    } catch (error) {
      console.warn(`Falló el modelo ${model}, intentando con el siguiente...`, error);
    }
  }

  throw new Error("Todos los modelos de IA fallaron.");
};

export const fetchOpenRouterPrediction = async (historico) => {
  const prompt = `Actúa como un experto en análisis de tráfico urbano. Dado el siguiente historial de nivel de congestión (0-100) en las últimas 8 horas: ${historico.join(', ')}. Predice el nivel de congestión para las próximas 8 horas. Responde ÚNICAMENTE con un array de 8 números enteros separados por comas, sin texto adicional, sin formato markdown. Ejemplo: 45, 50, 55, 60, 65, 70, 75, 80.`;
  
  const { content, modelUsed } = await callOpenRouter(prompt);
  const nums = content.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
  
  if (nums.length >= 8) {
    return { prediction: nums.slice(0, 8), modelUsed };
  } else {
    throw new Error(`Formato incorrecto: ${content}`);
  }
};

export const fetchChatbotResponse = async (query, contextData) => {
  const prompt = `
Eres PREVIMED Copilot, un asistente experto en movilidad urbana e IA para la ciudad de Medellín.
Estás asesorando a un funcionario de la alcaldía/secretaría de movilidad.
A continuación te proporciono el contexto actual de la ciudad (datos reales en vivo y bases históricas):
--- CONTEXTO ---
Accidentes graves recientes (Histórico de Zonas Críticas): ${JSON.stringify(contextData.accidents?.zonasCriticas?.slice(0,3))}
Tráfico en vivo (zonas): ${JSON.stringify(contextData.traffic?.zonas?.filter(z => z.congestion > 50).map(z => z.nombre))}
Clima actual: ${contextData.weather?.actual?.estado}, Precipitaciones: ${contextData.weather?.actual?.precipitacion}mm
--- FIN CONTEXTO ---

Responde la siguiente pregunta del usuario de manera profesional, concisa, con viñetas si es necesario y directo al punto. Menciona datos específicos del contexto si son relevantes.
PREGUNTA DEL USUARIO: "${query}"
`;
  const { content } = await callOpenRouter(prompt);
  return content;
};

export const generateExecutiveReport = async (contextData) => {
  const prompt = `
Actúa como un experto consultor de Smart Cities y Movilidad Inteligente.
Genera un "Reporte Ejecutivo de Situación Vial en Tiempo Real" de exactamente 3 párrafos en formato HTML simple (usa <b> para negritas, <ul>/<li> para listas cortas).
NO uses etiquetas <html> o <body> o markdown, solo los elementos HTML internos. NO incluyas título <h1>, solo los párrafos.

--- DATOS ACTUALES ---
Zonas con congestión crítica actual: ${contextData.traffic?.zonas?.filter(z => z.congestion > 60).map(z => z.nombre).join(', ') || 'Ninguna crítica'}
Estado del Clima: ${contextData.weather?.actual?.estado}, Lluvia: ${contextData.weather?.actual?.precipitacion}mm. Nivel de alerta: ${contextData.weather?.actual?.nivelRiesgo}
Zonas de Riesgo Histórico Activas: ${contextData.weather?.zonasRiesgo?.filter(z => z.activo).map(z => z.zona).join(', ') || 'Ninguna alerta de lluvia cruzada con accidentes activa'}
--- FIN DATOS ---

Párrafo 1: Resumen de la situación meteorológica y su impacto general.
Párrafo 2: Estado actual del tráfico e intersección con zonas de alto riesgo de accidentalidad.
Párrafo 3: Recomendaciones operativas inmediatas para despachadores de ambulancias y agentes de tránsito.
`;
  const { content } = await callOpenRouter(prompt);
  return content;
};
