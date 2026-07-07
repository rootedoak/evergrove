import { useState } from "react"

import { createRelease } from "../../services/admin/releaseActionService"

export default function useCreateRelease() {
    const [saving, setSaving] = useState(false)

    async function save(values) {
        setSaving(true)

        try {
            return await createRelease(values)
        } finally {
            setSaving(false)
        }
    }

    return {
        save,
        saving
    }
}