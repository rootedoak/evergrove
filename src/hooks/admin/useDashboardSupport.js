import { useEffect, useState } from "react"

import {
    getRecentSupportTickets,
    getUpcomingReleases
} from "../../services/admin/dashboardService"

export default function useDashboardSupport() {
    const [tickets, setTickets] = useState([])
    const [releases, setReleases] = useState([])
    const [loading, setLoading] = useState(true)

    async function refresh() {
        try {
            const [
                recentTickets,
                upcomingReleases
            ] = await Promise.all([
                getRecentSupportTickets(),
                getUpcomingReleases()
            ])

            setTickets(recentTickets)
            setReleases(upcomingReleases)

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    return {
        tickets,
        releases,
        loading,
        refresh
    }
}