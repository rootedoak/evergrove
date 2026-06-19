import { supabase } from "../lib/supabase"

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; i += 1) {
        outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
}

async function getCurrentUserId() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user found.")

    return user.id
}

export function isPushSupported() {
    return (
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    )
}

export async function getNotificationPermission() {
    if (!("Notification" in window)) return "unsupported"

    return Notification.permission
}

export async function requestPushNotificationPermission() {
    if (!isPushSupported()) {
        return {
            supported: false,
            permission: "unsupported",
        }
    }

    const permission = await Notification.requestPermission()

    return {
        supported: true,
        permission,
    }
}

export async function subscribeToPushNotifications() {
    if (!isPushSupported()) {
        throw new Error("Push notifications are not supported in this browser.")
    }

    if (!VAPID_PUBLIC_KEY) {
        throw new Error("Missing VITE_VAPID_PUBLIC_KEY.")
    }

    const permission = await Notification.requestPermission()

    if (permission !== "granted") {
        return {
            subscribed: false,
            permission,
        }
    }

    const registration = await navigator.serviceWorker.ready

    const existingSubscription =
        await registration.pushManager.getSubscription()

    const subscription =
        existingSubscription ||
        await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

    const subscriptionJson = subscription.toJSON()
    const userId = await getCurrentUserId()

    const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
            {
                user_id: userId,
                endpoint: subscriptionJson.endpoint,
                p256dh: subscriptionJson.keys.p256dh,
                auth: subscriptionJson.keys.auth,
                user_agent: window.navigator.userAgent,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "endpoint",
            }
        )

    if (error) throw error

    return {
        subscribed: true,
        permission,
    }
}

export async function unsubscribeFromPushNotifications() {
    if (!isPushSupported()) return false

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) return false

    const endpoint = subscription.endpoint

    await subscription.unsubscribe()

    const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint)

    if (error) throw error

    return true
}

export async function sendTestPushNotification() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user found.")

    const response = await fetch("/api/send-test-push", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userId: user.id,
        }),
    })

    const responseText = await response.text()

    let result = {}

    try {
        result = responseText ? JSON.parse(responseText) : {}
    } catch {
        result = {
            error: responseText,
        }
    }

    if (!response.ok) {
        throw new Error(result.error || "Unable to send test push.")
    }

    return result
}

export async function sendPushNotificationToUser({
    userId,
    title,
    body,
    url = "/inbox",
}) {
    if (!userId || !title || !body) return null

    const response = await fetch("/api/send-push", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userId,
            title,
            body,
            url,
        }),
    })

    const responseText = await response.text()

    let result = {}

    try {
        result = responseText ? JSON.parse(responseText) : {}
    } catch {
        result = {
            error: responseText,
        }
    }

    if (!response.ok) {
        throw new Error(result.error || "Unable to send push notification.")
    }

    return result
}