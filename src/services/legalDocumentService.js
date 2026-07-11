import { supabase } from "../lib/supabase"

export async function getPublishedLegalDocuments() {
    const { data, error } = await supabase
        .from("legal_document_versions")
        .select(`
            id,
            document_type,
            title,
            version,
            effective_date,
            content,
            requires_acceptance
        `)
        .eq("is_published", true)
        .order("document_type")

    if (error) throw error

    return data ?? []
}

export async function getPublishedLegalDocument(
    documentType
) {
    const { data, error } = await supabase
        .from("legal_document_versions")
        .select(`
            id,
            document_type,
            title,
            version,
            effective_date,
            content,
            requires_acceptance
        `)
        .eq("document_type", documentType)
        .eq("is_published", true)
        .order("published_at", {
            ascending: false,
            nullsFirst: false
        })
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error(
            `Failed to load legal document: ${documentType}`,
            error
        )

        throw error
    }

    if (!data) {
        throw new Error(
            `No published legal document found for "${documentType}".`
        )
    }

    return data
}