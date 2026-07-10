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

    const users = data ?? []
    const userIds = users
        .map(user => user.user_id)
        .filter(Boolean)

    if (userIds.length === 0) return users

    const { data: preferences, error: preferencesError } = await supabase
        .from("user_display_preferences")
        .select("*")
        .in("user_id", userIds)

    if (preferencesError) throw preferencesError

    const preferencesByUserId = new Map(
        (preferences ?? []).map(row => [row.user_id, row])
    )

    return users.map(user => ({
        ...user,
        preferences: preferencesByUserId.get(user.user_id) ?? null,
        has_completed_onboarding:
            preferencesByUserId.get(user.user_id)?.has_completed_onboarding ?? null,
        has_completed_guided_walkthrough:
            preferencesByUserId.get(user.user_id)?.has_completed_guided_walkthrough ?? null
    }))
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
    if (!userId) {
        throw new Error("userId is required")
    }

    const { data, error } = await supabase
        .from("user_display_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

    if (error) throw error

    return data
}

export async function searchUsers(search = "") {
    return getUsers(search)
}

export async function getUserAdoptionEvents(userId) {
    if (!userId) {
        throw new Error("userId is required")
    }

    const since = new Date()
    since.setDate(since.getDate() - 60)

    const { data, error } = await supabase
        .from("usage_events")
        .select(`
            id,
            event_type,
            created_at
        `)
        .eq("user_id", userId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })

    if (error) throw error

    return data ?? []
}