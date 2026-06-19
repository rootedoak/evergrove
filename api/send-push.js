import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

function getMissingEnvVars() {
    return [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "VITE_VAPID_PUBLIC_KEY",
        "VAPID_PRIVATE_KEY",
        "VAPID_SUBJECT",
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
                error: `Missing environment variables: ${missingEnvVars.join(", ")}`,
            })
        }

        const { userId, title, body, url = "/inbox" } = req.body

        if (!userId) {
            return res.status(400).json({ error: "Missing userId" })
        }

        if (!title || !body) {
            return res.status(400).json({ error: "Missing title or body" })
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

        const { data: subscriptions, error } = await supabase
            .from("push_subscriptions")
            .select("id, endpoint, p256dh, auth")
            .eq("user_id", userId)

        if (error) throw error

        if (!subscriptions?.length) {
            return res.status(200).json({
                sent: 0,
                failed: 0,
                expiredRemoved: 0,
                message: "No push subscriptions found.",
            })
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

        return res.status(200).json({
            sent: results.filter(result => result.status === "fulfilled").length,
            failed: results.filter(result => result.status === "rejected").length,
            expiredRemoved: expiredSubscriptionIds.length,
        })
    } catch (error) {
        console.error("send-push error:", error)

        return res.status(500).json({
            error: error.message || "Unable to send push notification.",
        })
    }
}