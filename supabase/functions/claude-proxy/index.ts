import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const MODEL = 'gemini-2.0-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`

function buildSystemPrompt(ctx: Record<string, unknown>): string {
  const name = ctx?.name || 'usuario'
  const type = ctx?.type || 'desconocido'
  const role = ctx?.role || ''
  const bio = ctx?.bio || ''
  const location = ctx?.location || ''
  const skills = Array.isArray(ctx?.skills) ? (ctx.skills as string[]).join(', ') : ''
  const ideas = Array.isArray(ctx?.ideas) ? (ctx.ideas as Array<{title:string,status:string}>).map(i => `${i.title} (${i.status})`).join(', ') : ''
  const memory = ctx?.memory as Record<string, unknown> | null
  const memSummary = memory?.summary ? `\nMemoria previa: ${memory.summary}` : ''
  const memGoals = Array.isArray(memory?.goals) && (memory.goals as string[]).length > 0
    ? `\nObjetivos conocidos: ${(memory.goals as string[]).join(', ')}`
    : ''

  return `Sos el asistente de IA de Equia, una plataforma que conecta talento argentino con visionarios de EE.UU.
Sos conciso, directo y útil. Respondés siempre en español.

Usuario: ${name}
Tipo: ${type}${role ? `\nRol: ${role}` : ''}${bio ? `\nBio: ${bio}` : ''}${location ? `\nUbicación: ${location}` : ''}${skills ? `\nSkills: ${skills}` : ''}${ideas ? `\nIdeas: ${ideas}` : ''}${memSummary}${memGoals}

## ACCIONES DISPONIBLES
Podés ejecutar acciones embebidas en tu respuesta con el formato: [EJECUTAR:{"type":"...","data":{...}}]
El texto de la acción NO se muestra al usuario. Siempre acompañá la acción con una respuesta de texto natural.

### navigate — ir a una página
Ejemplo: "Perfecto, te llevo a tu perfil." [EJECUTAR:{"type":"navigate","data":{"to":"/perfil"}}]
Páginas: /perfil, /dashboard, /explorar, /lanzar, /cv, /proyectos, /perfil-chat, /cv-chat

### update_profile — actualizar campos del perfil directamente
REGLA: Si el usuario menciona su LinkedIn, portfolio, bio, ubicación, nombre o disponibilidad → SIEMPRE usá update_profile.
Campos: linkedin_url, portfolio_url, bio, location, name, available (boolean)

Ejemplos:
- "mi linkedin es https://linkedin.com/in/nick" → [EJECUTAR:{"type":"update_profile","data":{"linkedin_url":"https://linkedin.com/in/nick"}}]
- "mi portfolio es https://misite.com" → [EJECUTAR:{"type":"update_profile","data":{"portfolio_url":"https://misite.com"}}]
- "estoy en Buenos Aires" → [EJECUTAR:{"type":"update_profile","data":{"location":"Buenos Aires"}}]
- "actualizá mi bio: Soy dev fullstack" → [EJECUTAR:{"type":"update_profile","data":{"bio":"Soy dev fullstack"}}]

### create_idea — crear una idea/proyecto (requiere confirmación del usuario)
Ejemplo: [EJECUTAR:{"type":"create_idea","data":{"title":"Mi app","description":"..."}}]

## GUÍAS
- Sé breve: máximo 3-4 oraciones salvo que el usuario pida más detalle.
- No inventes datos del usuario que no estén en el contexto.
- Si el usuario pregunta qué puede hacer, mostrá opciones según su tipo (talento/visionario/inversor).
- Nunca muestres el bloque [EJECUTAR:...] directamente en el texto visible.`
}

