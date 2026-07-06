import { supabase } from "../lib/supabase"
import { ensureMyHousehold } from "./householdService"

import { sendPushNotificationToUser } from "./pushNotificationService"
import { createTask } from "./taskService"
import { createPersonalReminder } from "./personalReminderService"

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
        .or("status.is.null,status.eq.open,status.eq.unread")
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

    const inboxPayload = {
        household_id: payload.household_id || household.id,
        user_id: recipientUserId,
        title: payload.title,
        message: payload.message || null,
        item_type: itemType,
        related_type: payload.related_type || null,
        related_id: payload.related_id || null,
        due_date: payload.due_date || null,
        remind_at: payload.remind_at || null,
        created_by: user.id
    }

    const { error } = await supabase
        .from("personal_inbox_items")
        .insert(inboxPayload)

    if (error) {
        console.error("Inbox insert failed", error, inboxPayload)
        throw error
    }

    window.dispatchEvent(new Event("evergrovePersonalInboxUpdated"))

    try {
        await sendPushNotificationToUser({
            userId: recipientUserId,
            title: payload.title || "Evergrove",
            body: payload.message || "You have a new Evergrove update.",
            url: "/personal-inbox"
        })
    } catch (pushError) {
        console.error("Push notification failed:", pushError)
    }

    return true
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

export async function createThoughtInboxItem({ title, body }) {
    const { user, household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("personal_inbox_items")
        .insert({
            household_id: household.id,
            user_id: user.id,
            item_type: "thought",
            title: title?.trim() || "Untitled thought",
            body: body?.trim() || null,
            status: "open"
        })
        .select()
        .single()

    if (error) throw error

    return data
}

export async function archivePersonalInboxItem(id) {
    const { error } = await supabase
        .from("personal_inbox_items")
        .update({
            status: "archived",
            archived_at: new Date().toISOString()
        })
        .eq("id", id)

    if (error) throw error
}

export async function convertThoughtToTask(thought) {
    if (!thought) throw new Error("No thought provided.")

    const task = await createTask({
        title: thought.title || "Untitled task",
        description: thought.body || thought.message || null,
        due_date: null,
        status: "open"
    })

    await deletePersonalInboxItem(thought.id)

    return task
}

function getTodayString() {
    const today = new Date()

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-")
}

export async function convertThoughtToReminder(thought) {
    if (!thought) throw new Error("No thought provided.")

    const reminder = await createPersonalReminder({
        title: thought.title || "Untitled reminder",
        notes: thought.body || thought.message || null,
        frequency: "once",
        next_due: getTodayString()
    })

    await deletePersonalInboxItem(thought.id)

    return reminder
}