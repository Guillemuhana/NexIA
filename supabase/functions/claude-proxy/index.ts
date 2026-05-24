// @ts-nocheck — Deno runtime, los tipos de Node.js no aplican aquí
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const MODEL = 'gemini-2.0-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`

function buildSystemPrompt(ctx: Record<string, unknown>): string {
  const name = ctx?.name || 'usuario'
  const firstName = (name as string).split(' ')[0]
  const type = ctx?.type || 'desconocido'
  const role = ctx?.role || ''
  const bio = ctx?.bio || ''
  const location = ctx?.location || ''
  const credits = ctx?.credits ?? 0
  const profilePct = ctx?.profilePct ?? 0
  const skills = Array.isArray(ctx?.skills) ? (ctx.skills as string[]).join(', ') : ''
  const ideas = Array.isArray(ctx?.ideas) ? (ctx.ideas as Array<{title:string,status:string}>).map(i => `${i.title} (${i.status})`).join(', ') : ''
  const memory = ctx?.memory as Record<string, unknown> | null
  const memSummary = memory?.summary ? `\nMemoria previa: ${memory.summary}` : ''
  const memGoals = Array.isArray(memory?.goals) && (memory.goals as string[]).length > 0
    ? `\nObjetivos conocidos: ${(memory.goals as string[]).join(', ')}`
    : ''

  const typeGuide = type === 'talento'
    ? `Como TALENTO, ${firstName} puede: completar su perfil y CV para aparecer en el matching de IA, aceptar o rechazar invitaciones de founders, acumular créditos (+ créditos = mayor prioridad en el algoritmo), y explorar proyectos activos.`
    : type === 'visionario'
    ? `Como VISIONARIO, ${firstName} puede: lanzar su idea en /lanzar, ver el panel de su proyecto en /dashboard, explorar talentos e invitarlos en /explorar, y mejorar su perfil para atraer mejores candidatos.`
    : type === 'inversor'
    ? `Como INVERSOR, ${firstName} puede: explorar proyectos con equipos formados en /proyectos, ver métricas de equipos, y contactar founders.`
    : ''

  return `Sos el asistente personal de IA de Equia — una plataforma que conecta talento argentino con visionarios de EE.UU.
Tu rol es GUIAR, ORIENTAR y AYUDAR al usuario a sacar el máximo provecho de la plataforma.
Respondés siempre en español rioplatense (vos, te, etc). Sos cálido, directo y proactivo.

## PERFIL DEL USUARIO
Nombre: ${name}
Tipo: ${type}${role ? `\nRol: ${role}` : ''}${bio ? `\nBio: ${bio}` : ''}${location ? `\nUbicación: ${location}` : ''}${skills ? `\nSkills: ${skills}` : ''}${ideas ? `\nIdeas activas: ${ideas}` : ''}
Créditos: ${credits} | Perfil completo: ${profilePct}%
${memSummary}${memGoals}

## ROL EN LA PLATAFORMA
${typeGuide}

## CÓMO RESPONDER
- Respondés en 2-5 oraciones en conversaciones simples. Si el usuario pide explicaciones, podés extenderte más.
- Siempre terminá con una pregunta o acción sugerida para continuar el flujo.
- Si el perfil está incompleto (< 80%), sugerí completarlo para mejorar el matching.
- Si el usuario tiene pocos créditos (< 150), explicá cómo conseguir más.
- Usá emojis con moderación para hacer la conversación más amena.
- Si el usuario no sabe qué hacer, listá 2-3 opciones concretas con descripción breve.
- NUNCA inventés datos del usuario que no estén en el contexto.

## ACCIONES DISPONIBLES
Podés ejecutar acciones embebidas en tu respuesta con el formato: [EJECUTAR:{"type":"...","data":{...}}]
El bloque [EJECUTAR:...] NUNCA se muestra al usuario. Siempre acompañalo con texto natural.

### navigate — llevar al usuario a una página
Usalo cuando el usuario quiere ir a algún lugar o cuando sugerís una sección.
[EJECUTAR:{"type":"navigate","data":{"to":"/ruta"}}]
Rutas disponibles: /perfil, /dashboard, /explorar, /lanzar, /cv, /proyectos, /perfil-chat, /cv-chat

### update_profile — actualizar campos del perfil
REGLA CRÍTICA: Si el usuario menciona su LinkedIn, portfolio, bio, ubicación o nombre → SIEMPRE ejecutá update_profile automáticamente sin pedir confirmación.
Campos: linkedin_url, portfolio_url, bio, location, name, available (boolean)
Ejemplo: "mi linkedin es https://linkedin.com/in/juan" → guardalo YA con update_profile

### create_idea — crear un proyecto/idea (sí requiere confirmación del usuario)
Usalo cuando el usuario describe una idea de negocio y quiere lanzarla.`
}

