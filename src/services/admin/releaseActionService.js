import { supabase } from "../../lib/supabase"

import { addFeedbackHistoryEvent } from "./productFeedbackHistoryService"

export async function createRelease({
    version,
    channel,
    title,
    summary
}) {
    const {
        data: { user }
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from("app_releases")
        .insert({
            version: version.trim(),
            channel,
            title: title.trim() || null,
            summary: summary.trim() || null,
            created_by: user.id
        })
        .select()
        .single()

    if (error) throw error

    return data
}

export async function linkFeedbackToRelease({
    feedbackId,
    releaseId,
    releaseLabel
}) {
    if (!feedbackId) throw new Error("Feedback id is required")
    if (!releaseId) throw new Error("Release id is required")

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error("No authenticated user")

    const { error } = await supabase
        .from("release_feedback")
        .insert({
            feedback_id: feedbackId,
            release_id: releaseId,
            linked_by: user.id
        })

    if (error) throw error

    await addFeedbackHistoryEvent({
        feedbackId,
        eventType: "release_linked",
        title: "Linked to Release",
        description: `Linked to ${releaseLabel || "a release"}.`,
        oldValue: null,
        newValue: releaseId,
        visibleToUser: false
    })
}