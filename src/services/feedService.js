import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"

async function getCurrentUser() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user found.")

    return user
}

export async function getFeedEvents(limit = 25) {
    const household = await getCurrentHousehold()

    const { data: feedEvents, error } = await supabase
        .from("household_feed")
        .select("*")
        .eq("household_id", household.id)
        .order("created_at", { ascending: false })
        .limit(limit)

    if (error) throw error

    const createdByIds = [
        ...new Set(
            (feedEvents || [])
                .map((event) => event.created_by)
                .filter(Boolean)
        ),
    ]

    if (createdByIds.length === 0) {
        return feedEvents || []
    }

    const { data: members, error: membersError } = await supabase
        .from("family_members")
        .select("id, user_id, name, avatar_emoji")
        .eq("household_id", household.id)
        .in("user_id", createdByIds)

    if (membersError) throw membersError

    const memberByUserId = new Map(
        (members || []).map((member) => [member.user_id, member])
    )

    return (feedEvents || []).map((event) => ({
        ...event,
        actor: memberByUserId.get(event.created_by) || null,
    }))
}

export async function createFeedEvent(event) {
    const household = await getCurrentHousehold()
    const user = await getCurrentUser()

    const { data, error } = await supabase
        .from("household_feed")
        .insert({
            household_id: household.id,
            created_by: user.id,
            event_type: event.event_type,
            title: event.title,
            description: event.description || null,
            reference_type: event.reference_type || null,
            reference_id: event.reference_id || null,
            metadata: event.metadata || {},
        })
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteFeedEvent(id) {
    const { error } = await supabase
        .from("household_feed")
        .delete()
        .eq("id", id)

    if (error) throw error
}