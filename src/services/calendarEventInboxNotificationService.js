import { supabase } from "../lib/supabase"
import { createPersonalInboxItem } from "./personalInboxService"

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    return user
}

async function getCurrentUserFamilyMember(userId) {
    if (!userId) return null

    const { data, error } = await supabase
        .from("family_members")
        .select("id, name, household_id")
        .eq("user_id", userId)
        .maybeSingle()

    if (error) throw error

    return data
}

async function getHouseholdAdultUsers(householdId) {
    if (!householdId) return []

    const { data, error } = await supabase
        .from("family_members")
        .select("user_id")
        .eq("household_id", householdId)
        .not("user_id", "is", null)

    if (error) throw error

    return [...new Set((data || []).map(member => member.user_id).filter(Boolean))]
}

function shouldNotifyForCalendarEvent(event) {
    const type = String(event?.event_type || "").toLowerCase()

    return (
        type === "important date" ||
        type === "visitor" ||
        type === "family event" ||
        type === "holiday"
    )
}

export async function createCalendarEventInboxNotification(event) {
    const currentUser = await getCurrentUser()

    if (!currentUser) return
    if (!event?.household_id) return
    if (!shouldNotifyForCalendarEvent(event)) return

    const creatorMember = await getCurrentUserFamilyMember(currentUser.id)
    const creatorName = creatorMember?.name || "Someone"
    const eventTitle = event.title || "a calendar event"

    const adultUserIds = await getHouseholdAdultUsers(event.household_id)

    const recipientUserIds = new Set(adultUserIds)

    recipientUserIds.delete(currentUser.id)

    for (const userId of recipientUserIds) {
        await createPersonalInboxItem({
            user_id: userId,
            title: "Calendar Event Added",
            message: `${creatorName} added "${eventTitle}".`,
            item_type: "calendar_event",
            related_type: "calendar_event",
            related_id: event.id,
            due_date: event.start_date || null
        })
    }
}