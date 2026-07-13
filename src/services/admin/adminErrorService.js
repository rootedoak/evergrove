import { supabase } from "../../lib/supabase"

export async function getApplicationErrors({
    days = 30,
    limit = 100
} = {}) {
    const since = new Date()

    since.setDate(since.getDate() - days)

    const { data, error } = await supabase
        .from("usage_events")
        .select(`
            id,
            household_id,
            user_id,
            event_type,
            entity_type,
            metadata,
            created_at
        `)
        .eq("event_type", "application_error")
        .gte("created_at", since.toISOString())
        .order("created_at", {
            ascending: false
        })
        .limit(limit)

    if (error) {
        throw error
    }

    return (data ?? []).map(event => ({
        id: event.id,
        householdId: event.household_id,
        userId: event.user_id,
        eventType: event.event_type,
        source: event.entity_type,
        message:
            event.metadata?.message ||
            "Unknown application error",
        pathname:
            event.metadata?.pathname ||
            "Unknown route",
        search:
            event.metadata?.search ||
            "",
        appVersion:
            event.metadata?.app_version ||
            "Unknown",
        componentStack:
            event.metadata?.component_stack ||
            "",
        occurredAt:
            event.metadata?.occurred_at ||
            event.created_at,
        createdAt: event.created_at
    }))
}