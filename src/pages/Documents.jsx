import { useState } from "react"
import useDocuments from "../hooks/useDocuments"
import useFamilyMembers from "../hooks/useFamilyMembers"
import useActivities from "../hooks/useActivities"
import useSchoolItems from "../hooks/useSchoolItems"
import {
    deleteDocument,
    getDocumentSignedUrl,
    uploadDocument
} from "../services/documentService"

const initialForm = {
    title: "",
    category: "general",
    family_member_id: "",
    school_item_id: "",
    activity_id: "",
    notes: "",
    file: null
}

function formatFileSize(size) {
    if (!size) return ""

    const kb = size / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`

    return `${(kb / 1024).toFixed(1)} MB`
}

export default function Documents() {
    const { documents, loading, refreshDocuments } = useDocuments()
    const { familyMembers } = useFamilyMembers()
    const { activities } = useActivities()
    const { schoolItems } = useSchoolItems()

    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)

    function updateForm(field, value) {
        setForm(current => ({
            ...current,
            [field]: value
        }))
    }

    function resetForm() {
        setForm(initialForm)
        setShowForm(false)
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)

        try {
            await uploadDocument(form)
            resetForm()
            await refreshDocuments()
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    async function handleOpen(document) {
        try {
            const url = await getDocumentSignedUrl(document.file_path)
            window.open(url, "_blank", "noopener,noreferrer")
        } catch (error) {
            console.error(error)
        }
    }

    async function handleDelete(document) {
        const confirmed = window.confirm(
            `Delete "${document.title}"? This cannot be undone.`
        )

        if (!confirmed) return

        try {
            await deleteDocument(document)
            await refreshDocuments()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <>
            <section className="hero-card">
                <div className="section-header">
                    <div>
                        <p className="eyebrow">Documents</p>
                        <h2>Document Vault</h2>
                        <p>
                            Store important family documents, school forms,
                            activity paperwork, insurance cards, and records.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={() => {
                            if (showForm) resetForm()
                            else setShowForm(true)
                        }}
                    >
                        {showForm ? "Cancel" : "+ Upload Document"}
                    </button>
                </div>
            </section>

            {showForm && (
                <section className="card form-card">
                    <h3>Upload Document</h3>

                    <form className="form-grid" onSubmit={handleSubmit}>
                        <label>
                            Title
                            <input
                                value={form.title}
                                onChange={event =>
                                    updateForm("title", event.target.value)
                                }
                                placeholder="Immunization Record"
                                required
                            />
                        </label>

                        <label>
                            Category
                            <select
                                value={form.category}
                                onChange={event =>
                                    updateForm("category", event.target.value)
                                }
                            >
                                <option value="general">General</option>
                                <option value="school">School</option>
                                <option value="medical">Medical</option>
                                <option value="activity">Activity</option>
                                <option value="insurance">Insurance</option>
                                <option value="identification">Identification</option>
                                <option value="form">Form</option>
                            </select>
                        </label>

                        <label>
                            Family Member
                            <select
                                value={form.family_member_id}
                                onChange={event =>
                                    updateForm("family_member_id", event.target.value)
                                }
                            >
                                <option value="">No family member selected</option>
                                {familyMembers.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.avatar_emoji ? `${member.avatar_emoji} ` : ""}
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Related School Item
                            <select
                                value={form.school_item_id}
                                onChange={event =>
                                    updateForm("school_item_id", event.target.value)
                                }
                            >
                                <option value="">No school item selected</option>
                                {schoolItems.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.title}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Related Activity
                            <select
                                value={form.activity_id}
                                onChange={event =>
                                    updateForm("activity_id", event.target.value)
                                }
                            >
                                <option value="">No activity selected</option>
                                {activities.map(activity => (
                                    <option key={activity.id} value={activity.id}>
                                        {activity.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            File
                            <input
                                type="file"
                                onChange={event =>
                                    updateForm("file", event.target.files?.[0] || null)
                                }
                                required
                            />
                        </label>

                        <label className="full-width">
                            Notes
                            <textarea
                                value={form.notes}
                                onChange={event =>
                                    updateForm("notes", event.target.value)
                                }
                                rows="3"
                            />
                        </label>

                        <button
                            className="primary-button full-width"
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? "Uploading..." : "Upload Document"}
                        </button>
                    </form>
                </section>
            )}

            <div className="grid">
                {loading ? (
                    <section className="card">
                        <p>Loading documents...</p>
                    </section>
                ) : documents.length === 0 ? (
                    <section className="card">
                        <p>No documents uploaded yet.</p>
                    </section>
                ) : (
                    documents.map(document => (
                        <section className="card" key={document.id}>
                            <div className="member-header">
                                <span className="avatar">
                                    {document.family_members?.avatar_emoji || "📄"}
                                </span>

                                <div>
                                    <h3>{document.title}</h3>
                                    <span className="status-pill status-neutral">
                                        {document.category || "general"}
                                    </span>
                                </div>
                            </div>

                            {document.family_members?.name && (
                                <p>For: {document.family_members.name}</p>
                            )}

                            {document.school_items?.title && (
                                <p>School item: {document.school_items.title}</p>
                            )}

                            {document.activities?.name && (
                                <p>Activity: {document.activities.name}</p>
                            )}

                            {document.file_name && (
                                <p>{document.file_name}</p>
                            )}

                            {document.file_size && (
                                <p>{formatFileSize(document.file_size)}</p>
                            )}

                            {document.notes && <p>{document.notes}</p>}

                            <div className="card-actions">
                                <button
                                    className="secondary-button"
                                    onClick={() => handleOpen(document)}
                                >
                                    Open
                                </button>

                                <button
                                    className="danger-button"
                                    onClick={() => handleDelete(document)}
                                >
                                    Delete
                                </button>
                            </div>
                        </section>
                    ))
                )}
            </div>
        </>
    )
}