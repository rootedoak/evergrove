import { supabase } from "../../lib/supabase"

export async function getUsers(search = "") {
    let query = supabase
        .from("admin_user_summary")
        .select("*")
        .order("name", { ascending: true })

    if (search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return data ?? []
}