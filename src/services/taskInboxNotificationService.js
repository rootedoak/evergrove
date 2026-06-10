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

export async function createTaskInboxNotification(task) {
    const currentUser = await getCurrentUser()

    if (!currentUser) return
    if (!task?.family_member_id) return

    const assignedMember = await getFamilyMember(task.family_member_id)
    const creatorMember = await getCurrentUserFamilyMember(currentUser.id)

    if (!assignedMember) return

    const creatorName = creatorMember?.name || "Someone"
    const assignedName = assignedMember.name || "someone"

    const recipientUserIds = new Set()

    if (assignedMember.user_id) {
        recipientUserIds.add(assignedMember.user_id)
    }

    if (isChild(assignedMember)) {
        const adultUserIds = await getHouseholdAdultUsers(
            assignedMember.household_id || task.household_id
        )

        adultUserIds.forEach(userId => recipientUserIds.add(userId))
    }

    recipientUserIds.delete(currentUser.id)

    const message = isChild(assignedMember)
        ? `${creatorName} added "${task.title}" for ${assignedName}.`
        : `${creatorName} added "${task.title}" to ${assignedName}'s To-Do list.`

    for (const userId of recipientUserIds) {
        await createPersonalInboxItem({
            user_id: userId,
            title: "To-Do Added",
            message,
            item_type: "task",
            related_type: "task",
            related_id: task.id,
            due_date: task.due_date || null
        })
    }
}