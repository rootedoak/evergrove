import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"
import { createSchoolInboxNotification } from "./schoolInboxNotificationService"
import { createFeedEvent } from "./feedService"
import { trackUsageEvent } from "./analytics/usageEventService"

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

    await createSchoolInboxNotification(data)

    await createFeedEvent({
        event_type: "school_item_created",
        title: data.title || "School item added",
        description: data.due_date
            ? `School item due ${data.due_date}`
            : "School item added",
        reference_type: "school_item",
        reference_id: data.id,
        metadata: {
            school_item_id: data.id,
            title: data.title || null,
            family_member_id: data.family_member_id || null,
            due_date: data.due_date || null,
            type: data.type || null,
        },
    })

    await trackUsageEvent({
        eventType: "school_item_created",
        entityType: "school_item",
        entityId: data.id,
        metadata: {
            source: "school",
            family_member_id: data.family_member_id || null,
            due_date: data.due_date || null,
            type: data.type || null,
            has_due_date: Boolean(data.due_date)
        }
    })

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

    await trackUsageEvent({
        eventType: updates.completed
            ? "school_item_completed"
            : "school_item_updated",
        entityType: "school_item",
        entityId: data.id,
        metadata: {
            source: "school",
            updated_fields: Object.keys(updates),
            family_member_id: data.family_member_id || null,
            due_date: data.due_date || null,
            type: data.type || null
        }
    })

    return data
}

export async function deleteSchoolItem(id) {
    const household = await getCurrentHousehold()

    await trackUsageEvent({
        eventType: "school_item_deleted",
        entityType: "school_item",
        entityId: id,
        metadata: {
            source: "school"
        }
    })

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