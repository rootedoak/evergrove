import { createClient } from "@supabase/supabase-js"
import { runMorningBriefs } from "./lib/morningBriefRunner.js"

function getMissingEnvVars() {
    return [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "VITE_VAPID_PUBLIC_KEY",
        "VAPID_PRIVATE_KEY",
        "VAPID_SUBJECT",
        "CRON_SECRET"
    ].filter(envVar => !process.env[envVar])
}

export default async function handler(req, res) {
    if (!["GET", "POST"].includes(req.method)) {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        const missingEnvVars = getMissingEnvVars()

        if (missingEnvVars.length > 0) {
            return res.status(500).json({
                error: `Missing environment variables: ${missingEnvVars.join(", ")}`
            })
        }

        const authHeader = req.headers.authorization || ""
        const expectedHeader = `Bearer ${process.env.CRON_SECRET}`

        if (authHeader !== expectedHeader) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        const result = await runMorningBriefs({
            supabase,
            respectScheduledHour: true
        })

        return res.status(200).json(result)
    } catch (error) {
        console.error("send-morning-briefs error:", error)

        return res.status(500).json({
            error: error.message || "Unable to send morning briefs."
        })
    }
}