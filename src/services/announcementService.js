import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"

import { createFeedEvent } from "./feedService"
import { trackEvent } from "./analyticsService"

async function getCurrentUser() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user found.")

    return user
}

export async function getAnnouncements() {
    const household = await getCurrentHousehold()

    const today = new Date().toISOString().slice(0, 10)

    const { data: announcements, error } = await supabase
        .from("family_announcements")
        .select("*")
        .eq("household_id", household.id)
        .or(`expires_at.is.null,expires_at.gte.${today}`)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })

    if (error) throw error

    const createdByIds = [
        ...new Set((announcements || []).map((item) => item.created_by)),
    ]

    if (createdByIds.length === 0) {
        return []
    }

    const { data: members, error: membersError } = await supabase
        .from("family_members")
        .select("id, user_id, name, avatar_emoji, avatar_url")
        .eq("household_id", household.id)
        .in("user_id", createdByIds)

    if (membersError) throw membersError

    const memberByUserId = new Map(
        (members || []).map((member) => [member.user_id, member])
    )

    return (announcements || []).map((announcement) => ({
        ...announcement,
        posted_by: memberByUserId.get(announcement.created_by) || null,
    }))
}

export async function createAnnouncement(announcement) {
    const user = await getCurrentUser()
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("family_announcements")
        .insert({
            household_id: household.id,
            created_by: user.id,
            title: announcement.title,
            message: announcement.message || null,
            is_pinned: Boolean(announcement.is_pinned),
            expires_at: announcement.expires_at || null,
        })
        .select()
        .single()

    if (error) throw error

    await createFeedEvent({
        event_type: "announcement_posted",
        title: data.title,
        description: "New family announcement",
        reference_type: "announcement",
        reference_id: data.id,
        metadata: {
            announcement_title: data.title,
        },
    })

    await trackEvent({
        eventName: "announcement_created",
        eventType: "engagement",
        source: "announcements",
        metadata: {
            announcement_id: data.id,
            is_pinned: Boolean(data.is_pinned),
            has_expiration: Boolean(data.expires_at),
        },
    })

    const { data: member, error: memberError } = await supabase
        .from("family_members")
        .select("id, user_id, name, avatar_emoji, avatar_url")
        .eq("household_id", household.id)
        .eq("user_id", user.id)
        .single()

    if (memberError) throw memberError

    return {
        ...data,
        posted_by: member,
    }
}

export async function updateAnnouncement(id, updates) {
    const { data, error } = await supabase
        .from("family_announcements")
        .update({
            title: updates.title,
            message: updates.message || null,
            is_pinned: Boolean(updates.is_pinned),
            expires_at: updates.expires_at || null,
        })
        .eq("id", id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteAnnouncement(id) {
    const { data, error } = await supabase
        .from("family_announcements")
        .delete()
        .eq("id", id)
        .select("id")

    if (error) throw error

    if (!data || data.length === 0) {
        throw new Error("Announcement was not deleted. Check RLS delete policy or announcement id.")
    }

    return data[0]
}