import { useState } from "react"

import useReactions from "../hooks/useReactions"
import ReactionBar from "./ReactionBar"

export default function FamilyAnnouncementsCard({
    announcements = [],
    loading = false,
    onAdd,
    onEdit,
    onDelete,
}) {

    const announcementIds = announcements.map(a => a.id)

    const {
        toggleReaction,
        getReactionSummary,
    } = useReactions(
        "announcement",
        announcementIds
    )

    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)

    const [form, setForm] = useState({
        title: "",
        message: "",
        is_pinned: false,
        expires_at: "",
    })

    function resetForm() {
        setForm({
            title: "",
            message: "",
            is_pinned: false,
            expires_at: "",
        })
        setEditingId(null)
        setShowForm(false)
    }

    function startEdit(announcement) {
        setForm({
            title: announcement.title || "",
            message: announcement.message || "",
            is_pinned: Boolean(announcement.is_pinned),
            expires_at: announcement.expires_at || "",
        })
        setEditingId(announcement.id)
        setShowForm(true)
    }

    async function handleSubmit(event) {
        event.preventDefault()

        if (!form.title.trim()) return

        if (editingId) {
            await onEdit(editingId, form)
        } else {
            await onAdd(form)
        }

        resetForm()
    }

    return (
        <section className="dashboard-card family-announcements-card">
            <div className="card-header">
                <div>
                    <h2>Family Announcements</h2>
                    <p>Important household updates in one place.</p>
                </div>

                <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowForm((current) => !current)}
                >
                    {showForm ? "Cancel" : "+ Announcement"}
                </button>
            </div>

            {showForm && (
                <form className="announcement-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Announcement title"
                        value={form.title}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                title: event.target.value,
                            }))
                        }
                    />

                    <textarea
                        placeholder="Details"
                        value={form.message}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                message: event.target.value,
                            }))
                        }
                    />

                    <div className="announcement-form-row">
                        <label>
                            <input
                                type="checkbox"
                                checked={form.is_pinned}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        is_pinned: event.target.checked,
                                    }))
                                }
                            />
                            Pin announcement
                        </label>

                        <label>
                            Expires
                            <input
                                type="date"
                                value={form.expires_at}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        expires_at: event.target.value,
                                    }))
                                }
                            />
                        </label>
                    </div>

                    <button type="submit" className="primary-button">
                        {editingId ? "Save Announcement" : "Post Announcement"}
                    </button>
                </form>
            )}

            {loading ? (
                <p className="muted-text">Loading announcements...</p>
            ) : announcements.length === 0 ? (
                <p className="muted-text">
                    No announcements yet. Post one when the family needs to know something.
                </p>
            ) : (
                <div className="announcement-list">
                    {announcements.map((announcement) => (
                        <article
                            key={announcement.id}
                            className={
                                announcement.is_pinned
                                    ? "announcement-item pinned"
                                    : "announcement-item"
                            }
                        >
                            <div>
                                <div className="announcement-title-row">
                                    <h3>{announcement.title}</h3>

                                    {announcement.is_pinned && (
                                        <span className="announcement-pin">Pinned</span>
                                    )}
                                </div>

                                {announcement.posted_by?.name && (
                                    <small className="announcement-author">
                                        Posted by {announcement.posted_by.name}
                                    </small>
                                )}

                                {announcement.message && (
                                    <p>{announcement.message}</p>
                                )}

                                {announcement.expires_at && (
                                    <small>
                                        Expires {announcement.expires_at}
                                    </small>
                                )}

                                <ReactionBar
                                    targetId={announcement.id}
                                    summary={getReactionSummary(announcement.id)}
                                    onToggle={toggleReaction}
                                />
                            </div>

                            <div className="announcement-actions">
                                <button
                                    type="button"
                                    onClick={() => startEdit(announcement)}
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onDelete(announcement.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}