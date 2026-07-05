import { useEffect, useState } from "react"
import { getProductFeedback } from "../../services/admin/productFeedbackAdminService"

export default function useProductFeedback() {
    const [feedback, setFeedback] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)

            try {
                const data = await getProductFeedback()

                if (!cancelled) {
                    setFeedback(data)
                }
            } catch (err) {
                console.error("Failed to load product feedback:", err)

                if (!cancelled) {
                    setError(err)
                    setFeedback([])
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
    }, [])

    return {
        feedback,
        loading,
        error
    }
}