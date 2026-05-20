import { supabase } from './supabase'

async function invoke(action, params) {
  const { data, error } = await supabase.functions.invoke('claude-proxy', {
    body: { action, ...params },
  })
  if (error) throw error
  return data?.content?.[0]?.text || ''
}

export async function matchTeam({ title, description, category, roles }) {
  const text = await invoke('matchTeam', { title, description, category, roles })
  return JSON.parse(text.replace(/```json\n?|```/g, '').trim())
}

export async function generateInvitationMessage({ talentName, talentRole, projectTitle, projectDescription, whyChosen }) {
  return invoke('generateInvitationMessage', { talentName, talentRole, projectTitle, projectDescription, whyChosen })
}

export async function extractProfile({ history, userRole }) {
  const text = await invoke('extractProfile', { history, userRole })
  return JSON.parse(text.replace(/```json\n?|```/g, '').trim())
}

export async function chatProfile({ answers, nextField, role }) {
  return invoke('chatProfile', { answers, nextField, role })
}
