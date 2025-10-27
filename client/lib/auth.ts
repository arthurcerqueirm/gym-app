import { supabase } from "./supabase";

/**
 * Ensure a user record exists in the users table
 * This is required for foreign key constraints on other tables
 */
export async function ensureUserExists(
  userId: string,
  email: string,
  name?: string,
) {
  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId);

    if (checkError) {
      console.error("Error checking for existing user:", checkError);
      return { success: false, error: checkError };
    }

    // If user exists, we're done
    if (existingUser && existingUser.length > 0) {
      return { success: true, error: null };
    }

    // Create user record
    const { error: insertError } = await supabase.from("users").insert([
      {
        id: userId,
        name: name || email.split("@")[0],
        email: email,
      },
    ]);

    if (insertError) {
      console.error("Error creating user record:", insertError);
      return { success: false, error: insertError };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("Unexpected error in ensureUserExists:", err);
    return { success: false, error: err };
  }
}

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session, error };
}

export async function getUserProfile() {
  const { data: authData } = await supabase.auth.getSession();
  if (!authData?.session?.user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.session.user.id)
    .single();

  return { user: data, error };
}
