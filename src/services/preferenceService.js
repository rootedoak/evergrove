import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"

const householdPreferenceFields = [
    "household_name",
    "timezone",
    "week_starts_on",
    "shopping_category_order"
]

const userPreferenceFields = [
    "dashboard_window_days",
    "timeline_window_days",
    "birthday_reminders",
    "trip_reminders",
    "activity_reminders",
    "school_reminders",
    "task_reminders",
    "inbox_tasks",
    "inbox_activities",
    "inbox_school",
    "inbox_calendar",
    "inbox_trips",
    "inbox_reminders",
    "show_birthdays",
    "show_trips",
    "show_school_items",
    "show_activity_sessions",
    "show_suggested_tasks",
    "task_default_view",
    "has_completed_onboarding",
]

async function getCurrentUserId() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user.id
}

function pickFields(source, fields) {
    return fields.reduce((picked, field) => {
        if (field in source) {
            picked[field] = source[field]
        }

        return picked
    }, {})
}

async function getHouseholdPreferences(userId, householdId) {
    const { data, error } = await supabase
        .from("household_preferences")
        .select("*")
        .eq("household_id", householdId)
        .maybeSingle()

    if (error) throw error
    if (data) return data

    const { data: created, error: createError } = await supabase
        .from("household_preferences")
        .insert([
            {
                user_id: userId,
                household_id: householdId
            }
        ])
        .select()
        .single()

    if (createError) throw createError

    return created
}

async function getUserDisplayPreferences(userId) {
    const { data, error } = await supabase
        .from("user_display_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

    if (error) throw error
    if (data) return data

    const { data: created, error: createError } = await supabase
        .from("user_display_preferences")
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

export async function completeOnboarding() {
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
        .from("user_display_preferences")
        .upsert(
            {
                user_id: userId,
                has_completed_onboarding: true,
                updated_at: new Date().toISOString()
            },
            {
                onConflict: "user_id"
            }
        )
        .select()
        .single()

    if (error) throw error

    return data
}

export async function getPreferences() {
    const userId = await getCurrentUserId()
    const household = await getCurrentHousehold()

    const householdPreferences = await getHouseholdPreferences(userId, household.id)
    const userDisplayPreferences = await getUserDisplayPreferences(userId)

    return {
        ...householdPreferences,
        ...userDisplayPreferences
    }
}

export async function updatePreferences(updates) {
    const userId = await getCurrentUserId()
    const household = await getCurrentHousehold()

    const householdUpdates = pickFields(updates, householdPreferenceFields)
    const userUpdates = pickFields(updates, userPreferenceFields)

    let savedHouseholdPreferences = null
    let savedUserDisplayPreferences = null

    if (Object.keys(householdUpdates).length > 0) {
        const { data, error } = await supabase
            .from("household_preferences")
            .upsert(
                {
                    user_id: userId,
                    household_id: household.id,
                    ...householdUpdates,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: "household_id"
                }
            )
            .select()
            .single()

        if (error) throw error

        savedHouseholdPreferences = data
    }

    if (Object.keys(userUpdates).length > 0) {
        const { data, error } = await supabase
            .from("user_display_preferences")
            .upsert(
                {
                    user_id: userId,
                    ...userUpdates,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: "user_id"
                }
            )
            .select()
            .single()

        if (error) throw error

        savedUserDisplayPreferences = data
    }

    return {
        ...(savedHouseholdPreferences || {}),
        ...(savedUserDisplayPreferences || {})
    }
}