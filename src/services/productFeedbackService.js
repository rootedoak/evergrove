import { supabase } from "../lib/supabase"
import { ensureMyHousehold } from "./householdService"

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user
}

function sanitizeFileName(fileName) {
    return String(fileName)
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, "-")
}

export async function submitProductFeedback({
    feedbackType,
    category,
    subject,
    message,
    appVersion,
    pagePath,
    source = "about",
    attachment = null
}) {
    const household = await ensureMyHousehold()
    const user = await getCurrentUser()

    const {
        data: feedback,
        error: feedbackError
    } = await supabase
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
        .select()
        .single()

    if (feedbackError) throw feedbackError

    if (!attachment) {
        return feedback
    }

    const safeFileName = sanitizeFileName(
        attachment.name
    )

    const attachmentPath = [
        user.id,
        feedback.id,
        safeFileName
    ].join("/")

    const { error: uploadError } =
        await supabase.storage
            .from("feedback-attachments")
            .upload(
                attachmentPath,
                attachment,
                {
                    contentType:
                        attachment.type ||
                        "application/octet-stream",
                    upsert: false
                }
            )

    if (uploadError) {
        throw uploadError
    }

    const {
        data: updatedFeedback,
        error: updateError
    } = await supabase
        .from("product_feedback")
        .update({
            attachment_path: attachmentPath,
            attachment_name: attachment.name,
            attachment_type: attachment.type,
            attachment_size: attachment.size
        })
        .eq("id", feedback.id)
        .select()
        .single()

    if (updateError) {
        await supabase.storage
            .from("feedback-attachments")
            .remove([attachmentPath])

        throw updateError
    }

    return updatedFeedback
}