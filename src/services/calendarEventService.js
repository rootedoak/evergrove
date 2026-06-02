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

export async function getCalendarEvents() {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("household_id", household.id)
        .order("start_date", { ascending: true })

    if (error) throw error
    return data || []
}

export async function createCalendarEvent(event) {
    const userId = await getCurrentUserId()
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("calendar_events")
        .insert([
            {
                ...event,
                user_id: userId,
                household_id: household.id
            }
        ])
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteCalendarEvent(id) {
    const household = await getCurrentHousehold()

    const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error
}

export async function updateCalendarEvent(id, updates) {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("calendar_events")
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) throw error

    return data
}