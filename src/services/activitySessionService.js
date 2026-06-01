import { supabase } from "../lib/supabase"

async function getCurrentUserId() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user.id
}

export async function getActivitySessions() {
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
        .from("activity_sessions")
        .select(`
            *,
            activities (
                id,
                name,
                family_member_id,
                family_members (
                    id,
                    name,
                    avatar_emoji
                )
            )
        `)
        .eq("activities.user_id", userId)
        .order("session_date", { ascending: true })

    if (error) throw error

    return data || []
}

export async function createActivitySession(session) {
    const { data, error } = await supabase
        .from("activity_sessions")
        .insert([session])
        .select()
        .single()

    if (error) throw error

    return data
}

export async function updateActivitySession(id, updates) {
    const { data, error } = await supabase
        .from("activity_sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteActivitySession(id) {
    const { error } = await supabase
        .from("activity_sessions")
        .delete()
        .eq("id", id)

    if (error) throw error
}