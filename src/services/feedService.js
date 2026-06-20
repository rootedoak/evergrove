import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"
import { createPersonalInboxItem } from "./personalInboxService"

async function getCurrentUser() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user found.")

    return user
}

function getInboxMessage(event, actorName = "Someone") {
    switch (event.event_type) {
        case "announcement_posted":
            return {
                title: `${actorName} posted an announcement`,
                message: event.title,
            }

        case "task_completed":
            return {
                title: `${actorName} completed a to-do`,
                message: event.title,
            }

        case "trip_created":
            return {
                title: `${actorName} added a trip`,
                message: event.title,
            }

        case "activity_created":
            return {
                title: `${actorName} added an activity`,
                message: event.title,
            }

        case "meal_planned":
            return {
                title: `${actorName} planned a meal`,
                message: event.title,
            }

        case "school_item_created":
            return {
                title: `${actorName} added a school item`,
                message: event.title,
            }

        default:
            return {
                title: "New household activity",
                message: event.title,
            }
    }
}

async function getActorName(householdId, userId) {
    if (!userId) return "Someone"

    const { data, error } = await supabase
        .from("family_members")
        .select("name")
        .eq("household_id", householdId)
        .eq("user_id", userId)
        .maybeSingle()

    if (error) throw error

    return data?.name || "Someone"
}

async function notifyHouseholdMembers(feedEvent, household, actorUser) {
    const { data: householdMembers, error } = await supabase
        .from("family_members")
        .select("id, user_id, name, role")
        .eq("household_id", household.id)
        .not("user_id", "is", null)

    if (error) throw error

    const actorName = await getActorName(household.id, actorUser.id)
    const inboxMessage = getInboxMessage(feedEvent, actorName)

    const recipientUserIds = [
        ...new Set(
            (householdMembers || [])
                .map(member => member.user_id)
                .filter(Boolean)
                .filter(userId => userId !== actorUser.id)
        ),
    ]

    for (const recipientUserId of recipientUserIds) {
        await createPersonalInboxItem({
            user_id: recipientUserId,
            title: inboxMessage.title,
            message: inboxMessage.message,
            item_type: "feed",
            related_type: feedEvent.reference_type || "household_feed",
            related_id: feedEvent.reference_id || feedEvent.id,
        })
    }
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

    try {
        if (event.notify !== false) {
            await notifyHouseholdMembers(data, household, user)
        }
    } catch (notificationError) {
        console.error("Feed inbox notification failed:", notificationError)
    }

    return data
}

export async function deleteFeedEvent(id) {
    const { error } = await supabase
        .from("household_feed")
        .delete()
        .eq("id", id)

    if (error) throw error
}