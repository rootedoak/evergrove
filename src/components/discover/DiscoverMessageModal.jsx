import {
    AlertTriangle,
    Bell,
    Megaphone,
    Rocket,
    Sparkles,
    Wrench,
    X
} from "lucide-react"

import { useNavigate } from "react-router-dom"

import Button from "../ui/Button"

const typeConfig = {
    announcement: {
        label: "Announcement",
        icon: Megaphone
    },
    update: {
        label: "Product Update",
        icon: Rocket
    },
    maintenance: {
        label: "Maintenance",
        icon: Wrench
    },
    important: {
        label: "Important",
        icon: AlertTriangle
    },
    welcome: {
        label: "Welcome",
        icon: Sparkles
    }
}

export default function DiscoverMessageModal({
    message,
    onDismiss,
    onAction,
    dismissing = false,
    preview = false
}) {
    const navigate = useNavigate()

    if (!message) return null

    const config =
        typeConfig[message.message_type] ?? {
            label: "Announcement",
            icon: Bell
        }

    const Icon = config.icon

    async function handleAction() {
        if (preview || !message.action_url) return

        await onAction?.()

        const actionUrl =
            message.action_url.trim()

        if (actionUrl.startsWith("/")) {
            navigate(actionUrl)
            return
        }

        window.location.assign(actionUrl)
    }

    function handlePreviewClick(event) {
        event.preventDefault()
    }

    const card = (
        <section
            className={[
                "discover-message",
                `discover-message--${message.message_type}`,
                preview
                    ? "discover-message--preview"
                    : ""
            ].join(" ")}
            role={preview ? undefined : "dialog"}
            aria-modal={preview ? undefined : "true"}
            aria-labelledby="discover-message-title"
        >
            {!preview && message.dismissible && (
                <button
                    type="button"
                    className="discover-message-close"
                    onClick={onDismiss}
                    disabled={dismissing}
                    aria-label="Dismiss message"
                >
                    <X size={20} />
                </button>
            )}

            {message.image_url && (
                <div className="discover-message-image">
                    <img
                        src={message.image_url}
                        alt={
                            message.image_name ||
                            ""
                        }
                    />
                </div>
            )}

            <div className="discover-message-icon">
                <Icon size={24} />
            </div>

            <p className="discover-message-eyebrow">
                {config.label}
            </p>

            <h2 id="discover-message-title">
                {message.title ||
                    "Discover message title"}
            </h2>

            <p className="discover-message-copy">
                {message.message ||
                    "Your message will appear here as you type."}
            </p>

            <div className="discover-message-actions">
                {message.action_label &&
                    message.action_url && (
                        <Button
                            type="button"
                            size="lg"
                            onClick={
                                preview
                                    ? handlePreviewClick
                                    : handleAction
                            }
                        >
                            {message.action_label}
                        </Button>
                    )}

                <Button
                    type="button"
                    size="lg"
                    variant={
                        message.action_label &&
                            message.action_url
                            ? "secondary"
                            : "primary"
                    }
                    onClick={
                        preview
                            ? handlePreviewClick
                            : onDismiss
                    }
                    disabled={dismissing}
                >
                    {dismissing
                        ? "Closing..."
                        : message.dismissible
                            ? "Got it"
                            : "Continue"}
                </Button>
            </div>
        </section>
    )

    if (preview) {
        return (
            <div className="discover-message-preview-frame">
                {card}
            </div>
        )
    }

    return (
        <div
            className="discover-message-backdrop"
            role="presentation"
        >
            {card}
        </div>
    )
}