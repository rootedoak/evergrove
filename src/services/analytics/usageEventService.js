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