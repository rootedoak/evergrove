import { useEffect, useState } from "react"
import { getFeedbackHistory } from "../../services/admin/productFeedbackHistoryService"

export default function useProductFeedbackHistory(feedbackId) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function refreshHistory() {
        if (!feedbackId) return

        setLoading(true)
        setError(null)

        try {
            const data = await getFeedbackHistory(feedbackId)
            setHistory(data)
        } catch (err) {
            console.error("Failed to load feedback history:", err)
            setError(err)
            setHistory([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshHistory()
    }, [feedbackId])

    return {
        history,
        loading,
        error,
        refreshHistory
    }
}