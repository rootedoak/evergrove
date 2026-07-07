import { supabase } from "../../lib/supabase"
import { ensureMyHousehold } from "../householdService"

export async function trackUsageEvent({
    eventType,
    entityType = null,
    entityId = null,
    metadata = {}
}) {
    try {
        const {
            data: { user }
        } = await supabase.auth.getUser()

        if (!user) return

        const household = await ensureMyHousehold()

        await supabase
            .from("usage_events")
            .insert({
                household_id: household.id,
                user_id: user.id,
                event_type: eventType,
                entity_type: entityType,
                entity_id: entityId,
                metadata
            })
    } catch (error) {
        // Analytics should never break the app
        console.error("Usage tracking failed", error)
    }
}

export async function trackDailyActive() {
    try {
        const {
            data: { user }
        } = await supabase.auth.getUser()

        if (!user) return

        const household = await ensureMyHousehold()

        const today = getLocalDateKey()

        const { data: existing, error: existingError } = await supabase
            .from("usage_events")
            .select("id")
            .eq("user_id", user.id)
            .eq("event_type", "daily_active")
            .eq("metadata->>local_date", today)
            .maybeSingle()

        if (existingError) throw existingError

        if (existing) return

        await supabase
            .from("usage_events")
            .insert({
                household_id: household.id,
                user_id: user.id,
                event_type: "daily_active",
                entity_type: "user",
                entity_id: user.id,
                metadata: {
                    source: "app_layout",
                    local_date: today
                }
            })
    } catch (error) {
        console.error("Daily active tracking failed", error)
    }
}

function getLocalDateKey(value = new Date()) {
    const date = new Date(value)

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-")
}