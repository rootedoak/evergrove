import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"
import { createCalendarEventInboxNotification } from "./calendarEventInboxNotificationService"

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
                household_id: household.id,
                session_frequency: event.session_frequency || "none",
                session_until: event.session_until || null
            }
        ])
        .select()
        .single()

    if (error) throw error

    await createCalendarEventInboxNotification(data)

    await trackUsageEvent({
        eventType: "calendar_event_created",
        entityType: "calendar_event",
        entityId: data.id,
        metadata: {
            source: "calendar",
            event_type: data.event_type,
            has_location: Boolean(data.location),
            has_time: Boolean(data.start_time),
            repeats: data.session_frequency !== "none",
            session_frequency: data.session_frequency
        }
    })

    return data
}

export async function deleteCalendarEvent(id) {
    const household = await getCurrentHousehold()

    await trackUsageEvent({
        eventType: "calendar_event_deleted",
        entityType: "calendar_event",
        entityId: id,
        metadata: {
            source: "calendar"
        }
    })

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
            updated_at: new Date().toISOString(),
            session_frequency: updates.session_frequency || "none",
            session_until: updates.session_until || null
        })
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) throw error

    await trackUsageEvent({
        eventType: "calendar_event_updated",
        entityType: "calendar_event",
        entityId: data.id,
        metadata: {
            source: "calendar",
            updated_fields: Object.keys(updates),
            event_type: data.event_type,
            session_frequency: data.session_frequency
        }
    })

    return data
}