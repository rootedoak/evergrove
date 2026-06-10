import { supabase } from "../lib/supabase"
import { ensureMyHousehold } from "./householdService"

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user found.")

    return user
}

async function getUserAndHousehold() {
    const user = await getCurrentUser()
    const household = await ensureMyHousehold()

    return { user, household }
}

export async function getPersonalReminders() {
    const { user, household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("personal_reminders")
        .select("*")
        .eq("household_id", household.id)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("next_due", { ascending: true })

    if (error) throw error

    return data || []
}

export async function createPersonalReminder(payload) {
    const { user, household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("personal_reminders")
        .insert({
            household_id: household.id,
            user_id: user.id,
            title: payload.title,
            notes: payload.notes || null,
            frequency: payload.frequency || "once",
            next_due: payload.next_due || null,
            is_active: true
        })
        .select()
        .single()

    if (error) throw error

    return data
}

export async function updatePersonalReminder(id, payload) {
    const { data, error } = await supabase
        .from("personal_reminders")
        .update({
            ...payload,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deletePersonalReminder(id) {
    const { error } = await supabase
        .from("personal_reminders")
        .delete()
        .eq("id", id)

    if (error) throw error
}