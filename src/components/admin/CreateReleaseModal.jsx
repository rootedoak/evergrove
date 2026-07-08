import { useEffect, useState } from "react"

import Button from "../ui/Button"
import AdminModal from "./AdminModal"

import useCreateRelease from "../../hooks/admin/useCreateRelease"
import { updateRelease } from "../../services/admin/releaseAdminService"

export default function CreateReleaseModal({
    open,
    onClose,
    onCreated,
    onUpdated,
    release = null
}) {
    const { save, saving } = useCreateRelease()
    const [updating, setUpdating] = useState(false)

    const [version, setVersion] = useState("")
    const [channel, setChannel] = useState("beta")
    const [title, setTitle] = useState("")
    const [summary, setSummary] = useState("")

    const isEditing = Boolean(release)

    useEffect(() => {
        if (!open) return

        setVersion(release?.version || "")
        setChannel(release?.channel || "beta")
        setTitle(release?.title || "")
        setSummary(release?.summary || "")
    }, [open, release])

    async function handleSubmit() {
        if (!version.trim()) return

        if (isEditing) {
            try {
                setUpdating(true)

                const updatedRelease = await updateRelease(release.id, {
                    version: version.trim(),
                    channel,
                    title: title.trim() || null,
                    summary: summary.trim() || null
                })

                onUpdated?.(updatedRelease)
                onClose()
            } finally {
                setUpdating(false)
            }

            return
        }

        const newRelease = await save({
            version,
            channel,
            title,
            summary
        })

        onCreated?.(newRelease)
        onClose()
    }

    const busy = saving || updating

    return (
        <AdminModal
            open={open}
            title={isEditing ? "Edit Release" : "Create Release"}
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
                        onClick={handleSubmit}
                        disabled={busy}
                    >
                        {busy
                            ? isEditing ? "Saving..." : "Creating..."
                            : isEditing ? "Save Changes" : "Create Release"}
                    </Button>
                </>
            }
        >
            <div className="admin-form">
                <label>
                    Version

                    <input
                        value={version}
                        onChange={e => setVersion(e.target.value)}
                        placeholder="0.9.5"
                    />
                </label>

                <label>
                    Channel

                    <select
                        value={channel}
                        onChange={e => setChannel(e.target.value)}
                    >
                        <option value="beta">Beta</option>
                        <option value="production">Production</option>
                    </select>
                </label>

                <label>
                    Title

                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </label>

                <label>
                    Summary

                    <textarea
                        rows={4}
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                    />
                </label>
            </div>
        </AdminModal>
    )
}