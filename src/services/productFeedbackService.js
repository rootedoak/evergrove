import { supabase } from "../lib/supabase"
import { ensureMyHousehold } from "./householdService"

async function getCurrentUser() {
    const {
        data: { user }
    } = await supabase.auth.getUser()

    return user
}

export async function submitProductFeedback({
    feedbackType,
    category,
    subject,
    message,
    appVersion,
    pagePath,
    source = "about"
}) {
    const household = await ensureMyHousehold()
    const user = await getCurrentUser()

    const { error } = await supabase
        .from("product_feedback")
        .insert({
            household_id: household.id,
            user_id: user.id,

            feedback_type: feedbackType,

            category,
            subject,
            message,

            app_version: appVersion,
            page_path: pagePath,

            source
        })

    if (error) throw error
}