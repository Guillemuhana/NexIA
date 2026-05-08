import { supabase } from './supabase'

async function invoke(action, params) {
  const { data, error } = await supabase.functions.invoke('claude-proxy', {
    body: { action, ...params },
  })
  if (error) throw error
  const text = data?.content?.[0]?.text || '{}'
  return text
}

export async function matchTeam({ title, description, category, roles }) {
  const text = await invoke('matchTeam', { title, description, category, roles })
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

export async function generateInvitationMessage({ talentName, talentRole, projectTitle, projectDescription, whyChosen }) {
  return invoke('generateInvitationMessage', { talentName, talentRole, projectTitle, projectDescription, whyChosen })
}
