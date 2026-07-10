import { supabase } from "../../lib/supabase"

async function getAccessToken() {
    const {
        data: { session },
        error
    } = await supabase.auth.getSession()

    if (error) throw error

    const accessToken =
        session?.access_token

    if (!accessToken) {
        throw new Error(
            "No authenticated session"
        )
    }

    return accessToken
}

export async function getAdminLegalSummary() {
    const accessToken =
        await getAccessToken()

    const response = await fetch(
        "/api/admin/legal-summary",
        {
            method: "GET",
            headers: {
                Authorization:
                    `Bearer ${accessToken}`
            }
        }
    )

    const result = await response.json()

    if (!response.ok) {
        throw new Error(
            result?.error ??
            "Unable to load Trust Center data."
        )
    }

    return result
}