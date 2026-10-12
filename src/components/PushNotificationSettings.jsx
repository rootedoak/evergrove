
import { useEffect, useState } from "react"
import {
    getNotificationPermission,
    getPushSubscriptionStatus,
    isPushSupported,
    sendTestPushNotification,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
} from "../services/pushNotificationService"

export default function PushNotificationSettings() {
    const [supported, setSupported] = useState(false)
    const [permission, setPermission] = useState("default")
    const [subscribed, setSubscribed] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")

    useEffect(() => {
        let active = true

        async function loadStatus() {
            const pushSupported = isPushSupported()
            if (!active) return

            setSupported(pushSupported)

            if (pushSupported) {
                try {
                    const [currentPermission, currentSubscription] =
                        await Promise.all([
                            getNotificationPermission(),
                            getPushSubscriptionStatus(),
                        ])

                    if (active) {
                        setPermission(currentPermission)
                        setSubscribed(currentSubscription)
                    }
                } catch (error) {
                    console.error(error)
                    if (active) {
                        setMessage("Unable to check push notification status.")
                    }
                }
            }

            if (active) setLoading(false)
        }

        loadStatus()

        return () => {
            active = false
        }
    }, [])

    async function handleEnable() {
        setSaving(true)
        setMessage("")

        try {
            const result = await subscribeToPushNotifications()

            setPermission(result.permission)
            setSubscribed(await getPushSubscriptionStatus())

            setMessage(
                result.subscribed
                    ? "Push notifications are enabled on this device."
                    : "Push notifications were not enabled."
            )
        } catch (error) {
            console.error(error)
            setMessage(error.message || "Unable to enable push notifications.")
        } finally {
            setSaving(false)
        }
    }

    async function handleDisable() {
        setSaving(true)
        setMessage("")

        try {
            await unsubscribeFromPushNotifications()

            const currentSubscription =
                await getPushSubscriptionStatus()

            setSubscribed(currentSubscription)
            setPermission(await getNotificationPermission())

            setMessage(
                currentSubscription
                    ? "Push notifications could not be disabled."
                    : "Push notifications are disabled on this device."
            )
        } catch (error) {
            console.error(error)
            setMessage(error.message || "Unable to disable push notifications.")
        } finally {
            setSaving(false)
        }
    }

    async function handleSendTest() {
        setSaving(true)
        setMessage("")

        try {
            const result = await sendTestPushNotification()

            setMessage(
                `Test notification sent. Sent: ${result.sent}, Failed: ${result.failed}`
            )
        } catch (error) {
            console.error(error)
            setMessage(error.message || "Unable to send test notification.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="settings-empty-state">
                <p>Checking push notification status...</p>
            </div>
        )
    }

    if (!supported) {
        return (
            <div className="settings-empty-state">
                <p>Push notifications are not supported in this browser.</p>
            </div>
        )
    }

    return (
        <div className="settings-toggle-grid">
            <div className="settings-toggle-row">
                <span>
                    <strong>Device push notifications</strong>
                    <p>
                        Receive alerts for important Evergrove updates
                        even when the app is closed.
                    </p>

                    <p>
                        Current status:{" "}
                        <strong>
                            {subscribed ? "Enabled" : "Disabled"}
                        </strong>
                    </p>

                    <p>
                        Browser permission: {permission}
                    </p>

                    {message && <p>{message}</p>}
                </span>

                <div className="button-row">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={handleEnable}
                        disabled={saving || subscribed || permission === "denied"}
                    >
                        {saving ? "Saving..." : "Enable"}
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={handleSendTest}
                        disabled={saving || !subscribed || permission !== "granted"}
                    >
                        Send Test
                    </button>

                    <button
                        type="button"
                        className="danger-button"
                        onClick={handleDisable}
                        disabled={saving || !subscribed}
                    >
                        Disable
                    </button>
                </div>
            </div>
        </div>
    )
}
