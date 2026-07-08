import { createClient } from "@supabase/supabase-js"

import {
    configureWebPush,
    sendPushToUser
} from "./lib/pushNotifications.js"

import { buildMorningBrief } from "./lib/morningBriefBuilder.js"

function getMissingEnvVars() {
    return [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "VITE_VAPID_PUBLIC_KEY",
        "VAPID_PRIVATE_KEY",
        "VAPID_SUBJECT",
        "MORNING_BRIEF_SECRET"
    ].filter(envVar => !process.env[envVar])
}

function todayInTimezone(timezone) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date())
}

function currentHourInTimezone(timezone) {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        hour12: false
    }).format(new Date())
}

function alreadySentToday(value, timezone) {
    if (!value) return false

    const sentDay = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date(value))

    return sentDay === todayInTimezone(timezone)
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

        const authHeader = req.headers.authorization || ""
        const expectedHeader = `Bearer ${process.env.MORNING_BRIEF_SECRET}`

        if (authHeader !== expectedHeader) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        configureWebPush()

        const { data: users, error: usersError } = await supabase
            .from("user_display_preferences")
            .select(`
                id,
                user_id,
                morning_brief_enabled,
                morning_brief_time,
                last_morning_brief_sent_at
            `)
            .eq("morning_brief_enabled", true)

        if (usersError) throw usersError

        let sentUsers = 0
        let skippedUsers = 0
        let failedUsers = 0
        let expiredRemoved = 0
        const errors = []

        for (const userPreference of users || []) {
            try {
                const { data: membership, error: membershipError } = await supabase
                    .from("household_members")
                    .select("household_id")
                    .eq("user_id", userPreference.user_id)
                    .limit(1)
                    .maybeSingle()

                if (membershipError) throw membershipError

                const householdId = membership?.household_id

                if (!householdId) {
                    skippedUsers += 1
                    continue
                }

                const { data: householdPreferences, error: householdPreferenceError } = await supabase
                    .from("household_preferences")
                    .select("timezone")
                    .eq("household_id", householdId)
                    .maybeSingle()

                if (householdPreferenceError) throw householdPreferenceError

                const timezone = householdPreferences?.timezone || "America/Chicago"

                if (alreadySentToday(userPreference.last_morning_brief_sent_at, timezone)) {
                    skippedUsers += 1
                    continue
                }

                const currentHour = currentHourInTimezone(timezone)
                const briefHour = String(userPreference.morning_brief_time || "07:00")
                    .slice(0, 2)

                if (currentHour !== briefHour) {
                    skippedUsers += 1
                    continue
                }

                const brief = await buildMorningBrief({
                    supabase,
                    userId: userPreference.user_id,
                    householdId,
                    timezone
                })

                const pushResult = await sendPushToUser({
                    supabase,
                    userId: userPreference.user_id,
                    title: brief.title,
                    body: brief.body,
                    url: brief.url
                })

                expiredRemoved += pushResult.expiredRemoved

                if (pushResult.sent > 0) {
                    await supabase
                        .from("user_display_preferences")
                        .update({
                            last_morning_brief_sent_at: new Date().toISOString()
                        })
                        .eq("id", userPreference.id)

                    sentUsers += 1
                } else {
                    skippedUsers += 1
                }
            } catch (error) {
                failedUsers += 1

                errors.push({
                    userId: userPreference.user_id,
                    error: error.message || "Unknown error"
                })
            }
        }

        return res.status(200).json({
            ok: true,
            checkedUsers: users?.length || 0,
            sentUsers,
            skippedUsers,
            failedUsers,
            expiredRemoved,
            errors
        })
    } catch (error) {
        console.error("send-morning-briefs error:", error)

        return res.status(500).json({
            error: error.message || "Unable to send morning briefs."
        })
    }
}