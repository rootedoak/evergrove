import { useEffect, useState } from "react"
import { getPlatformSummary } from "../../services/admin/platformService"
import { searchPlatform } from "../../services/admin/platformService"

export default function usePlatformSummary() {
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                setSummary(await getPlatformSummary())
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    return {
        summary,
        loading
    }
}