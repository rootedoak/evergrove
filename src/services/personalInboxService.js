import { supabase } from "../lib/supabase"
import { ensureMyHousehold } from "./householdService"

import { sendPushNotificationToUser } from "./pushNotificationService"

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

export async function getPersonalInboxItems() {
    const { user, household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("personal_inbox_items")
        .select("*")
        .eq("household_id", household.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    if (error) throw error

    return data || []
}

async function shouldCreateInboxItemForUser(userId, itemType) {
    const preferenceMap = {
        task: "inbox_tasks",
        activity: "inbox_activities",
        school: "inbox_school",
        calendar_event: "inbox_calendar",
        trip: "inbox_trips",
        reminder: "inbox_reminders"
    }

    const preferenceColumn = preferenceMap[itemType]

    if (!preferenceColumn) return true

    const { data, error } = await supabase
        .from("user_display_preferences")
        .select(preferenceColumn)
        .eq("user_id", userId)
        .maybeSingle()

    if (error) throw error

    if (!data) return true

    return data[preferenceColumn] !== false
}

export async function createPersonalInboxItem(payload) {
    const { user, household } = await getUserAndHousehold()

    const recipientUserId = payload.user_id || user.id
    const itemType = payload.item_type || "notification"

    const shouldCreate = await shouldCreateInboxItemForUser(
        recipientUserId,
        itemType
    )

    if (!shouldCreate) return null

    const { error } = await supabase
        .from("personal_inbox_items")
        .insert({
            household_id: household.id,
            user_id: recipientUserId,
            title: payload.title,
            message: payload.message || null,
            item_type: itemType,
            related_type: payload.related_type || null,
            related_id: payload.related_id || null,
            due_date: payload.due_date || null,
            remind_at: payload.remind_at || null,
            created_by: user.id
        })

    if (error) throw error

    try {
        console.log("Sending push notification", {
            userId: recipientUserId,
            title: payload.title,
            body: payload.message,
        })

        const pushResult = await sendPushNotificationToUser({
            userId: recipientUserId,
            title: payload.title || "Evergrove",
            body: payload.message || "You have a new Evergrove update.",
            url: "/inbox"
        })

        console.log("Push notification sent", pushResult)
    } catch (pushError) {
        console.error("Push notification failed:", pushError)
    }

    return null
}

export async function markInboxItemRead(id) {
    const { data, error } = await supabase
        .from("personal_inbox_items")
        .update({
            status: "read",
            read_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deletePersonalInboxItem(id) {
    const { error } = await supabase
        .from("personal_inbox_items")
        .delete()
        .eq("id", id)

    if (error) throw error
}