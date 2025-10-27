import { supabase } from './supabase'

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data?.session, error }
}

export async function getUserProfile() {
  const { data: authData } = await supabase.auth.getSession()
  if (!authData?.session?.user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.session.user.id)
    .single()

  return { user: data, error }
}
