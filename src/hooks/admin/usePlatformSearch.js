import { useEffect, useState } from "react"
import { searchPlatform } from "../../services/admin/platformService"

export default function usePlatformSearch(searchTerm) {
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function load() {
            if (!searchTerm?.trim()) {
                setResults([])
                setLoading(false)
                return
            }

            setLoading(true)

            try {
                const data = await searchPlatform(searchTerm)

                if (!cancelled) {
                    setResults(data)
                }
            } catch (error) {
                console.error("Platform search failed:", error)

                if (!cancelled) {
                    setResults([])
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