import { useEffect, useState } from "react"

import {
    getRelease,
    getReleaseTickets
} from "../../services/admin/releaseAdminService"

export default function useReleaseDetail(releaseId) {
    const [release, setRelease] = useState(null)
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function refreshRelease() {
        if (!releaseId) return

        setLoading(true)
        setError(null)

        try {
            const [releaseData, ticketData] = await Promise.all([
                getRelease(releaseId),
                getReleaseTickets(releaseId)
            ])

            setRelease(releaseData)
            setTickets(ticketData)
        } catch (err) {
            console.error(err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshRelease()
    }, [releaseId])

    return {
        release,
        tickets,
        loading,
        error,
        refreshRelease
    }
}