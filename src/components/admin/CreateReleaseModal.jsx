import { useState } from "react"

import Button from "../ui/Button"

import AdminModal from "./AdminModal"

import useCreateRelease from "../../hooks/admin/useCreateRelease"

export default function CreateReleaseModal({
    open,
    onClose,
    onCreated
}) {
    const { save, saving } = useCreateRelease()

    const [version, setVersion] = useState("")
    const [channel, setChannel] = useState("beta")
    const [title, setTitle] = useState("")
    const [summary, setSummary] = useState("")

    async function handleSubmit() {
        if (!version.trim()) return

        const release = await save({
            version,
            channel,
            title,
            summary
        })

        setVersion("")
        setChannel("beta")
        setTitle("")
        setSummary("")

        onCreated?.(release)

        onClose()
    }

    return (
        <AdminModal
            open={open}
            title="Create Release"
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
                        disabled={saving}
                    >
                        {saving
                            ? "Creating..."
                            : "Create Release"}
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
                        <option value="beta">
                            Beta
                        </option>

                        <option value="production">
                            Production
                        </option>
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