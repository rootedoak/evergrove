import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"

async function getCurrentUserId() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user.id
}

export async function getSchoolItems() {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("school_items")
        .select(`
            *,
            family_members (
                id,
                name,
                avatar_emoji
            )
        `)
        .eq("household_id", household.id)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })

    if (error) throw error

    return data || []
}

export async function createSchoolItem(item) {
    const userId = await getCurrentUserId()
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("school_items")
        .insert([
            {
                ...item,
                user_id: userId,
                household_id: household.id
            }
        ])
        .select()
        .single()

    if (error) throw error

    return data
}

export async function updateSchoolItem(id, updates) {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("school_items")
        .update(updates)
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteSchoolItem(id) {
    const household = await getCurrentHousehold()

    const { error } = await supabase
        .from("school_items")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error
}

export async function completeSchoolItem(id) {
    return updateSchoolItem(id, { completed: true })
}