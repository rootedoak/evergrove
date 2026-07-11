import { supabase } from "../../lib/supabase"

export async function getUsers(search = "") {
    let query = supabase
        .from("admin_user_summary")
        .select("*")
        .order("name", { ascending: true })

    if (search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`)
    }

    const { data, error } = await query

    if (error) throw error

    const users = data ?? []
    const userIds = users
        .map(user => user.user_id)
        .filter(Boolean)

    if (userIds.length === 0) return users

    const { data: preferences, error: preferencesError } = await supabase
        .from("user_display_preferences")
        .select("*")
        .in("user_id", userIds)

    if (preferencesError) throw preferencesError

    const preferencesByUserId = new Map(
        (preferences ?? []).map(row => [row.user_id, row])
    )

    return users.map(user => ({
        ...user,
        preferences: preferencesByUserId.get(user.user_id) ?? null,
        has_completed_onboarding:
            preferencesByUserId.get(user.user_id)?.has_completed_onboarding ?? null,
        has_completed_guided_walkthrough:
            preferencesByUserId.get(user.user_id)?.has_completed_guided_walkthrough ?? null
    }))
}

export async function getUserDetail(userId) {
    const { data, error } = await supabase
        .from("admin_user_summary")
        .select("*")
        .eq("user_id", userId)
        .single()

    if (error) throw error

    return data
}

export async function getUserSupportTickets(userId) {
    const { data, error } = await supabase
        .from("product_feedback")
        .select(`
            id,
            ticket_number,
            feedback_type,
            status,
            priority,
            subject,
            message,
            created_at
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)

    if (error) throw error

    return data ?? []
}

export async function getUserUsageEvents(userId) {
    const { data, error } = await supabase
        .from("usage_events")
        .select(`
            id,
            event_type,
            entity_type,
            entity_id,
            metadata,
            created_at
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25)

    if (error) throw error

    return data ?? []
}

export async function getUserPreferences(userId) {
    if (!userId) {
        throw new Error("userId is required")
    }

    const { data, error } = await supabase
        .from("user_display_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

    if (error) throw error

    return data
}

export async function searchUsers(search = "") {
    return getUsers(search)
}

export async function getUserAdoptionEvents(userId) {
    if (!userId) {
        throw new Error("userId is required")
    }

    const since = new Date()
    since.setDate(since.getDate() - 60)

    const { data, error } = await supabase
        .from("usage_events")
        .select(`
            id,
            event_type,
            created_at
        `)
        .eq("user_id", userId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })

    if (error) throw error

    return data ?? []
}

export async function getUserLegalStatus(userId) {
    if (!userId) {
        throw new Error("userId is required")
    }

    const {
        data: requiredDocuments,
        error: documentsError
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
        .order("document_type")

    if (documentsError) throw documentsError

    const {
        data: acceptances,
        error: acceptancesError
    } = await supabase
        .from("user_legal_acceptances")
        .select(`
            id,
            legal_document_version_id,
            document_type,
            version,
            acceptance_method,
            adult_eligibility_confirmed,
            household_authority_confirmed,
            accepted_at
        `)
        .eq("user_id", userId)
        .order("accepted_at", {
            ascending: false
        })

    if (acceptancesError) throw acceptancesError

    const {
        data: attestations,
        error: attestationsError
    } = await supabase
        .from("user_legal_attestations")
        .select(`
            id,
            attestation_type,
            attestation_version,
            attested_at
        `)
        .eq("user_id", userId)
        .order("attested_at", {
            ascending: false
        })

    if (attestationsError) throw attestationsError

    const required = requiredDocuments ?? []
    const accepted = acceptances ?? []

    const acceptanceByDocumentId = new Map(
        accepted.map(acceptance => [
            acceptance.legal_document_version_id,
            acceptance
        ])
    )

    const acceptedDocuments = required
        .filter(document =>
            acceptanceByDocumentId.has(document.id)
        )
        .map(document => ({
            ...document,
            acceptance:
                acceptanceByDocumentId.get(document.id)
        }))

    const missingDocuments = required.filter(
        document =>
            !acceptanceByDocumentId.has(document.id)
    )

    const latestAcceptance =
        accepted.length > 0
            ? accepted[0]
            : null

    const adultEligibilityConfirmed =
        accepted.some(
            acceptance =>
                acceptance.adult_eligibility_confirmed
        ) ||
        (attestations ?? []).some(
            attestation =>
                attestation.attestation_type ===
                "adult_account_eligibility"
        )

    return {
        isCurrent:
            required.length > 0 &&
            missingDocuments.length === 0,

        acceptedCount:
            acceptedDocuments.length,

        requiredCount:
            required.length,

        adultEligibilityConfirmed,

        acceptedDocuments,
        missingDocuments,
        attestations: attestations ?? [],

        latestAcceptanceAt:
            latestAcceptance?.accepted_at ?? null,

        latestAcceptanceMethod:
            latestAcceptance?.acceptance_method ?? null
    }
}

const LEGAL_DOCUMENT_LABELS = {
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    beta: "Beta Program Agreement",
    ai_automation: "AI & Automation",
    acceptable_use: "Acceptable Use Policy"
}

const ACCEPTANCE_METHOD_LABELS = {
    signup: "Account Creation",
    in_app_gate: "In-App Confirmation",
    admin: "Recorded by Admin"
}