import { supabase } from './supabase'

function buildDemoData({ projectTitle = 'Tu Proyecto', projectCategory = 'Tech' } = {}) {
  return {
    vision: `Ser la plataforma líder de ${projectCategory} en Latinoamérica en 3 años.`,
    resumen: `${projectTitle} tiene un posicionamiento único en el mercado latinoamericano. La propuesta de valor es clara y diferenciada, con un equipo complementario que cubre las áreas clave. El momento de mercado es favorable y la tecnología disponible permite escalar rápidamente. Con ejecución enfocada, hay una oportunidad real de capturar una porción significativa del mercado objetivo.`,
    roadmap: [
      { fase: 'Fase 1: Validación', duracion: '1-2 meses', objetivo: 'Confirmar que el problema existe y que la solución genera interés real.', tareas: ['Entrevistar 30 usuarios potenciales', 'Definir métricas de éxito del MVP', 'Mapear competidores y diferenciadores'] },
      { fase: 'Fase 2: MVP', duracion: '2-3 meses', objetivo: 'Construir la versión mínima que resuelva el problema principal.', tareas: ['Desarrollar funcionalidades core', 'Lanzar beta cerrada con 50 usuarios', 'Iterar según feedback semanal'] },
      { fase: 'Fase 3: Lanzamiento', duracion: '1-2 meses', objetivo: 'Salir al mercado con tracción comprobada.', tareas: ['Campaña de lanzamiento en redes', 'Activar partnerships estratégicos', 'Optimizar conversión y onboarding'] },
      { fase: 'Fase 4: Crecimiento', duracion: '3-6 meses', objetivo: 'Escalar usuarios y preparar ronda de financiamiento.', tareas: ['Implementar growth loops virales', 'Expandir a 2 mercados nuevos', 'Preparar deck para inversores'] },
    ],
    ideas: [
      { titulo: 'Programa de referidos', descripcion: 'Incentivá a tus usuarios a traer otros con créditos o descuentos. Es el canal con mejor ROI para startups tempranas.', impacto: 'alto', esfuerzo: 'bajo', categoria: 'crecimiento' },
      { titulo: 'Integración con WhatsApp', descripcion: 'En Latam el 95% usa WhatsApp. Una integración nativa reduce la fricción de adopción dramáticamente.', impacto: 'alto', esfuerzo: 'medio', categoria: 'producto' },
      { titulo: 'Contenido educativo en redes', descripcion: 'Publicá tutoriales y casos de uso en TikTok e Instagram. Genera confianza y SEO orgánico sin costo.', impacto: 'medio', esfuerzo: 'bajo', categoria: 'marketing' },
      { titulo: 'Plan freemium → premium', descripcion: 'Ofrecé funcionalidades base gratis y cobrálas avanzadas. Reduce la barrera de entrada y facilita la conversión.', impacto: 'alto', esfuerzo: 'alto', categoria: 'monetización' },
      { titulo: 'Dashboard de métricas para usuarios', descripcion: 'Mostrale a tus usuarios el valor que genera la plataforma con datos concretos. Mejora retención y upsell.', impacto: 'medio', esfuerzo: 'medio', categoria: 'producto' },
      { titulo: 'Comunidad en Discord', descripcion: 'Armá una comunidad de early adopters. Son tus mejores testers, embajadores y fuente de feedback gratuito.', impacto: 'medio', esfuerzo: 'bajo', categoria: 'comunidad' },
    ],
    metricas_clave: [
      { nombre: 'Usuarios Activos Mensuales', descripcion: 'Cantidad de usuarios que usan la plataforma al menos una vez por mes', meta: '1.000 en 6 meses', tipo: 'crecimiento' },
      { nombre: 'Tasa de Retención D30', descripcion: 'Porcentaje de usuarios que siguen activos 30 días después del registro', meta: '>40%', tipo: 'retención' },
      { nombre: 'MRR (Monthly Recurring Revenue)', descripcion: 'Ingresos recurrentes mensuales de suscripciones activas', meta: '$5.000 USD', tipo: 'revenue' },
      { nombre: 'Tiempo de onboarding', descripcion: 'Tiempo promedio hasta que el usuario completa su primera acción clave', meta: '< 5 minutos', tipo: 'operaciones' },
    ],
    riesgos: [
      { nombre: 'Competencia de grandes plataformas', descripcion: 'Un jugador establecido puede copiar la funcionalidad core con más recursos.', probabilidad: 'media', impacto: 'alto', mitigacion: 'Enfocarse en un nicho específico y construir efectos de red antes de escalar.' },
      { nombre: 'Churn elevado en primeros meses', descripcion: 'Sin product-market fit claro, los usuarios pueden abandonar rápidamente.', probabilidad: 'alta', impacto: 'alto', mitigacion: 'Iterar semanalmente con el feedback de los primeros 50 usuarios y medir NPS.' },
      { nombre: 'Problemas de financiamiento', descripcion: 'La runway puede ser insuficiente si el crecimiento es más lento de lo esperado.', probabilidad: 'media', impacto: 'medio', mitigacion: 'Mantener costos bajos en etapa inicial y validar revenue antes de escalar el equipo.' },
    ],
    proximos_pasos: [
      'Definir las 3 funcionalidades del MVP esta semana',
      'Identificar y contactar 10 usuarios beta esta semana',
      'Crear un canal de comunicación interno del equipo (Discord o Slack)',
      'Establecer un ritmo de reuniones semanales de 30 minutos',
      'Lanzar una landing page simple para capturar emails de interesados',
    ],
    consejo_equipo: 'El mayor riesgo en esta etapa no es técnico sino de comunicación. Definan quién toma decisiones finales en cada área y comuníquense abiertamente sobre blockers. Los equipos que ejecutan rápido son los que tienen claridad de roles, no necesariamente los más talentosos.',
  }
}

