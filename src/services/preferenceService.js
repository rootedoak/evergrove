import { supabase } from "../lib/supabase"

async function getCurrentUserId() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error

    if (!user) {
        throw new Error("No authenticated user")
    }

    return user.id
}

export async function getPreferences() {
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

    if (error) throw error

    if (data) return data

    const { data: created, error: createError } = await supabase
        .from("user_preferences")
        .insert([
            {
                user_id: userId
            }
        ])
        .select()
        .single()

    if (createError) throw createError

    return created
}

export async function updatePreferences(updates) {
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
        .from("user_preferences")
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq("user_id", userId)
        .select()
        .single()

    if (error) throw error

    return data
}