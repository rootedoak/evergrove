import { useCallback, useEffect, useState } from "react"

import { getReleases } from "../../services/admin/releaseAdminService"

export default function useReleases() {
    const [releases, setReleases] = useState([])
    const [loading, setLoading] = useState(true)

    const refreshReleases = useCallback(async () => {
        setLoading(true)

        try {
            setReleases(await getReleases())
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refreshReleases()
    }, [refreshReleases])

    return {
        releases,
        loading,
        refreshReleases
    }
}