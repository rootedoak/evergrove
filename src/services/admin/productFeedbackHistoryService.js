import { supabase } from "../../lib/supabase"

export async function addFeedbackHistoryEvent({
    feedbackId,
    eventType,
    title,
    description,
    oldValue,
    newValue,
    visibleToUser = false
}) {
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError

    const { error } = await supabase
        .from("product_feedback_history")
        .insert({
            feedback_id: feedbackId,
            event_type: eventType,
            title,
            description,
            old_value: oldValue,
            new_value: newValue,
            created_by: user?.id ?? null,
            visible_to_user: visibleToUser
        })

    if (error) throw error
}

export async function getFeedbackHistory(feedbackId) {
    const { data, error } = await supabase
        .from("product_feedback_history")
        .select("*")
        .eq("feedback_id", feedbackId)
        .order("created_at", { ascending: true })

    if (error) throw error

    return data ?? []
}