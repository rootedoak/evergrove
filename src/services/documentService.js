import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"
import { trackUsageEvent } from "./analytics/usageEventService"

const DOCUMENT_BUCKET = "family-documents"

async function getCurrentUserId() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user.id
}

export async function getDocuments() {
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("documents")
        .select(`
            *,
            family_members (
                id,
                name,
                avatar_emoji
            ),
            school_items (
                id,
                title
            ),
            activities (
                id,
                name
            )
        `)
        .eq("household_id", household.id)
        .order("created_at", { ascending: false })

    if (error) throw error

    return data || []
}

export async function uploadDocument({
    file,
    title,
    category,
    family_member_id,
    school_item_id,
    activity_id,
    notes
}) {
    const userId = await getCurrentUserId()
    const household = await getCurrentHousehold()

    if (!file) {
        throw new Error("No file selected")
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `${household.id}/${Date.now()}-${safeFileName}`

    const { error: uploadError } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data, error } = await supabase
        .from("documents")
        .insert([
            {
                user_id: userId,
                household_id: household.id,
                title,
                category,
                family_member_id: family_member_id || null,
                school_item_id: school_item_id || null,
                activity_id: activity_id || null,
                file_path: filePath,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                notes
            }
        ])
        .select()
        .single()

    if (error) throw error

    await trackUsageEvent({
        eventType: "document_uploaded",
        entityType: "document",
        entityId: data.id,
        metadata: {
            source: "documents",
            category: data.category || null,
            file_type: data.file_type || null,
            file_size: data.file_size || null,
            has_family_member: Boolean(data.family_member_id),
            has_school_item: Boolean(data.school_item_id),
            has_activity: Boolean(data.activity_id)
        }
    })

    return data
}

export async function deleteDocument(document) {
    const household = await getCurrentHousehold()

    await trackUsageEvent({
        eventType: "document_deleted",
        entityType: "document",
        entityId: document.id,
        metadata: {
            source: "documents",
            category: document.category || null,
            file_type: document.file_type || null
        }
    })

    const { error: storageError } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .remove([document.file_path])

    if (storageError) throw storageError

    const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", document.id)
        .eq("household_id", household.id)

    if (error) throw error
}

export async function getDocumentSignedUrl(filePath) {
    const { data, error } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(filePath, 60)

    if (error) throw error

    return data.signedUrl
}