import { useEffect, useState } from "react"

import {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} from "../services/announcementService"

export default function useAnnouncements() {
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)

    async function loadAnnouncements() {
        setLoading(true)

        try {
            const data = await getAnnouncements()
            setAnnouncements(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAnnouncements()
    }, [])

    async function addAnnouncement(announcement) {
        const created = await createAnnouncement(announcement)

        setAnnouncements((current) => [
            created,
            ...current,
        ])

        return created
    }

    async function editAnnouncement(id, updates) {
        const updated = await updateAnnouncement(id, updates)

        setAnnouncements((current) =>
            current.map((announcement) =>
                announcement.id === id ? updated : announcement
            )
        )

        return updated
    }

    async function removeAnnouncement(id) {
        await deleteAnnouncement(id)

        setAnnouncements((current) =>
            current.filter((announcement) => announcement.id !== id)
        )
    }

    return {
        announcements,
        loading,
        loadAnnouncements,
        addAnnouncement,
        editAnnouncement,
        removeAnnouncement,
    }
}