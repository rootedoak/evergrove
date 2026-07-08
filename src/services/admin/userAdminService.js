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

export async function getUserDetail(userId) {
    const { data, error } = await supabase
        .from("admin_user_summary")
        .select("*")
        .eq("user_id", userId)
        .single()

    if (error) throw error

    return data
}

export async function getUserSupportTickets(userId) {
    const { data, error } = await supabase
        .from("product_feedback")
        .select(`
            id,
            ticket_number,
            feedback_type,
            status,
            priority,
            subject,
            message,
            created_at
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)

    if (error) throw error

    return data ?? []
}

export async function getUserUsageEvents(userId) {
    const { data, error } = await supabase
        .from("usage_events")
        .select(`
            id,
            event_type,
            entity_type,
            entity_id,
            metadata,
            created_at
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25)

    if (error) throw error

    return data ?? []
}

export async function getUserPreferences(userId) {
    const { data, error } = await supabase
        .from("admin_user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

    if (error) throw error

    return data
}

export async function searchUsers(search = "") {
    return getUsers(search)
}