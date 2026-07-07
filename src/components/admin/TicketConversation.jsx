import { useState } from "react"

import Button from "../ui/Button"
import AdminEmptyState from "./AdminEmptyState"

import { addFeedbackMessage } from "../../services/admin/productFeedbackMessageService"

export default function TicketConversation({
    feedbackId,
    messages = [],
    loading,
    onMessageAdded
}) {
    const [message, setMessage] = useState("")
    const [savingAction, setSavingAction] = useState("")
    const [error, setError] = useState("")

    async function handleSubmit(visibleToUser) {
        if (!message.trim()) {
            setError("Please enter a message.")
            return
        }

        setSavingAction(visibleToUser ? "user" : "internal")
        setError("")

        try {
            await addFeedbackMessage({
                feedbackId,
                message,
                visibleToUser
            })

            setMessage("")
            await onMessageAdded?.()
        } catch (err) {
            console.error(err)
            setError(err.message || "Could not add update.")
        } finally {
            setSavingAction("")
        }
    }

    return (
        <div className="admin-ticket-conversation">
            {loading && (
                <AdminEmptyState>
                    Loading conversation...
                </AdminEmptyState>
            )}

            {!loading && messages.length === 0 && (
                <AdminEmptyState>
                    No conversation updates yet.
                </AdminEmptyState>
            )}

            {!loading && messages.length > 0 && (
                <div className="admin-ticket-messages">
                    {messages.map(item => (
                        <div
                            key={item.id}
                            className="admin-ticket-message-item"
                        >
                            <div className="admin-ticket-message-meta">
                                <strong>
                                    {item.visible_to_user
                                        ? "User-visible update"
                                        : "Internal note"}
                                </strong>

                                <span>{formatDateTime(item.created_at)}</span>
                            </div>

                            <p>{item.message}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="admin-ticket-composer">
                <label>
                    Write update
                    <textarea
                        rows="4"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Write an internal note or an update for the user..."
                    />
                </label>

                {error && (
                    <p className="error-message">{error}</p>
                )}

                <div className="admin-ticket-composer-actions">
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={Boolean(savingAction)}
                        onClick={() => handleSubmit(false)}
                    >
                        {savingAction === "internal" ? "Adding..." : "Add Internal Note"}
                    </Button>

                    <Button
                        type="button"
                        disabled={Boolean(savingAction)}
                        onClick={() => handleSubmit(true)}
                    >
                        {savingAction === "user" ? "Sending..." : "Notify User"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function formatDateTime(value) {
    if (!value) return "—"

    return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    })
}