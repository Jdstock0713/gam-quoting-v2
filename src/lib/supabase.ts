/**
 * Lightweight Supabase REST client — no npm package needed.
 * Uses the PostgREST API that Supabase exposes automatically.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

export type AdminSettings = {
  id: number;
  enabled_carriers: string[]; // Compulife 4-digit company codes
  enabled_states: string[];   // State codes ("1" = Alabama, "23" = Michigan, etc.)
  application_emails: string;
  more_info_url: string;
  admin_password_hash: string;
  updated_at: string;
};

/** Fetch the admin settings (single row, id=1) */
export async function getAdminSettings(): Promise<AdminSettings | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_settings?id=eq.1&select=*`,
      { headers, cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
  } catch {
    return null;
  }
}

/** Update admin settings */
export async function updateAdminSettings(
  updates: Partial<Omit<AdminSettings, "id">>
): Promise<AdminSettings | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_settings?id=eq.1`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          ...updates,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    if (!res.ok) {
      console.error("Failed to update settings:", await res.text());
      return null;
    }
    const data = await res.json();
    return data[0] || null;
  } catch (e) {
    console.error("Error updating settings:", e);
    return null;
  }
}