export async function analyzeProject({ projectTitle, projectDescription, projectCategory, projectStage, team }) {
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 22000))
    const invokePromise = supabase.functions.invoke('gemini-proxy', {
      body: { mode: 'analyze', projectTitle, projectDescription, projectCategory, projectStage, team },
    })
    const { data, error } = await Promise.race([invokePromise, timeout])
    if (error || !data || data.error) throw new Error(error?.message || data?.error || 'API error')
    return data
  } catch {
    return { ...buildDemoData({ projectTitle, projectCategory }), _isDemo: true }
  }
}

export async function chatWithProject({ projectTitle, projectDescription, projectCategory, projectStage, question, history = [], team = [], buildLogs = [], aiSummary = '', userInfo = null }) {
  // Intento 1: gemini-proxy
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 22000))
    const invokePromise = supabase.functions.invoke('gemini-proxy', {
      body: { mode: 'chat', projectTitle, projectDescription, projectCategory, projectStage, question, history, team, buildLogs, aiSummary, userInfo },
    })
    const { data, error } = await Promise.race([invokePromise, timeout])
    if (error || !data || data.error) throw new Error('gemini error')
    return { answer: data.answer, _isDemo: false }
  } catch { /* fallback a claude */ }

  // Intento 2: claude-proxy (siempre disponible)
  try {
    const teamStr = team.map(m => `${m.name} (${m.role})`).join(', ')
    const logsStr = buildLogs.slice(0, 8).map(l => `[${l.type}] ${l.content}`).join('\n')
    const { data } = await supabase.functions.invoke('claude-proxy', {
      body: {
        action: 'assistantChat',
        message: question,
        history: history.slice(-12),
        userContext: {
          type: 'panel_consultor',
          name: userInfo?.name || 'Miembro',
          role: userInfo?.role || 'Miembro del equipo',
          projectTitle,
          projectDescription: (projectDescription || '').slice(0, 400),
          projectCategory,
          projectStage,
          teamMembers: teamStr,
          buildLogsRecent: logsStr,
          aiSummary: (aiSummary || '').slice(0, 300),
        },
      },
    })
    const answer = data?.content?.[0]?.text
    if (!answer) throw new Error('no answer')
    return { answer, _isDemo: false }
  } catch {
    return { answer: 'No pude procesar tu pregunta en este momento. Intentá de nuevo en unos segundos.', _isDemo: false }
  }
}
