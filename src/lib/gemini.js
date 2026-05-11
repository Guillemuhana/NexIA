import { supabase } from './supabase'

export async function analyzeProject({ projectTitle, projectDescription, projectCategory, projectStage, team }) {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { projectTitle, projectDescription, projectCategory, projectStage, team },
  })
  if (error) throw error
  return data
}
