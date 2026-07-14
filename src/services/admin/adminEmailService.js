import { supabase } from "../../lib/supabase"

export async function sendAdminTestEmail({
    to,
    subject,
    html,
    templateId = null
}) {
    const {
        data: { session },
        error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) {
        throw sessionError
    }

    if (!session?.access_token) {
        throw new Error(
            "You must be signed in to send a test email."
        )
    }

    const response = await fetch(
        "/api/send-test-email",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                to,
                subject,
                html,
                templateId
            })
        }
    )

    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
        throw new Error(
            result.error ||
            "Unable to send test email."
        )
    }

    return result
}