async function callGemini(systemPrompt: string, contents: unknown[], maxTokens = 800): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      contents,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `Gemini ${res.status}`)
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'assistantChat') {
      const { message, history = [], userContext = {} } = body
      const contents: unknown[] = []
      for (const msg of history) {
        contents.push({ role: msg.role === 'ai' ? 'model' : 'user', parts: [{ text: msg.text }] })
      }
      contents.push({ role: 'user', parts: [{ text: message }] })
      const text = await callGemini(buildSystemPrompt(userContext), contents, 800)
      return new Response(JSON.stringify({ content: [{ text }] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'extractCV') {
      const { conversation = '', userName = 'usuario' } = body
      const prompt = `Sos un extractor profesional de CVs. Analizá esta conversación entre un asistente y ${userName}, y generá un JSON estructurado con su información profesional.

Devolvé SOLO JSON válido sin markdown ni comentarios con esta estructura exacta:
{
  "job_title": "título profesional en máx 60 chars (ej: Full-Stack Developer · 5 años en startups)",
  "summary": "resumen profesional de 2-4 oraciones en primera persona, destacando experiencia y valor aportado",
  "experience": [{"id":"exp1","company":"","role":"","from":"YYYY-MM","to":"YYYY-MM","current":false,"description":""}],
  "education": [{"id":"edu1","institution":"","degree":"","field":"","from":"YYYY-MM","to":"YYYY-MM","current":false}],
  "languages": [{"id":"lang1","name":"","level":"Básico|Intermedio|Avanzado|Bilingüe|Nativo"}],
  "certifications": [{"id":"cert1","name":"","issuer":"","year":"YYYY"}],
  "projects": [{"id":"proj1","name":"","description":"","url":"","year":"YYYY"}],
  "availability": "Full-time|Part-time|Freelance|Abierto a oportunidades",
  "desired_role": ""
}
REGLAS: No inventes datos. Usá solo lo que el usuario mencionó explícitamente. Arrays vacíos si no aplica.

Conversación:
${conversation}`
      const text = await callGemini('', [{ role: 'user', parts: [{ text: prompt }] }], 2000)
      return new Response(JSON.stringify({ content: [{ text }] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'updateMemory') {
      const { messages = [], currentMemory = {}, userContext = {} } = body
      const conversation = messages.map((m: {role:string,text:string}) =>
        `${m.role === 'ai' ? 'Asistente' : 'Usuario'}: ${m.text}`
      ).join('\n')
      const prompt = `Analizá esta conversación y actualizá la memoria del usuario.
Devolvé SOLO JSON válido: {"summary":"","goals":[],"key_facts":[],"style":{"tone":"formal|casual","detail_level":"brief|detailed"}}
Memoria actual: ${JSON.stringify(currentMemory)}
Usuario: ${userContext.name || 'desconocido'}

Conversación:
${conversation}`
      const text = await callGemini(prompt, [{ role: 'user', parts: [{ text: prompt }] }], 400)
      return new Response(JSON.stringify({ content: [{ text }] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
