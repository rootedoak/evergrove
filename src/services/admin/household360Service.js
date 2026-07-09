import { supabase } from "../../lib/supabase"

const featureMap = {
    task_created: "Tasks",
    task_updated: "Tasks",
    task_completed: "Tasks",
    task_deleted: "Tasks",

    calendar_event_created: "Calendar",
    calendar_event_updated: "Calendar",
    calendar_event_deleted: "Calendar",

    meal_created: "Meals",
    meal_updated: "Meals",
    meal_deleted: "Meals",
    meal_planned: "Meals",

    grocery_item_created: "Shopping",
    grocery_item_checked: "Shopping",
    grocery_item_unchecked: "Shopping",
    grocery_item_deleted: "Shopping",
    grocery_items_cleared: "Shopping",

    trip_created: "Trips",
    trip_updated: "Trips",
    trip_deleted: "Trips",

    school_item_created: "School",
    school_item_updated: "School",
    school_item_completed: "School",
    school_item_deleted: "School",

    document_uploaded: "Documents",
    document_deleted: "Documents",

    thought_created: "Thoughts",
    thought_archived: "Thoughts",
    thought_converted_to_task: "Thoughts",

    family_member_created: "Family",
    family_member_updated: "Family",
    household_invite_created: "Family",

    announcement_created: "Announcements",
    insight_completed: "Assistant"
}

export async function getHousehold360(householdId) {
    if (!householdId) {
        throw new Error("householdId is required")
    }

    const [
        directoryResult,
        supportResult,
        usageResult
    ] = await Promise.all([
        getHouseholdDirectory(householdId),
        getHouseholdSupportTickets(householdId),
        getHouseholdUsageEvents(householdId)
    ])

    const rows = directoryResult
    const firstRow = rows[0]

    if (!firstRow) return null

    const userIds = rows
        .map(row => row.user_id)
        .filter(Boolean)

    const preferencesResult = await getHouseholdUserPreferences(userIds)

    const preferencesByUserId = new Map(
        preferencesResult.map(preferences => [
            preferences.user_id,
            preferences
        ])
    )

    const members = rows
        .filter(row => row.family_member_id)
        .map(row => ({
            id: row.family_member_id,
            name: row.family_member_name,
            userId: row.user_id,
            email: row.email,
            preferences: row.user_id
                ? preferencesByUserId.get(row.user_id) ?? null
                : null
        }))

    const openTickets = supportResult.filter(ticket =>
        ["new", "reviewing", "planned"].includes(ticket.status)
    )

    const adoption = getFeatureAdoption(usageResult)

    return {
        household: {
            id: firstRow.household_id,
            name: firstRow.household_name,
            createdAt: firstRow.household_created_at,
            memberCount: firstRow.member_count ?? members.length,
            status: getHouseholdStatus(openTickets.length),
            openTicketCount: openTickets.length,
            ticketCount: supportResult.length,
            usageEventCount: usageResult.length,
            lastActiveAt: usageResult[0]?.created_at ?? null
        },
        members,
        supportTickets: supportResult,
        usageEvents: usageResult,
        adoption
    }
}

async function getHouseholdDirectory(householdId) {
    const { data, error } = await supabase
        .from("admin_household_directory")
        .select("*")
        .eq("household_id", householdId)
        .order("family_member_name")

    if (error) throw error

    return data ?? []
}

async function getHouseholdUserPreferences(userIds) {
    if (!userIds.length) return []

    const { data, error } = await supabase
        .from("user_display_preferences")
        .select("*")
        .in("user_id", userIds)

    if (error) throw error

    return data ?? []
}

async function getHouseholdSupportTickets(householdId) {
    const { data, error } = await supabase
        .from("product_feedback")
        .select(`
            id,
            ticket_number,
            subject,
            message,
            feedback_type,
            status,
            priority,
            created_at
        `)
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
        .limit(10)

    if (error) throw error

    return data ?? []
}

async function getHouseholdUsageEvents(householdId) {
    const { data, error } = await supabase
        .from("usage_events")
        .select(`
            id,
            event_type,
            entity_type,
            entity_id,
            created_at
        `)
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
        .limit(50)

    if (error) throw error

    return data ?? []
}

function getHouseholdStatus(openTicketCount) {
    if (openTicketCount >= 3) return "at-risk"
    if (openTicketCount >= 1) return "needs-attention"
    return "healthy"
}

function getFeatureAdoption(events) {
    const adoptedFeatures = new Set()

    for (const event of events ?? []) {
        const feature = featureMap[event.event_type]

        if (feature) {
            adoptedFeatures.add(feature)
        }
    }

    return Array.from(adoptedFeatures)
        .sort()
        .map(feature => ({
            feature,
            active: true
        }))
}