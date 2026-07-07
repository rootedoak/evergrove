import { useState } from "react"

import Button from "../ui/Button"
import AdminModal from "./AdminModal"
import AdminEmptyState from "./AdminEmptyState"

import useReleases from "../../hooks/admin/useReleases"
import { linkFeedbackToRelease } from "../../services/admin/releaseActionService"

export default function LinkReleaseModal({
    open,
    onClose,
    feedbackId,
    onLinked
}) {
    const { releases, loading } = useReleases()
    const [releaseId, setReleaseId] = useState("")
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    async function handleLink() {
        if (!releaseId) {
            setError("Please select a release.")
            return
        }

        const release = releases.find(item => item.id === releaseId)
        const releaseLabel = release
            ? `${release.version} ${release.channel}`
            : "release"

        setSaving(true)
        setError("")

        try {
            await linkFeedbackToRelease({
                feedbackId,
                releaseId,
                releaseLabel
            })

            setReleaseId("")
            await onLinked?.(release)
            onClose()
        } catch (err) {
            console.error(err)
            setError(err.message || "Could not link release.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <AdminModal
            open={open}
            title="Link Release"
            onClose={onClose}
            actions={
                <>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleLink}
                        disabled={saving}
                    >
                        {saving ? "Linking..." : "Link Release"}
                    </Button>
                </>
            }
        >
            {loading ? (
                <AdminEmptyState>
                    Loading releases...
                </AdminEmptyState>
            ) : (
                <div className="admin-form">
                    <label>
                        Release

                        <select
                            value={releaseId}
                            onChange={event => setReleaseId(event.target.value)}
                        >
                            <option value="">
                                Select a release
                            </option>

                            {releases.map(release => (
                                <option
                                    key={release.id}
                                    value={release.id}
                                >
                                    {release.version} {formatLabel(release.channel)} — {formatLabel(release.status)}
                                </option>
                            ))}
                        </select>
                    </label>

                    {error && (
                        <p className="error-message">
                            {error}
                        </p>
                    )}
                </div>
            )}
        </AdminModal>
    )
}

function formatLabel(value) {
    if (!value) return "Unknown"

    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, char => char.toUpperCase())
}