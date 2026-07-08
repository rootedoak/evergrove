import webpush from "web-push"

export function configureWebPush() {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.VITE_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

export async function sendPushToUser({
    supabase,
    userId,
    title,
    body,
    url = "/"
}) {
    const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", userId)

    if (error) throw error

    if (!subscriptions?.length) {
        return {
            sent: 0,
            failed: 0,
            expiredRemoved: 0
        }
    }

    const payload = JSON.stringify({ title, body, url })

    const results = await Promise.allSettled(
        subscriptions.map(subscription =>
            webpush.sendNotification(
                {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth
                    }
                },
                payload
            )
        )
    )

    const expiredSubscriptionIds = results
        .map((result, index) => ({
            result,
            subscription: subscriptions[index]
        }))
        .filter(({ result }) =>
            result.status === "rejected" &&
            [404, 410].includes(result.reason?.statusCode)
        )
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
        expiredRemoved: expiredSubscriptionIds.length
    }
}