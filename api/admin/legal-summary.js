import { createClient } from "@supabase/supabase-js"

import { requireAdminUser } from "../lib/adminAuth.js"

function createAdminClient() {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
        )
    }

    return createClient(
        supabaseUrl,
        serviceRoleKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        }
    )
}

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        })
    }

    try {
        await requireAdminUser(req)

        const supabase = createAdminClient()

        const {
            data: documents,
            error: documentsError
        } = await supabase
            .from("legal_document_versions")
            .select(`
                id,
                document_type,
                title,
                version,
                effective_date,
                is_published,
                requires_acceptance,
                published_at,
                created_at
            `)
            .order("document_type")
            .order("created_at", {
                ascending: false
            })

        if (documentsError) {
            throw documentsError
        }

        const {
            data: users,
            error: usersError
        } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000
        })

        if (usersError) {
            throw usersError
        }

        const userList = users?.users ?? []

        const {
            data: acceptances,
            error: acceptancesError
        } = await supabase
            .from("user_legal_acceptances")
            .select(`
                user_id,
                legal_document_version_id,
                document_type,
                version,
                accepted_at,
                acceptance_method,
                adult_eligibility_confirmed
            `)
            .order("accepted_at", {
                ascending: false
            })

        if (acceptancesError) {
            throw acceptancesError
        }

        const publishedDocuments =
            (documents ?? []).filter(
                document => document.is_published
            )

        const requiredDocuments =
            publishedDocuments.filter(
                document =>
                    document.requires_acceptance
            )

        const acceptedDocumentIdsByUser =
            new Map()

        for (const acceptance of acceptances ?? []) {
            if (
                !acceptedDocumentIdsByUser.has(
                    acceptance.user_id
                )
            ) {
                acceptedDocumentIdsByUser.set(
                    acceptance.user_id,
                    new Set()
                )
            }

            acceptedDocumentIdsByUser
                .get(acceptance.user_id)
                .add(
                    acceptance.legal_document_version_id
                )
        }

        const requiredDocumentIds =
            requiredDocuments.map(
                document => document.id
            )

        const userStatuses = userList.map(user => {
            const acceptedIds =
                acceptedDocumentIdsByUser.get(
                    user.id
                ) ?? new Set()

            const missingDocuments =
                requiredDocuments.filter(
                    document =>
                        !acceptedIds.has(document.id)
                )

            return {
                userId: user.id,
                email: user.email,
                createdAt: user.created_at,
                lastSignInAt:
                    user.last_sign_in_at ?? null,
                acceptedRequiredCount:
                    requiredDocumentIds.filter(
                        documentId =>
                            acceptedIds.has(documentId)
                    ).length,
                requiredCount:
                    requiredDocuments.length,
                fullyAccepted:
                    missingDocuments.length === 0,
                missingDocuments:
                    missingDocuments.map(
                        document => ({
                            id: document.id,
                            title: document.title,
                            documentType:
                                document.document_type,
                            version: document.version
                        })
                    )
            }
        })

        const fullyAcceptedUsers =
            userStatuses.filter(
                user => user.fullyAccepted
            )

        const pendingUsers =
            userStatuses.filter(
                user => !user.fullyAccepted
            )

        const documentSummaries =
            publishedDocuments.map(document => {
                const documentAcceptances =
                    (acceptances ?? []).filter(
                        acceptance =>
                            acceptance
                                .legal_document_version_id ===
                            document.id
                    )

                const acceptedUserIds =
                    new Set(
                        documentAcceptances.map(
                            acceptance =>
                                acceptance.user_id
                        )
                    )

                return {
                    ...document,
                    acceptanceCount:
                        acceptedUserIds.size,
                    pendingCount:
                        document.requires_acceptance
                            ? Math.max(
                                userList.length -
                                acceptedUserIds.size,
                                0
                            )
                            : 0
                }
            })

        return res.status(200).json({
            summary: {
                totalUsers: userList.length,
                requiredDocumentCount:
                    requiredDocuments.length,
                fullyAcceptedUsers:
                    fullyAcceptedUsers.length,
                pendingUsers: pendingUsers.length
            },
            documents: documentSummaries,
            users: userStatuses,
            pendingUsers,
            recentAcceptances:
                (acceptances ?? []).slice(0, 25)
        })
    } catch (error) {
        console.error(
            "Admin legal summary failed:",
            error
        )

        return res.status(
            error?.statusCode ?? 500
        ).json({
            error:
                error?.message ??
                "Unable to load legal summary."
        })
    }
}