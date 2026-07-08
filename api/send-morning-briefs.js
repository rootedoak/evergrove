import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

function getMissingEnvVars() {
    return [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "VITE_VAPID_PUBLIC_KEY",
        "VAPID_PRIVATE_KEY",
        "VAPID_SUBJECT",
        "MORNING_BRIEF_SECRET",
    ].filter(envVar => !process.env[envVar])
}

function todayInTimezone(timezone) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date())
}

function currentHourInTimezone(timezone) {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        hour12: false,
    }).format(new Date())
}

function alreadySentToday(value, timezone) {
    if (!value) return false

    const sentDay = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(value))

    return sentDay === todayInTimezone(timezone)
}

function buildBriefBody({ eventCount, taskCount, dinner }) {
    const parts = []

    if (eventCount > 0) {
        parts.push(`${eventCount} event${eventCount === 1 ? "" : "s"}`)
    }

    if (taskCount > 0) {
        parts.push(`${taskCount} To-Do${taskCount === 1 ? "" : "s"}`)
    }

    if (dinner) {
        parts.push(`dinner: ${dinner}`)
    }

    if (parts.length === 0) {
        return "No big plans yet. Evergrove is ready when you are."
    }

    return `Today: ${parts.join(", ")}.`
}

async function sendPushToUser({ supabase, userId, title, body, url }) {
    const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", userId)

    if (error) throw error

    if (!subscriptions?.length) {
        return {
            sent: 0,
            failed: 0,
            expiredRemoved: 0,
        }
    }

    const payload = JSON.stringify({
        title,
        body,
        url,
    })

    const results = await Promise.allSettled(
        subscriptions.map(subscription =>
            webpush.sendNotification(
                {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth,
                    },
                },
                payload
            )
        )
    )

    const expiredSubscriptionIds = results
        .map((result, index) => ({
            result,
            subscription: subscriptions[index],
        }))
        .filter(({ result }) => {
            return (
                result.status === "rejected" &&
                [404, 410].includes(result.reason?.statusCode)
            )
        })
        .map(({ subscription }) => subscription.id)

    if (expiredSubscriptionIds.length > 0) {
        await supabase
            .from("push_subscriptions")
            .delete()
            .in("id", expiredSubscriptionIds)
    }

    return {
        sent: results.filter(result => result.status === "fulfilled").length,
        failed: results.filter(result => result.status === "rejected").length,
        expiredRemoved: expiredSubscriptionIds.length,
    }
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        const missingEnvVars = getMissingEnvVars()

        if (missingEnvVars.length > 0) {
            return res.status(500).json({
                error: `Missing environment variables: ${missingEnvVars.join(", ")}`,
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

        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT,
            process.env.VITE_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        )

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

                const today = todayInTimezone(timezone)

                const [{ data: events }, { data: tasks }, { data: mealPlans }] =
                    await Promise.all([
                        supabase
                            .from("calendar_events")
                            .select("id")
                            .eq("household_id", householdId)
                            .lte("start_date", today)
                            .or(`end_date.gte.${today},end_date.is.null`),

                        supabase
                            .from("tasks")
                            .select("id")
                            .eq("household_id", householdId)
                            .eq("user_id", userPreference.user_id)
                            .eq("due_date", today)
                            .not("status", "in", '("complete","completed")'),

                        supabase
                            .from("meal_plans")
                            .select("meal_name")
                            .eq("household_id", householdId)
                            .eq("planned_date", today)
                            .limit(1),
                    ])

                const dinner = mealPlans?.[0]?.meal_name || null

                const pushResult = await sendPushToUser({
                    supabase,
                    userId: userPreference.user_id,
                    title: "Good morning from Evergrove 🌿",
                    body: buildBriefBody({
                        eventCount: events?.length || 0,
                        taskCount: tasks?.length || 0,
                        dinner,
                    }),
                    url: "/",
                })

                expiredRemoved += pushResult.expiredRemoved

                if (pushResult.sent > 0) {
                    await supabase
                        .from("user_display_preferences")
                        .update({
                            last_morning_brief_sent_at: new Date().toISOString(),
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
                    error: error.message || "Unknown error",
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
            errors,
        })
    } catch (error) {
        console.error("send-morning-briefs error:", error)

        return res.status(500).json({
            error: error.message || "Unable to send morning briefs.",
        })
    }
}