async function callGemini(systemPrompt: string, contents: unknown[], maxTokens = 800): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
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

    // ── assistantChat ──────────────────────────────────────────────
    if (action === 'assistantChat') {
      const { message, history = [], userContext = {} } = body

      const contents: unknown[] = []
      for (const msg of history) {
        contents.push({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        })
      }
      contents.push({ role: 'user', parts: [{ text: message }] })

      const text = await callGemini(buildSystemPrompt(userContext), contents, 800)
      return new Response(
        JSON.stringify({ content: [{ text }] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── extractCV ─────────────────────────────────────────────────
    if (action === 'extractCV') {
      const { conversation = '', userName = 'usuario' } = body

      const prompt = `Sos un extractor profesional de CVs. Analizá esta conversación entre un asistente y ${userName}, y generá un JSON estructurado con su información profesional.

Devolvé SOLO JSON válido sin markdown ni comentarios con esta estructura exacta:
{
  "job_title": "título profesional en máx 60 chars (ej: Full-Stack Developer · 5 años en startups)",
  "summary": "resumen profesional de 2-4 oraciones en primera persona, destacando experiencia y valor aportado",
  "experience": [
    {
      "id": "exp1",
      "company": "nombre empresa",
      "role": "puesto/cargo",
      "from": "YYYY-MM",
      "to": "YYYY-MM",
      "current": false,
      "description": "responsabilidades y logros, incluyendo métricas si las mencionó"
    }
  ],
  "education": [
    {
      "id": "edu1",
      "institution": "nombre institución",
      "degree": "título o carrera",
      "field": "campo de estudio",
      "from": "YYYY-MM",
      "to": "YYYY-MM",
      "current": false
    }
  ],
  "languages": [
    { "id": "lang1", "name": "nombre idioma", "level": "Básico|Intermedio|Avanzado|Bilingüe|Nativo" }
  ],
  "certifications": [
    { "id": "cert1", "name": "nombre certificado", "issuer": "institución o plataforma", "year": "YYYY" }
  ],
  "projects": [
    { "id": "proj1", "name": "nombre proyecto", "description": "qué es, tecnologías usadas e impacto", "url": "", "year": "YYYY" }
  ],
  "availability": "Full-time|Part-time|Freelance|Abierto a oportunidades",
  "desired_role": "tipo de rol y contexto que busca"
}

REGLAS:
- Si el usuario dijo "no aplica" → array vacío o string vacío
- No inventes datos. Usá solo lo que el usuario mencionó explícitamente
- Si hay años aproximados (ej: "trabajé 3 años"), calculá desde hoy
- Para experience.from/to usá formato YYYY-MM, aproximá si es necesario
- El job_title debe ser conciso y profesional

Conversación:
${conversation}`

      const text = await callGemini('', [{ role: 'user', parts: [{ text: prompt }] }], 2000)
      return new Response(
        JSON.stringify({ content: [{ text }] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── updateMemory ───────────────────────────────────────────────
    if (action === 'updateMemory') {
      const { messages = [], currentMemory = {}, userContext = {} } = body
      const conversation = messages.map((m: {role:string,text:string}) =>
        `${m.role === 'ai' ? 'Asistente' : 'Usuario'}: ${m.text}`
      ).join('\n')

      const prompt = `Analizá esta conversación entre un usuario y el asistente de Equia y actualizá la memoria del usuario.
Devolvé SOLO un JSON válido sin markdown con estos campos:
{
  "summary": "resumen en 1-2 oraciones de qué habló el usuario y sus intereses",
  "goals": ["objetivo 1", "objetivo 2"],
  "key_facts": ["hecho importante 1", "hecho importante 2"],
  "style": {"tone": "formal|casual", "detail_level": "brief|detailed"}
}

Memoria actual: ${JSON.stringify(currentMemory)}
Usuario: ${userContext.name || 'desconocido'}, tipo: ${userContext.type || 'desconocido'}

Conversación:
${conversation}`

      const text = await callGemini(prompt, [{ role: 'user', parts: [{ text: prompt }] }], 400)
      return new Response(
        JSON.stringify({ content: [{ text }] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
