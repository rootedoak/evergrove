import { supabase } from "../lib/supabase"

export async function sendWelcomeEmail() {
    const {
        data: { session },
        error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) throw sessionError
    if (!session?.access_token) {
        throw new Error("No authenticated session.")
    }

    const response = await fetch("/api/send-welcome-email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
        }
    })

    const result = await response.json()

    if (!response.ok) {
        throw new Error(
            result.error ||
            "Could not send welcome email."
        )
    }

    return result
}