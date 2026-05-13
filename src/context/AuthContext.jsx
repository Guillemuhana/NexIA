import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    let { data } = await supabase
      .from('users')
      .select('*, user_roles(role_type, is_primary), talent_profiles(available, main_role)')
      .eq('id', userId)
      .single()

    // Usuario nuevo (Google OAuth o email): crear registro en public.users
    if (!data) {
      try {
        const res = await supabase.auth.getUser()
        const authUser = res?.data?.user
        const meta = authUser?.user_metadata || {}
        const { error: insertErr } = await supabase.from('users').insert({
          id: userId,
          name: meta.full_name || meta.name || authUser?.email?.split('@')[0] || '',
          email: authUser?.email || '',
          avatar_url: meta.avatar_url || meta.picture || null,
        })
        if (!insertErr) {
          const refetch = await supabase
            .from('users')
            .select('*, user_roles(role_type, is_primary), talent_profiles(available, main_role)')
            .eq('id', userId)
            .single()
          data = refetch.data
        }
      } catch {}
    }

    if (data) {
      const roles = Array.isArray(data.user_roles) ? data.user_roles : []
      const primaryRole = roles.find(r => r.is_primary)?.role_type || roles[0]?.role_type || null
      const tp = Array.isArray(data.talent_profiles) ? data.talent_profiles[0] : data.talent_profiles
      setProfile({
        id: data.id,
        name: data.name,
        email: data.email,
        avatar_url: data.avatar_url,
        location: data.location,
        bio: data.bio,
        portfolio: data.portfolio_url,
        portfolio_url: data.portfolio_url,
        linkedin_url: data.linkedin_url,
        type: primaryRole,
        role: tp?.main_role || '',
        available: tp?.available ?? true,
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)

        // Aplicar rol pendiente (Google OAuth o email signup)
        if (event === 'SIGNED_IN') {
          const pendingRole = localStorage.getItem('nexia_pending_role')
          if (pendingRole) {
            setLoading(true)
            localStorage.removeItem('nexia_pending_role')
            try {
              const { error: rpcErr } = await supabase.rpc('assign_user_role', { p_role_type: pendingRole })
              // Fallback: direct insert si el RPC no existe aún
              if (rpcErr) {
                await supabase.from('user_roles').insert({
                  user_id: session.user.id, role_type: pendingRole, is_primary: true,
                }).select()
              }
            } catch {}
            await fetchProfile(session.user.id)
          }
        }
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({ email, password, name }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    })
    return { data, error }
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signInWithGoogle = async (role = null) => {
    if (role) localStorage.setItem('nexia_pending_role', role)
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const setUserRole = async (userId, roleType) => {
    const { error } = await supabase.rpc('assign_user_role', { p_role_type: roleType })
    if (!error) await fetchProfile(userId)
    return { error }
  }

  const updateProfile = async (updates) => {
    if (!user?.id) return { data: null, error: { message: 'No autenticado' } }
    const { type, role, available, portfolio, ...rest } = updates
    const userUpdates = { ...rest }
    if (portfolio !== undefined) userUpdates.portfolio_url = portfolio

    const { data, error } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) return { data, error }

    if (role !== undefined || available !== undefined) {
      const tpUpdates = { user_id: user.id }
      if (role !== undefined) tpUpdates.main_role = role
      if (available !== undefined) tpUpdates.available = available
      await supabase.from('talent_profiles').upsert(tpUpdates, { onConflict: 'user_id' }).catch(() => {})
    }

    try { await fetchProfile(user.id) } catch {}
    return { data, error }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signInWithGoogle, signOut, updateProfile, fetchProfile, setUserRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
