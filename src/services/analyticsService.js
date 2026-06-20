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

export async function trackEvent({
    eventName,
    eventType = null,
    source = null,
    metadata = {},
}) {
    try {
        const user = await getCurrentUser()
        const household = await getCurrentHousehold()

        const { error } = await supabase
            .from("analytics_events")
            .insert({
                household_id: household.id,
                user_id: user.id,
                event_name: eventName,
                event_type: eventType,
                source,
                metadata,
            })

        if (error) throw error
    } catch (error) {
        console.error("Analytics tracking failed:", error)
    }
}

export async function getAnalyticsSummary(days = 30) {
    const household = await getCurrentHousehold()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("household_id", household.id)
        .gte("created_at", startDate.toISOString())

    if (error) throw error

    return data || []
}

export async function getAnalyticsMetrics(days = 30) {
    const events = await getAnalyticsSummary(days)

    return {
        totalEvents: events.length,

        announcementsCreated: events.filter(
            event => event.event_name === "announcement_created"
        ).length,

        tasksCreated: events.filter(
            event => event.event_name === "task_created"
        ).length,

        tasksCompleted: events.filter(
            event => event.event_name === "task_completed"
        ).length,

        activitiesCreated: events.filter(
            event => event.event_name === "activity_created"
        ).length,

        tripsCreated: events.filter(
            event => event.event_name === "trip_created"
        ).length,

        mealsPlanned: events.filter(
            event => event.event_name === "meal_planned"
        ).length,
    }
}