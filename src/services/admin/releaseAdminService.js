import { supabase } from "../../lib/supabase"

export async function getReleases() {
    const { data, error } = await supabase
        .from("app_releases")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) throw error

    return data ?? []
}