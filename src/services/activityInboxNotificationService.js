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

async function getFamilyMember(memberId) {
    if (!memberId) return null

    const { data, error } = await supabase
        .from("family_members")
        .select("id, name, role, member_type, user_id, household_id")
        .eq("id", memberId)
        .maybeSingle()

    if (error) throw error

    return data
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

function isChild(member) {
    const role = String(member?.role || "").toLowerCase()
    const memberType = String(member?.member_type || "").toLowerCase()

    return (
        role === "child" ||
        role === "kid" ||
        memberType === "child" ||
        memberType === "kid"
    )
}

export async function createActivityInboxNotification(activity) {
    const currentUser = await getCurrentUser()

    if (!currentUser) return
    if (!activity?.family_member_id) return

    const assignedMember = await getFamilyMember(activity.family_member_id)
    const creatorMember = await getCurrentUserFamilyMember(currentUser.id)

    if (!assignedMember) return

    const creatorName = creatorMember?.name || "Someone"
    const assignedName = assignedMember.name || "someone"
    const activityName = activity.event_name || activity.name || "an activity"

    const recipientUserIds = new Set()

    if (assignedMember.user_id) {
        recipientUserIds.add(assignedMember.user_id)
    }

    if (isChild(assignedMember)) {
        const adultUserIds = await getHouseholdAdultUsers(
            assignedMember.household_id || activity.household_id
        )

        adultUserIds.forEach(userId => recipientUserIds.add(userId))
    }

    recipientUserIds.delete(currentUser.id)

    const message = isChild(assignedMember)
        ? `${creatorName} added "${activityName}" for ${assignedName}.`
        : `${creatorName} added "${activityName}" to ${assignedName}'s activities.`

    for (const userId of recipientUserIds) {
        await createPersonalInboxItem({
            user_id: userId,
            title: "Activity Added",
            message,
            item_type: "activity",
            related_type: "activity",
            related_id: activity.id,
            due_date: activity.start_date || null
        })
    }
}