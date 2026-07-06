import { useState } from "react"
import { X } from "lucide-react"
import { createThoughtInboxItem } from "../services/personalInboxService"

export default function ThoughtCaptureSheet({ open, onClose, onCreated }) {
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [saving, setSaving] = useState(false)

    if (!open) return null

    async function handleSubmit(event) {
        event.preventDefault()

        if (!title.trim() && !body.trim()) return

        try {
            setSaving(true)

            await createThoughtInboxItem({
                title,
                body
            })

            setTitle("")
            setBody("")

            onCreated?.()
            onClose()
        } catch (error) {
            console.error("Could not save thought:", error)
            alert(error.message || "Could not save thought.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="eg-bottom-sheet-backdrop" onClick={onClose}>
            <div className="eg-bottom-sheet" onClick={event => event.stopPropagation()}>
                <div className="eg-sheet-handle" />

                <div className="eg-sheet-header">
                    <div>
                        <h3>Capture a Thought</h3>
                        <p>Capture it now. Organize it later.</p>
                    </div>

                    <button type="button" className="eg-icon-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="thought-capture-form">
                    <input
                        value={title}
                        onChange={event => setTitle(event.target.value)}
                        placeholder="What’s on your mind?"
                        autoFocus
                    />

                    <textarea
                        value={body}
                        onChange={event => setBody(event.target.value)}
                        placeholder="Add a little more context..."
                        rows={4}
                    />

                    <button type="submit" className="primary-button" disabled={saving}>
                        {saving ? "Capturing..." : "Capture Thought"}
                    </button>
                </form>
            </div>
        </div>
    )
}