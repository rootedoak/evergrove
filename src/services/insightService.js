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

export async function getCompletedInsightIds() {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("insight_completions")
        .select("insight_id, expires_at")
        .eq("household_id", household.id)

    if (error) throw error

    const now = new Date()

    return (data || [])
        .filter(row => !row.expires_at || new Date(row.expires_at) > now)
        .map(row => row.insight_id)
}

export async function completeInsight(insightId, payload = {}) {
    const household = await getCurrentHousehold()
    const user = await getCurrentUser()

    const { error } = await supabase
        .from("insight_completions")
        .upsert(
            {
                household_id: household.id,
                insight_id: insightId,
                completed_by: user.id,
                completed_at: new Date().toISOString(),
                expires_at: payload.expires_at || null,
                payload,
            },
            {
                onConflict: "household_id,insight_id",
            }
        )

    if (error) throw error
}