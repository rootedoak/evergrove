import { createClient } from "@supabase/supabase-js"

import {
    configureWebPush,
    sendPushToUser
} from "./lib/pushNotifications.js"

function getMissingEnvVars() {
    return [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "VITE_VAPID_PUBLIC_KEY",
        "VAPID_PRIVATE_KEY",
        "VAPID_SUBJECT"
    ].filter(envVar => !process.env[envVar])
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        const missingEnvVars = getMissingEnvVars()

        if (missingEnvVars.length > 0) {
            return res.status(500).json({
                error: `Missing environment variables: ${missingEnvVars.join(", ")}`
            })
        }

        const { userId } = req.body

        if (!userId) {
            return res.status(400).json({ error: "Missing userId" })
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        configureWebPush()

        const result = await sendPushToUser({
            supabase,
            userId,
            title: "Evergrove Test",
            body: "Push notifications are working.",
            url: "/"
        })

        return res.status(200).json(result)
    } catch (error) {
        console.error("send-test-push error:", error)

        return res.status(500).json({
            error: error.message || "Unable to send test push."
        })
    }
}