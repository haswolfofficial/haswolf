import { supabase } from "./supabase";

export const FOUNDER_EMAIL = "haswolf666@gmail.com";

export async function hasAdminAccess(user: { id: string; email?: string | null } | null | undefined) {
  if (!user) return false;
  if ((user.email || "").toLowerCase() === FOUNDER_EMAIL) return true;
  const { data, error } = await supabase.from("admin_members").select("user_id").eq("user_id", user.id).maybeSingle();
  return !error && Boolean(data);
}
