import { useState } from "react"

import useReactions from "../hooks/useReactions"
import ReactionBar from "./ReactionBar"

import Button from "./ui/Button"
import FormActions from "./ui/FormActions"
import ActionMenu from "./ui/ActionMenu"

import SectionCard from "./ui/SectionCard"

import Avatar from "./ui/Avatar"

export default function FamilyAnnouncementsCard({
    announcements = [],
    loading = false,
    showForm: controlledShowForm,
    onShowFormChange,
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

    const [internalShowForm, setInternalShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [announcementMenuOpen, setAnnouncementMenuOpen] = useState(null)

    const showForm = controlledShowForm ?? internalShowForm

    function setShowForm(value) {
        if (onShowFormChange) {
            onShowFormChange(value)
        } else {
            setInternalShowForm(value)
        }
    }

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
        <SectionCard
            title="Family Announcements"
            subtitle="Important household updates in one place."
            className="family-announcements-card"
            action={
                !showForm && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowForm(true)}
                    >
                        + Announcement
                    </Button>
                )
            }
        >

            {showForm && (
                <form className="announcement-form eg-form" onSubmit={handleSubmit}>
                    <label>
                        Title
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
                    </label>

                    <label>
                        Details
                        <textarea
                            placeholder="What does the household need to know?"
                            value={form.message}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    message: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <div className="announcement-form-row">
                        <label className="announcement-pin-field">
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

                    <FormActions>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={resetForm}
                        >
                            Cancel
                        </Button>

                        <Button type="submit">
                            {editingId ? "Save Announcement" : "Post Announcement"}
                        </Button>
                    </FormActions>
                </form>
            )}

            {loading ? (
                <p className="muted-text">Loading announcements...</p>
            ) : announcements.length === 0 && !showForm ? (
                <p className="muted-text">
                    No announcements yet. Post one when the family needs to know something.
                </p>
            ) : announcements.length > 0 ? (
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
                                    <div className="announcement-author">
                                        <Avatar
                                            member={announcement.posted_by}
                                            size="xs"
                                        />

                                        <span>Posted by {announcement.posted_by.name}</span>
                                    </div>
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

                            <ActionMenu
                                title={announcement.title}
                                open={announcementMenuOpen === announcement.id}
                                onOpenChange={isOpen =>
                                    setAnnouncementMenuOpen(isOpen ? announcement.id : null)
                                }
                                ariaLabel="Open announcement actions"
                                actions={[
                                    {
                                        label: "Edit",
                                        onClick: () => startEdit(announcement)
                                    },
                                    {
                                        label: "Delete",
                                        danger: true,
                                        onClick: () => onDelete(announcement.id)
                                    }
                                ]}
                            />
                        </article>
                    ))}
                </div>
            ) : null}
        </SectionCard>
    )
}