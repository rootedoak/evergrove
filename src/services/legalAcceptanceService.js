import { supabase } from "../lib/supabase"

export async function getRequiredLegalAcceptances() {
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) return []

    const {
        data: requiredDocuments,
        error: documentError
    } = await supabase
        .from("legal_document_versions")
        .select(`
            id,
            document_type,
            title,
            version,
            effective_date
        `)
        .eq("is_published", true)
        .eq("requires_acceptance", true)

    if (documentError) throw documentError

    if (!requiredDocuments?.length) {
        return []
    }

    const {
        data: acceptances,
        error: acceptanceError
    } = await supabase
        .from("user_legal_acceptances")
        .select("legal_document_version_id")
        .eq("user_id", user.id)

    if (acceptanceError) throw acceptanceError

    const acceptedDocumentIds = new Set(
        (acceptances ?? []).map(
            acceptance =>
                acceptance.legal_document_version_id
        )
    )

    return requiredDocuments.filter(
        document =>
            !acceptedDocumentIds.has(document.id)
    )
}

export async function getCurrentUserLegalStatus() {
    const missingDocuments =
        await getRequiredLegalAcceptances()

    return {
        isCurrent: missingDocuments.length === 0,
        missingDocuments,
        missingCount: missingDocuments.length
    }
}

export async function acceptLegalDocuments({
    documents,
    acceptanceMethod,
    adultEligibilityConfirmed = false,
    householdAuthorityConfirmed = false
}) {
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) {
        throw new Error("No authenticated user")
    }

    if (!documents?.length) {
        return
    }

    const rows = documents.map(document => ({
        user_id: user.id,
        legal_document_version_id: document.id,
        document_type: document.document_type,
        version: document.version,
        acceptance_method: acceptanceMethod,
        adult_eligibility_confirmed:
            adultEligibilityConfirmed,
        household_authority_confirmed:
            householdAuthorityConfirmed,
        accepted_at: new Date().toISOString()
    }))

    const { error } = await supabase
        .from("user_legal_acceptances")
        .upsert(rows, {
            onConflict:
                "user_id,legal_document_version_id",
            ignoreDuplicates: true
        })

    if (error) throw error
}

export async function recordLegalAttestations(
    attestations
) {
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) {
        throw new Error("No authenticated user")
    }

    if (!attestations?.length) {
        return
    }

    const rows = attestations.map(attestation => ({
        user_id: user.id,
        attestation_type: attestation.type,
        attestation_version: attestation.version,
        attested_at: new Date().toISOString()
    }))

    const { error } = await supabase
        .from("user_legal_attestations")
        .upsert(rows, {
            onConflict:
                "user_id,attestation_type,attestation_version",
            ignoreDuplicates: true
        })

    if (error) throw error
}