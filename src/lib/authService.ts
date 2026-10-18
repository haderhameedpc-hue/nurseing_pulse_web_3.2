import { supabase } from "./supabase";

export interface Profile {
  id: string;
  username: string;
  points: number;
  created_at: string;
}

const GUEST_POINTS_KEY = "guestPoints";

export function getGuestPoints(): number {
  try {
    const raw = localStorage.getItem(GUEST_POINTS_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  } catch {
    return 0;
  }
}

function clearGuestPoints() {
  try {
    localStorage.removeItem(GUEST_POINTS_KEY);
  } catch {
    // localStorage unavailable — nothing to clear
  }
}

/**
 * Join the leaderboard with a username only.
 * - If the username exists: adds saved guest points to the existing total and updates the row.
 * - If it doesn't exist: creates a new profile whose points start at the guest points.
 * Guest points are cleared from localStorage only after a confirmed write.
 */
export async function joinLeaderboard(username: string): Promise<Profile> {
  const guestPoints = getGuestPoints();

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("id, username, points, created_at")
    .eq("username", username)
    .maybeSingle();

  if (fetchError) throw new Error("تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.");

  if (existing) {
    const newTotal = (existing.points ?? 0) + guestPoints;
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ points: newTotal })
      .eq("id", existing.id)
      .select("id, username, points, created_at")
      .single();

    if (updateError) throw new Error("تعذر تحديث النقاط. حاول مرة أخرى.");
    clearGuestPoints();
    return updated as Profile;
  }

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ username, points: guestPoints })
    .select("id, username, points, created_at")
    .single();

  if (insertError) throw new Error("تعذر إنشاء الحساب. حاول مرة أخرى.");
  clearGuestPoints();
  return created as Profile;
}
