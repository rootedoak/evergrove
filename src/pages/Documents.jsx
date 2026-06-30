import { useState } from "react"
import { Plus } from "lucide-react"

import useDocuments from "../hooks/useDocuments"
import useFamilyMembers from "../hooks/useFamilyMembers"
import useActivities from "../hooks/useActivities"
import useSchoolItems from "../hooks/useSchoolItems"

import {
    deleteDocument,
    getDocumentSignedUrl,
    uploadDocument
} from "../services/documentService"

import AppPage from "../components/ui/AppPage"
import PageHeader from "../components/ui/PageHeader"
import SectionCard from "../components/ui/SectionCard"
import Button from "../components/ui/Button"
import InsightCard from "../components/dashboard/InsightCard"
import ActionMenu from "../components/ui/ActionMenu"

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
    const [documentMenuOpen, setDocumentMenuOpen] = useState(null)

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

    const primaryDocument = documents?.[0]

    return (
        <AppPage>
            <PageHeader
                eyebrow="Documents"
                title="Document Vault"
                subtitle="Store important family documents, school forms, activity paperwork, insurance cards, and records."
                action={
                    <Button
                        size="sm"
                        onClick={() => {
                            if (showForm) resetForm()
                            else setShowForm(true)
                        }}
                    >
                        <Plus size={16} />
                        {showForm ? "Cancel" : "Add"}
                    </Button>
                }
            />

            <div className="eg-stack">
                <InsightCard
                    insight={{
                        title: documents.length > 0
                            ? `${documents.length} document${documents.length === 1 ? "" : "s"} stored`
                            : "No documents uploaded yet",
                        description: primaryDocument
                            ? `Most recent: ${primaryDocument.title}`
                            : "Upload school forms, insurance cards, records, and other important files.",
                        actionLabel: documents.length > 0 ? "Upload More" : "Upload Document"
                    }}
                    onAction={() => setShowForm(true)}
                />

                {showForm && (
                    <SectionCard
                        title="Upload Document"
                        subtitle="Add a file and connect it to a person, school item, or activity."
                    >
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

                            <Button
                                className="full-width"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? "Uploading..." : "Upload Document"}
                            </Button>
                        </form>
                    </SectionCard>
                )}

                <SectionCard
                    title="Documents"
                    subtitle="Important files saved for your household."
                    count={documents.length}
                >
                    {loading ? (
                        <p>Loading documents...</p>
                    ) : documents.length === 0 ? (
                        <p className="dashboard-empty">
                            No documents uploaded yet.
                        </p>
                    ) : (
                        <div className="eg-stack">
                            {documents.map(document => (
                                <div className="eg-document-row" key={document.id}>
                                    <span className="eg-document-icon">
                                        {document.family_members?.avatar_emoji || "📄"}
                                    </span>

                                    <div className="eg-document-main">
                                        <strong>{document.title}</strong>

                                        <p>
                                            {document.category || "general"}
                                            {document.family_members?.name
                                                ? ` • ${document.family_members.name}`
                                                : ""}
                                            {document.file_size
                                                ? ` • ${formatFileSize(document.file_size)}`
                                                : ""}
                                        </p>

                                        {document.school_items?.title && (
                                            <small>School item: {document.school_items.title}</small>
                                        )}

                                        {document.activities?.name && (
                                            <small>Activity: {document.activities.name}</small>
                                        )}

                                        {document.file_name && (
                                            <small>{document.file_name}</small>
                                        )}

                                        {document.notes && (
                                            <small>{document.notes}</small>
                                        )}
                                    </div>

                                    <div className="eg-document-actions">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            type="button"
                                            onClick={() => handleOpen(document)}
                                        >
                                            Open
                                        </Button>

                                        <ActionMenu
                                            title={document.title}
                                            open={documentMenuOpen === document.id}
                                            onOpenChange={isOpen =>
                                                setDocumentMenuOpen(isOpen ? document.id : null)
                                            }
                                            ariaLabel="Open document actions"
                                            actions={[
                                                {
                                                    label: "Delete",
                                                    danger: true,
                                                    onClick: () => handleDelete(document)
                                                }
                                            ]}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </AppPage>
    )
}