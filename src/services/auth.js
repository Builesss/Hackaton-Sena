import { supabase } from './supabase';

// ─── Sign In ──────────────────────────────────────────────────
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

// ─── Sign Up ─────────────────────────────────────────────────
export const signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // Insert profile with default role 'user'
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, name, role: 'user', email }]);
    if (profileError) console.warn('Profile insert warning:', profileError.message);
  }

  return data;
};

// ─── Sign Out ─────────────────────────────────────────────────
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ─── Get Profile ──────────────────────────────────────────────
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
};

// ─── Get Session ──────────────────────────────────────────────
export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};
