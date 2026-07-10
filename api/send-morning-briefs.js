import { randomUUID } from "node:crypto"
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
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET")

        return res.status(405).json({
            error: "Method not allowed"
        })
    }

    const runId = randomUUID()
    const startedAt = new Date().toISOString()

    try {
        console.log("Morning brief cron started", {
            runId,
            startedAt
        })

        const missingEnvVars = getMissingEnvVars()

        if (missingEnvVars.length > 0) {
            console.error("Morning brief cron missing environment variables", {
                runId,
                missingEnvVars
            })

            return res.status(500).json({
                success: false,
                runId,
                error: `Missing environment variables: ${missingEnvVars.join(", ")}`
            })
        }

        const authHeader = req.headers.authorization || ""
        const expectedHeader = `Bearer ${process.env.CRON_SECRET}`

        if (authHeader !== expectedHeader) {
            console.warn("Unauthorized morning brief cron request", {
                runId
            })

            return res.status(401).json({
                success: false,
                runId,
                error: "Unauthorized"
            })
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            }
        )

        const result = await runMorningBriefs({
            supabase,
            respectScheduledHour: true,
            ignoreAlreadySentToday: false
        })

        const completedAt = new Date().toISOString()

        console.log("Morning brief cron completed", {
            runId,
            startedAt,
            completedAt,
            result
        })

        return res.status(200).json({
            success: true,
            runId,
            startedAt,
            completedAt,
            ...result
        })
    } catch (error) {
        const failedAt = new Date().toISOString()

        console.error("Morning brief cron failed", {
            runId,
            startedAt,
            failedAt,
            message: error.message,
            stack: error.stack
        })

        return res.status(500).json({
            success: false,
            runId,
            startedAt,
            failedAt,
            error: error.message || "Unable to send morning briefs."
        })
    }
}