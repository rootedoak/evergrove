import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"

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

    return data
}

export async function deleteDocument(document) {
    const household = await getCurrentHousehold()

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