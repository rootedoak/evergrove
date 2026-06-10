import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"
import { createTripInboxNotification } from "./tripInboxNotificationService"

async function getCurrentUserId() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user.id
}

export async function getTrips() {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("trips")
        .select(`
            *,
            trip_family_members (
                id,
                family_member_id,
                family_members (
                    id,
                    name,
                    avatar_emoji
                )
            )
        `)
        .eq("household_id", household.id)
        .order("start_date", { ascending: true })

    if (error) throw error

    return data || []
}

export async function createTrip(trip, familyMemberIds = []) {
    const userId = await getCurrentUserId()
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("trips")
        .insert([
            {
                ...trip,
                user_id: userId,
                household_id: household.id
            }
        ])
        .select()
        .single()

    if (error) throw error

    if (familyMemberIds.length > 0) {
        const attendeeRows = familyMemberIds.map(familyMemberId => ({
            trip_id: data.id,
            family_member_id: familyMemberId
        }))

        const { error: attendeeError } = await supabase
            .from("trip_family_members")
            .insert(attendeeRows)

        if (attendeeError) throw attendeeError
    }

    await createTripInboxNotification(data)

    return data
}

export async function updateTrip(id, updates, familyMemberIds = []) {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("trips")
        .update(updates)
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) throw error

    const { error: deleteError } = await supabase
        .from("trip_family_members")
        .delete()
        .eq("trip_id", id)

    if (deleteError) throw deleteError

    if (familyMemberIds.length > 0) {
        const attendeeRows = familyMemberIds.map(familyMemberId => ({
            trip_id: id,
            family_member_id: familyMemberId
        }))

        const { error: attendeeError } = await supabase
            .from("trip_family_members")
            .insert(attendeeRows)

        if (attendeeError) throw attendeeError
    }

    return data
}

export async function deleteTrip(id) {
    const household = await getCurrentHousehold()

    const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error
}