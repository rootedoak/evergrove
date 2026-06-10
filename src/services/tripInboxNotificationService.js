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

export async function createTripInboxNotification(trip) {
    const currentUser = await getCurrentUser()

    if (!currentUser) return
    if (!trip?.household_id) return

    const creatorMember = await getCurrentUserFamilyMember(currentUser.id)
    const creatorName = creatorMember?.name || "Someone"
    const tripName = trip.name || "a trip"

    const adultUserIds = await getHouseholdAdultUsers(trip.household_id)
    const recipientUserIds = new Set(adultUserIds)

    recipientUserIds.delete(currentUser.id)

    const destinationText = trip.destination
        ? ` to ${trip.destination}`
        : ""

    for (const userId of recipientUserIds) {
        await createPersonalInboxItem({
            user_id: userId,
            title: "Trip Added",
            message: `${creatorName} added "${tripName}"${destinationText}.`,
            item_type: "trip",
            related_type: "trip",
            related_id: trip.id,
            due_date: trip.start_date || null
        })
    }
}