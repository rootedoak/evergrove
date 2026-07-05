import { useEffect, useState } from "react"
import { searchHouseholds } from "../../services/admin/adminDashboardService"

export default function useHouseholdSearch(searchTerm) {
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function load() {
            if (!searchTerm?.trim()) {
                setResults([])
                return
            }

            setLoading(true)

            try {
                const data = await searchHouseholds(searchTerm)

                if (!cancelled) {
                    setResults(data)
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        load()

        return () => {
            cancelled = true
        }
    }, [searchTerm])

    return {
        results,
        loading
    }
}