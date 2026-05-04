/**
 * Llama a Claude para hacer el matching de equipo.
 * En producción: mover a una Supabase Edge Function
 * para no exponer la API key en el frontend.
 */
export async function matchTeam({ title, description, category, roles }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `Eres el motor de matching de nexIA, una plataforma que conecta ideas con talento.
Analizás proyectos y devolvés un análisis estructurado para armar el equipo perfecto.
Respondé SOLO con JSON válido, sin markdown ni backticks:
{
  "pitch": "resumen ejecutivo del proyecto en 2 oraciones",
  "whyThisTeam": "explicación de por qué este equipo es ideal para esta idea",
  "teamSize": 4,
  "complexity": "Alta|Media|Baja",
  "timeEstimate": "X meses",
  "successTip": "el consejo más importante para que este proyecto funcione",
  "risks": "principal riesgo a tener en cuenta",
  "rolesNeeded": ["rol1", "rol2", "rol3"]
}`,
      messages: [{
        role: 'user',
        content: `Analiza esta idea de proyecto para nexIA:
Nombre: ${title}
Descripción: ${description}
Categoría: ${category}
Roles que el fundador cree necesitar: ${roles.join(', ')}`
      }]
    })
  })

  const data = await res.json()
  const text = data.content?.[0]?.text || '{}'
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

export async function generateInvitationMessage({ talentName, talentRole, projectTitle, projectDescription, whyChosen }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: 'Generás mensajes de invitación personalizados para nexIA. Tono directo, entusiasta y profesional. Máximo 3 párrafos cortos. Sin saludos formales.',
      messages: [{
        role: 'user',
        content: `Generá un mensaje de invitación para:
Talento: ${talentName} (${talentRole})
Proyecto: ${projectTitle}
Descripción: ${projectDescription}
Por qué fue elegido: ${whyChosen}`
      }]
    })
  })

  const data = await res.json()
  return data.content?.[0]?.text || ''
}
