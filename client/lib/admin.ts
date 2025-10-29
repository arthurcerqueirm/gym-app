import { supabase } from "./supabase";

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return data?.is_admin || false;
  } catch (err) {
    console.error("Error in isUserAdmin:", err);
    return false;
  }
}

export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, is_admin, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (err) {
    console.error("Error fetching users:", err);
    return { success: false, data: null, error: err };
  }
}

export async function getUserCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error("Error getting user count:", err);
    return 0;
  }
}

export async function canDeleteUser(
  targetUserId: string,
  adminEmail: string,
): Promise<boolean> {
  // arthurcerqueira2025@gmail.com is the owner and cannot be deleted
  if (adminEmail === "arthurcerqueira2025@gmail.com") {
    const { data: targetUser } = await supabase
      .from("users")
      .select("email")
      .eq("id", targetUserId)
      .single();

    // Cannot delete the owner
    if (targetUser?.email === "arthurcerqueira2025@gmail.com") {
      return false;
    }
  }
  return true;
}

export async function canRemoveAdminFromUser(
  targetUserId: string,
): Promise<boolean> {
  // Cannot remove admin status from the owner
  const { data: targetUser } = await supabase
    .from("users")
    .select("email")
    .eq("id", targetUserId)
    .single();

  return targetUser?.email !== "arthurcerqueira2025@gmail.com";
}
