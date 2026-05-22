import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase, supabaseReady } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileFetched, setProfileFetched] = useState(false)
  const fetchingRef = useRef(false)

  const fetchProfile = async (userId) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      // Query 1: base user record (no nested joins)
      let { data: userData, error: userErr } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, location, bio, portfolio_url, linkedin_url, cv_data, credits, referral_code, referral_count')
        .eq('id', userId)
        .maybeSingle()

      // Retry once on network error
      if (userErr && !userData) {
        await new Promise(r => setTimeout(r, 800))
        const retry = await supabase
          .from('users')
          .select('id, name, email, avatar_url, location, bio, portfolio_url, linkedin_url, cv_data, credits, referral_code, referral_count')
          .eq('id', userId)
          .maybeSingle()
        userData = retry.data
      }

      // New user (Google OAuth or email): create record in public.users
      if (!userData) {
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
              .select('id, name, email, avatar_url, location, bio, portfolio_url, linkedin_url, cv_data, credits, referral_code, referral_count')
              .eq('id', userId)
              .maybeSingle()
            userData = refetch.data
          }
        } catch {}
      }

      if (userData) {
        // Query 2: user_roles separately (avoids nested join failure)
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role_type, is_primary')
          .eq('user_id', userId)

        // Query 3: talent_profile separately
        const { data: tpData } = await supabase
          .from('talent_profiles')
          .select('available, main_role')
          .eq('user_id', userId)
          .maybeSingle()

        const roles = Array.isArray(rolesData) ? rolesData : []
        const primaryRole = roles.find(r => r.is_primary)?.role_type || roles[0]?.role_type || null
        const tp = tpData || null

        if (primaryRole === 'talento' && !tp) {
          await supabase.from('talent_profiles')
            .upsert({ user_id: userId, available: true, main_role: '' }, { onConflict: 'user_id' })
            .catch(() => {})
        }

        setProfile({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar_url: userData.avatar_url,
          location: userData.location,
          bio: userData.bio,
          portfolio: userData.portfolio_url,
          portfolio_url: userData.portfolio_url,
          linkedin_url: userData.linkedin_url,
          cv_data: userData.cv_data || null,
          credits: userData.credits ?? 50,
          referral_code: userData.referral_code || null,
          referral_count: userData.referral_count ?? 0,
          type: primaryRole,
          role: tp?.main_role || '',
          available: tp?.available ?? true,
          idea_id: null,
        })

        // For visionario: fetch idea_id in background
        if (primaryRole === 'visionario') {
          supabase
            .from('ideas').select('id').eq('founder_id', userId)
            .order('created_at', { ascending: false }).limit(1).maybeSingle()
            .then(({ data: idea }) => {
              if (idea?.id) {
                setProfile(prev => prev ? { ...prev, idea_id: idea.id } : prev)
              }
            }).catch(() => {})
        }
      }
    } catch {}
    finally {
      fetchingRef.current = false
      setLoading(false)
      setProfileFetched(true)
    }
  }

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return }

    // Safety timeout: never stay loading more than 8 seconds
    const safetyTimer = setTimeout(() => setLoading(false), 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)

        // Aplicar rol y código de referido pendientes (Google OAuth o email signup)
        if (event === 'SIGNED_IN') {
          const pendingRole = localStorage.getItem('nexia_pending_role')
          if (pendingRole) {
            setLoading(true)
            localStorage.removeItem('nexia_pending_role')
            try {
              const { error: rpcErr } = await supabase.rpc('assign_user_role', { p_role_type: pendingRole })
              if (rpcErr) {
                await supabase.from('user_roles').insert({
                  user_id: session.user.id, role_type: pendingRole, is_primary: true,
                }).select()
              }
              fetchingRef.current = false
              await fetchProfile(session.user.id)
            } catch {
              setLoading(false)
            }
          }

          const pendingRef = localStorage.getItem('nexia_pending_ref')
          if (pendingRef) {
            localStorage.removeItem('nexia_pending_ref')
            supabase.rpc('apply_referral_code', { p_new_user_id: session.user.id, p_ref_code: pendingRef })
              .then(() => {
                fetchingRef.current = false
                fetchProfile(session.user.id).catch(() => {})
              }).catch(() => {})
          }
        }
      } else {
        setProfile(null)
        setProfileFetched(true)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
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
    if (!error) {
      fetchingRef.current = false
      // Timeout safety: si fetchProfile tarda más de 10s, continuar igual
      await Promise.race([
        fetchProfile(userId),
        new Promise(resolve => setTimeout(resolve, 10000)),
      ])
    }
    // Garantizar que loading sea false cuando setUserRole termina,
    // incluso si fetchProfile retornó early por fetchingRef concurrente
    setLoading(false)
    return { error }
  }

  const recalculateCredits = async () => {
    if (!user?.id) return
    try {
      const { data: newCredits } = await supabase.rpc('recalculate_user_credits', { p_user_id: user.id })
      if (typeof newCredits === 'number') {
        setProfile(prev => prev ? { ...prev, credits: newCredits } : prev)
      }
    } catch {}
  }

  const updateProfile = async (updates) => {
    if (!user?.id) return { data: null, error: { message: 'No autenticado' } }
    const { type, role, available, portfolio, ...rest } = updates

    // Filtrar valores undefined para no mandar campos vacíos a Postgres
    const userUpdates = {}
    Object.entries(rest).forEach(([k, v]) => { if (v !== undefined) userUpdates[k] = v })
    if (portfolio !== undefined) userUpdates.portfolio_url = portfolio

    const { data, error } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', user.id)
      .select()

    if (error) return { data, error }
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return { data: null, error: { message: 'No se pudo guardar. Verificá tu sesión.' } }

    if (role !== undefined || available !== undefined) {
      const tpUpdates = { user_id: user.id }
      if (role !== undefined) tpUpdates.main_role = role
      if (available !== undefined) tpUpdates.available = available
      await supabase.from('talent_profiles').upsert(tpUpdates, { onConflict: 'user_id' }).catch(() => {})
    }

    fetchingRef.current = false
    try { await fetchProfile(user.id) } catch {}
    recalculateCredits().catch(() => {})
    return { data, error }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileFetched, signUp, signIn, signInWithGoogle, signOut, updateProfile, fetchProfile, setUserRole, recalculateCredits }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
