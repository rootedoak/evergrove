import { useEffect, useState } from "react"
import {
    getNotificationPermission,
    isPushSupported,
    sendTestPushNotification,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
} from "../services/pushNotificationService"

export default function PushNotificationSettings() {
    const [supported, setSupported] = useState(false)
    const [permission, setPermission] = useState("default")
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")

    useEffect(() => {
        setSupported(isPushSupported())
        getNotificationPermission().then(setPermission)
    }, [])

    async function handleEnable() {
        setSaving(true)
        setMessage("")

        try {
            const result = await subscribeToPushNotifications()
            setPermission(result.permission)

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
            setPermission(await getNotificationPermission())
            setMessage("Push notifications are disabled on this device.")
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
                        Receive alerts for important Evergrove updates even when the app is closed.
                    </p>
                    <p>
                        Current status: <strong>{permission}</strong>
                    </p>
                    {message && <p>{message}</p>}
                </span>

                <div className="button-row">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={handleEnable}
                        disabled={saving || permission === "granted"}
                    >
                        {saving ? "Saving..." : "Enable"}
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={handleSendTest}
                        disabled={saving || permission !== "granted"}
                    >
                        Send Test
                    </button>

                    <button
                        type="button"
                        className="danger-button"
                        onClick={handleDisable}
                        disabled={saving}
                    >
                        Disable
                    </button>
                </div>
            </div>
        </div>
    )
}