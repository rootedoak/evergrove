import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"
import { createActivityInboxNotification } from "./activityInboxNotificationService"
import { createFeedEvent } from "./feedService"
import { trackEvent } from "./analyticsService"

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

export async function getActivities() {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("activities")
        .select(`
            *,
            family_members (
                id,
                name,
                avatar_emoji
            )
        `)
        .eq("household_id", household.id)
        .order("created_at", { ascending: false })

    if (error) throw error

    return data || []
}

export async function createActivity(activity) {
    const userId = await getCurrentUserId()
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("activities")
        .insert([
            {
                ...activity,
                user_id: userId,
                household_id: household.id
            }
        ])
        .select()
        .single()

    if (error) throw error

    await createActivityInboxNotification(data)

    await createFeedEvent({
        event_type: "activity_created",
        title: data.name || "Activity added",
        description: "Family activity added",
        reference_type: "activity",
        reference_id: data.id,
        metadata: {
            activity_name: data.name || null,
            family_member_id: data.family_member_id || null,
            organization: data.organization || null,
            season: data.season || null,
        },
    })

    await trackEvent({
        eventName: "activity_created",
        eventType: "planning",
        source: "activities",
        metadata: {
            activity_id: data.id,
            family_member_id: data.family_member_id || null,
            organization: data.organization || null,
            season: data.season || null,
            has_registration_open_date: Boolean(data.registration_open_date),
            has_registration_close_date: Boolean(data.registration_close_date),
            has_start_date: Boolean(data.start_date),
            has_end_date: Boolean(data.end_date),
        },
    })

    return data
}

export async function updateActivity(id, updates) {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("activities")
        .update(updates)
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteActivity(id) {
    const household = await getCurrentHousehold()

    const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error
}

export async function markRegistrationTaskCreated(activityId) {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("activities")
        .update({
            registration_task_created: true
        })
        .eq("id", activityId)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}