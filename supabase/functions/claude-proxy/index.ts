// @ts-nocheck
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const MODEL = 'gemini-2.0-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`

function ok(body) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function buildSystemPrompt(ctx) {
  const name = ctx?.name || 'usuario'
  const firstName = String(name).split(' ')[0]
  const type = ctx?.type || 'desconocido'
  const role = ctx?.role || ''
  const bio = ctx?.bio || ''
  const location = ctx?.location || ''
  const credits = ctx?.credits ?? 0
  const profilePct = ctx?.profilePct ?? 0
  const skills = Array.isArray(ctx?.skills) ? ctx.skills.join(', ') : ''
  const ideas = Array.isArray(ctx?.ideas) ? ctx.ideas.map(i => `${i.title} (${i.status})`).join(', ') : ''
  const memory = ctx?.memory || null
  const memSummary = memory?.summary ? `\nMemoria previa: ${memory.summary}` : ''
  const memGoals = Array.isArray(memory?.goals) && memory.goals.length > 0
    ? `\nObjetivos conocidos: ${memory.goals.join(', ')}` : ''
  const typeGuide = type === 'talento'
    ? `Como TALENTO, ${firstName} puede: completar su perfil y CV para aparecer en el matching de IA, aceptar o rechazar invitaciones de founders, acumular creditos (+ creditos = mayor prioridad en el algoritmo), y explorar proyectos activos.`
    : type === 'visionario'
    ? `Como VISIONARIO, ${firstName} puede: lanzar su idea en /lanzar, ver el panel de su proyecto en /dashboard, explorar talentos e invitarlos en /explorar, y mejorar su perfil para atraer mejores candidatos.`
    : type === 'inversor'
    ? `Como INVERSOR, ${firstName} puede: explorar proyectos con equipos formados en /proyectos, ver metricas de equipos, y contactar founders.` : ''
  return `Sos el asistente personal de IA de Equia - una plataforma que conecta talento argentino con visionarios de EE.UU.
Tu rol es GUIAR, ORIENTAR y AYUDAR al usuario a sacar el maximo provecho de la plataforma.
Respondes siempre en espanol rioplatense (vos, te, etc). Sos calido, directo y proactivo.

## PERFIL DEL USUARIO
Nombre: ${name}
Tipo: ${type}${role ? `\nRol: ${role}` : ''}${bio ? `\nBio: ${bio}` : ''}${location ? `\nUbicacion: ${location}` : ''}${skills ? `\nSkills: ${skills}` : ''}${ideas ? `\nIdeas activas: ${ideas}` : ''}
Creditos: ${credits} | Perfil completo: ${profilePct}%
${memSummary}${memGoals}

## ROL EN LA PLATAFORMA
${typeGuide}

## COMO RESPONDER
- Respondes en 2-5 oraciones simples. Si piden explicaciones, podes extenderte.
- Siempre termina con una pregunta o accion sugerida.
- Si el perfil esta incompleto (< 80%), sugeri completarlo.
- Si tiene pocos creditos (< 150), explica como conseguir mas.
- Usa emojis con moderacion. Lista 2-3 opciones si no sabe que hacer.
- NUNCA inventes datos del usuario.

## ACCIONES
Formato: [EJECUTAR:{"type":"...","data":{...}}] — nunca visible al usuario.
navigate — rutas: /perfil, /dashboard, /explorar, /lanzar, /cv, /proyectos, /perfil-chat, /cv-chat
update_profile — REGLA CRITICA: si el usuario menciona LinkedIn, portfolio, bio, ubicacion o nombre -> ejecuta YA sin pedir confirmacion.
create_idea — solo con confirmacion del usuario.`
}

async function callGemini(systemPrompt, contents, maxTokens = 800) {
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'assistantChat') {
      const { message, history = [], userContext = {} } = body
      const contents = []
      for (const msg of history) {
        contents.push({ role: msg.role === 'ai' ? 'model' : 'user', parts: [{ text: msg.text }] })
      }
      contents.push({ role: 'user', parts: [{ text: message }] })
      try {
        const text = await callGemini(buildSystemPrompt(userContext), contents, 800)
        return ok({ content: [{ text }] })
      } catch (geminiErr) {
        return ok({ error: geminiErr.message, content: [{ text: '' }] })
      }
    }

    if (action === 'extractCV') {
      const { conversation = '', userName = 'usuario' } = body
      const prompt = `Sos un extractor profesional de CVs. Analiza esta conversacion entre un asistente y ${userName}, y genera un JSON estructurado.\n\nDevuelve SOLO JSON valido sin markdown:\n{"job_title":"","summary":"","experience":[{"id":"exp1","company":"","role":"","from":"YYYY-MM","to":"YYYY-MM","current":false,"description":""}],"education":[{"id":"edu1","institution":"","degree":"","field":"","from":"YYYY-MM","to":"YYYY-MM","current":false}],"languages":[{"id":"lang1","name":"","level":"Basico|Intermedio|Avanzado|Bilingue|Nativo"}],"certifications":[{"id":"cert1","name":"","issuer":"","year":"YYYY"}],"projects":[{"id":"proj1","name":"","description":"","url":"","year":"YYYY"}],"availability":"Full-time|Part-time|Freelance|Abierto a oportunidades","desired_role":""}\nREGLAS: No inventes datos. Arrays vacios si no aplica.\n\nConversacion:\n${conversation}`
      const text = await callGemini('', [{ role: 'user', parts: [{ text: prompt }] }], 2000)
      return ok({ content: [{ text }] })
    }

    if (action === 'updateMemory') {
      const { messages = [], currentMemory = {}, userContext = {} } = body
      const conversation = messages.map(m => `${m.role === 'ai' ? 'Asistente' : 'Usuario'}: ${m.text}`).join('\n')
      const prompt = `Analiza esta conversacion y actualiza la memoria del usuario.\nDevuelve SOLO JSON valido: {"summary":"","goals":[],"key_facts":[],"style":{"tone":"formal|casual","detail_level":"brief|detailed"}}\nMemoria actual: ${JSON.stringify(currentMemory)}\nUsuario: ${userContext.name || 'desconocido'}\n\nConversacion:\n${conversation}`
      const text = await callGemini(prompt, [{ role: 'user', parts: [{ text: prompt }] }], 400)
      return ok({ content: [{ text }] })
    }

    return ok({ error: 'Unknown action' })
  } catch (e) {
    return ok({ error: e instanceof Error ? e.message : String(e) })
  }
})
