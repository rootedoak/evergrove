import { useEffect, useMemo, useState } from "react"
import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"

import DiscoverMessageModal from "../../../components/discover/DiscoverMessageModal"

import {
    createDiscoverMessage,
    deleteDiscoverMessage,
    getDiscoverMessageDetail,
    removeDiscoverMessageImage,
    updateDiscoverMessage,
    uploadDiscoverMessageImage
} from "../../../services/admin/discoverMessageAdminService"

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp"
]

const initialForm = {
    id: null,
    title: "",
    message: "",
    message_type: "announcement",
    priority: 0,
    action_label: "",
    action_url: "",
    dismissible: true,
    published: false,
    starts_at: "",
    ends_at: "",
    image_path: null,
    image_url: null,
    image_name: null,
    image_type: null,
    image_size: null
}

export default function DiscoverMessageEditor() {
    const { discoverMessageId } = useParams()
    const navigate = useNavigate()

    const isEditing =
        Boolean(discoverMessageId) &&
        discoverMessageId !== "new"

    const [form, setForm] = useState(initialForm)
    const [loading, setLoading] = useState(isEditing)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState(null)

    const [selectedImage, setSelectedImage] = useState(null)
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [removingImage, setRemovingImage] = useState(false)

    useEffect(() => {
        if (!isEditing) return

        let cancelled = false

        async function loadMessage() {
            setLoading(true)
            setError(null)

            try {
                const data =
                    await getDiscoverMessageDetail(
                        discoverMessageId
                    )

                if (cancelled) return

                setForm({
                    id: data.id,
                    title: data.title || "",
                    message: data.message || "",
                    message_type:
                        data.message_type ||
                        "announcement",
                    priority: data.priority ?? 0,
                    action_label:
                        data.action_label || "",
                    action_url:
                        data.action_url || "",
                    dismissible:
                        data.dismissible !== false,
                    published:
                        data.published === true,
                    starts_at:
                        toDateTimeLocal(
                            data.starts_at
                        ),
                    ends_at:
                        toDateTimeLocal(
                            data.ends_at
                        ),
                    image_path:
                        data.image_path || null,
                    image_url:
                        data.image_url || null,
                    image_name:
                        data.image_name || null,
                    image_type:
                        data.image_type || null,
                    image_size:
                        data.image_size ?? null
                })
            } catch (err) {
                console.error(
                    "Failed to load Discover message:",
                    err
                )

                setError(err)
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadMessage()

        return () => {
            cancelled = true
        }
    }, [discoverMessageId, isEditing])

    useEffect(() => {
        if (!selectedImage) {
            setImagePreviewUrl(null)
            return
        }

        const objectUrl =
            URL.createObjectURL(selectedImage)

        setImagePreviewUrl(objectUrl)

        return () => {
            URL.revokeObjectURL(objectUrl)
        }
    }, [selectedImage])

    function updateForm(field, value) {
        setForm(current => ({
            ...current,
            [field]: value
        }))
    }

    function handleImageChange(event) {
        const file = event.target.files?.[0]

        if (!file) return

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setError(
                new Error(
                    "Use a PNG, JPEG, or WebP image."
                )
            )

            event.target.value = ""
            return
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setError(
                new Error(
                    "The image must be 5 MB or smaller."
                )
            )

            event.target.value = ""
            return
        }

        setError(null)
        setSelectedImage(file)

        // Allows selecting the same file again later.
        event.target.value = ""
    }

    async function handleRemoveImage() {
        if (selectedImage) {
            setSelectedImage(null)
            setError(null)
            return
        }

        if (
            !isEditing ||
            !form.id ||
            !form.image_path ||
            removingImage
        ) {
            return
        }

        const confirmed = window.confirm(
            "Remove this image from the Discover message?"
        )

        if (!confirmed) return

        setRemovingImage(true)
        setError(null)

        try {
            await removeDiscoverMessageImage({
                id: form.id,
                image_path: form.image_path
            })

            setForm(current => ({
                ...current,
                image_path: null,
                image_url: null,
                image_name: null,
                image_type: null,
                image_size: null
            }))
        } catch (err) {
            console.error(
                "Failed to remove Discover image:",
                err
            )

            setError(err)
        } finally {
            setRemovingImage(false)
        }
    }

    const previewMessage = useMemo(
        () => ({
            ...form,
            title:
                form.title ||
                "Discover message title",
            message:
                form.message ||
                "Your message will appear here as you type.",
            image_url:
                imagePreviewUrl ||
                form.image_url ||
                null,
            image_name:
                selectedImage?.name ||
                form.image_name ||
                null
        }),
        [
            form,
            imagePreviewUrl,
            selectedImage
        ]
    )

    async function handleDelete() {
        if (
            !isEditing ||
            !form.id ||
            deleting
        ) {
            return
        }

        const confirmed = window.confirm(
            `Delete "${form.title}"? This will also remove its receipt history and cannot be undone.`
        )

        if (!confirmed) return

        setDeleting(true)
        setError(null)

        try {
            await deleteDiscoverMessage({
                id: form.id,
                image_path: form.image_path
            })

            navigate("/admin/discover", {
                replace: true
            })
        } catch (err) {
            console.error(
                "Failed to delete Discover message:",
                err
            )

            setError(err)
        } finally {
            setDeleting(false)
        }
    }

    async function handleSubmit(event) {
        event.preventDefault()

        if (!form.title.trim()) {
            setError(
                new Error("Title is required.")
            )
            return
        }

        if (!form.message.trim()) {
            setError(
                new Error("Message is required.")
            )
            return
        }

        const hasActionLabel =
            Boolean(form.action_label.trim())

        const hasActionUrl =
            Boolean(form.action_url.trim())

        if (hasActionLabel !== hasActionUrl) {
            setError(
                new Error(
                    "Enter both a button label and button URL, or leave both blank."
                )
            )
            return
        }

        if (
            form.starts_at &&
            form.ends_at &&
            new Date(form.ends_at) <=
            new Date(form.starts_at)
        ) {
            setError(
                new Error(
                    "The end date must be later than the start date."
                )
            )
            return
        }

        setSaving(true)
        setError(null)

        const payload = {
            title: form.title.trim(),
            message: form.message.trim(),
            message_type:
                form.message_type,
            priority:
                Number(form.priority) || 0,
            action_label:
                form.action_label.trim() ||
                null,
            action_url:
                form.action_url.trim() ||
                null,
            dismissible:
                form.dismissible,
            published:
                form.published,
            starts_at:
                form.starts_at
                    ? new Date(
                        form.starts_at
                    ).toISOString()
                    : null,
            ends_at:
                form.ends_at
                    ? new Date(
                        form.ends_at
                    ).toISOString()
                    : null
        }

        try {
            let savedMessage

            if (isEditing) {
                savedMessage =
                    await updateDiscoverMessage(
                        discoverMessageId,
                        payload
                    )
            } else {
                savedMessage =
                    await createDiscoverMessage(
                        payload
                    )
            }

            if (selectedImage) {
                setUploadingImage(true)

                await uploadDiscoverMessageImage(
                    savedMessage.id,
                    selectedImage
                )
            }

            navigate("/admin/discover", {
                replace: true
            })
        } catch (err) {
            console.error(
                "Failed to save Discover message:",
                err
            )

            setError(err)
        } finally {
            setUploadingImage(false)
            setSaving(false)
        }
    }

    const busy =
        saving ||
        deleting ||
        uploadingImage ||
        removingImage

    if (loading) {
        return (
            <div className="admin-page">
                <AdminEmptyState>
                    Loading Discover message...
                </AdminEmptyState>
            </div>
        )
    }

    return (
        <div className="admin-page">
            <div className="admin-breadcrumbs">
                <Link to="/admin/discover">
                    Discover
                </Link>

                <span>/</span>

                <span>
                    {isEditing
                        ? "Edit Message"
                        : "New Message"}
                </span>
            </div>

            <AdminPageHeader
                eyebrow="Communications"
                title={
                    isEditing
                        ? "Edit Discover Message"
                        : "New Discover Message"
                }
                description="Create, preview, schedule, and publish an in-app message."
            />

            <form
                className="discover-editor-layout"
                onSubmit={handleSubmit}
            >
                <div className="discover-editor-form">
                    <AdminCard title="Message Details">
                        <div className="admin-form">
                            <label>
                                Title

                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={event =>
                                        updateForm(
                                            "title",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Recurring Tasks Are Here"
                                    required
                                />
                            </label>

                            <label>
                                Message

                                <textarea
                                    rows="7"
                                    value={form.message}
                                    onChange={event =>
                                        updateForm(
                                            "message",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Tell families what is new or important."
                                    required
                                />
                            </label>

                            <div className="admin-grid admin-grid-2">
                                <label>
                                    Type

                                    <select
                                        value={
                                            form.message_type
                                        }
                                        onChange={event =>
                                            updateForm(
                                                "message_type",
                                                event.target.value
                                            )
                                        }
                                    >
                                        <option value="announcement">
                                            Announcement
                                        </option>

                                        <option value="update">
                                            Product Update
                                        </option>

                                        <option value="maintenance">
                                            Maintenance
                                        </option>

                                        <option value="important">
                                            Important
                                        </option>

                                        <option value="welcome">
                                            Welcome
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    Priority

                                    <input
                                        type="number"
                                        value={form.priority}
                                        onChange={event =>
                                            updateForm(
                                                "priority",
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>
                            </div>
                        </div>
                    </AdminCard>

                    <AdminCard
                        title="Header Image"
                        subtitle="Optional. PNG, JPEG, or WebP up to 5 MB."
                    >
                        <div className="discover-image-editor">
                            {(imagePreviewUrl ||
                                form.image_url) && (
                                    <div className="discover-image-editor__preview">
                                        <img
                                            src={
                                                imagePreviewUrl ||
                                                form.image_url
                                            }
                                            alt={
                                                selectedImage?.name ||
                                                form.image_name ||
                                                "Discover message"
                                            }
                                        />
                                    </div>
                                )}

                            <label className="discover-image-editor__upload">
                                <span>
                                    {selectedImage ||
                                        form.image_path
                                        ? "Replace Image"
                                        : "Choose Image"}
                                </span>

                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={
                                        handleImageChange
                                    }
                                    disabled={busy}
                                />
                            </label>

                            {(selectedImage ||
                                form.image_path) && (
                                    <div className="discover-image-editor__details">
                                        <div>
                                            <strong>
                                                {selectedImage?.name ||
                                                    form.image_name ||
                                                    "Header image"}
                                            </strong>

                                            <span className="admin-muted">
                                                {formatFileSize(
                                                    selectedImage
                                                        ? selectedImage.size
                                                        : form.image_size
                                                )}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="admin-danger-button"
                                            onClick={
                                                handleRemoveImage
                                            }
                                            disabled={
                                                removingImage ||
                                                saving ||
                                                deleting ||
                                                uploadingImage
                                            }
                                        >
                                            {removingImage
                                                ? "Removing..."
                                                : "Remove"}
                                        </button>
                                    </div>
                                )}
                        </div>
                    </AdminCard>

                    <AdminCard title="Action">
                        <div className="admin-form">
                            <label>
                                Button Label

                                <input
                                    type="text"
                                    value={
                                        form.action_label
                                    }
                                    onChange={event =>
                                        updateForm(
                                            "action_label",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Learn More"
                                />
                            </label>

                            <label>
                                Button URL

                                <input
                                    type="text"
                                    value={
                                        form.action_url
                                    }
                                    onChange={event =>
                                        updateForm(
                                            "action_url",
                                            event.target.value
                                        )
                                    }
                                    placeholder="/calendar"
                                />
                            </label>

                            <p className="admin-muted">
                                Use an Evergrove route such as
                                {" "}
                                <code>/calendar</code>
                                {" "}
                                or a complete external URL.
                            </p>
                        </div>
                    </AdminCard>

                    <AdminCard title="Availability">
                        <div className="admin-form">
                            <div className="admin-grid admin-grid-2">
                                <label>
                                    Starts

                                    <input
                                        type="datetime-local"
                                        value={
                                            form.starts_at
                                        }
                                        onChange={event =>
                                            updateForm(
                                                "starts_at",
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>

                                <label>
                                    Ends

                                    <input
                                        type="datetime-local"
                                        value={
                                            form.ends_at
                                        }
                                        onChange={event =>
                                            updateForm(
                                                "ends_at",
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>
                            </div>

                            <label className="admin-checkbox-field">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.dismissible
                                    }
                                    onChange={event =>
                                        updateForm(
                                            "dismissible",
                                            event.target.checked
                                        )
                                    }
                                />

                                <span>
                                    Allow users to dismiss
                                    this message
                                </span>
                            </label>

                            <label className="admin-checkbox-field">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.published
                                    }
                                    onChange={event =>
                                        updateForm(
                                            "published",
                                            event.target.checked
                                        )
                                    }
                                />

                                <span>
                                    Publish this message
                                </span>
                            </label>
                        </div>
                    </AdminCard>

                    {error && (
                        <p className="admin-error-message">
                            {error.message ||
                                "Discover message could not be saved."}
                        </p>
                    )}

                    <div className="discover-editor-actions">
                        {isEditing && (
                            <button
                                type="button"
                                className="admin-danger-button"
                                onClick={handleDelete}
                                disabled={busy}
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Delete Message"}
                            </button>
                        )}

                        <div className="discover-editor-actions__right">
                            <Link
                                to="/admin/discover"
                                className="admin-secondary-button"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                className="admin-primary-button"
                                disabled={busy}
                            >
                                {uploadingImage
                                    ? "Uploading Image..."
                                    : saving
                                        ? "Saving..."
                                        : isEditing
                                            ? "Save Changes"
                                            : "Create Message"}
                            </button>
                        </div>
                    </div>
                </div>

                <aside className="discover-editor-preview">
                    <AdminCard
                        title="Live Preview"
                        subtitle="This matches what users will see in Evergrove."
                    >
                        <DiscoverMessageModal
                            message={previewMessage}
                            preview
                        />
                    </AdminCard>
                </aside>
            </form>
        </div>
    )
}

function toDateTimeLocal(value) {
    if (!value) return ""

    const date = new Date(value)

    const offset =
        date.getTimezoneOffset() *
        60_000

    return new Date(
        date.getTime() - offset
    )
        .toISOString()
        .slice(0, 16)
}

function formatFileSize(value) {
    if (!value && value !== 0) {
        return "—"
    }

    if (value < 1024) {
        return `${value} B`
    }

    if (value < 1024 * 1024) {
        return `${Math.round(
            value / 1024
        )} KB`
    }

    return `${(
        value /
        (1024 * 1024)
    ).toFixed(1)} MB`
}