import { useCallback, useEffect, useState } from "react"
import { getProductFeedbackDetail } from "../../services/admin/productFeedbackDetailService"

export default function useProductFeedbackDetail(id) {
    const [ticket, setTicket] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refreshTicket = useCallback(async () => {
        if (!id) return

        setLoading(true)
        setError(null)

        try {
            const data = await getProductFeedbackDetail(id)
            setTicket(data)
        } catch (err) {
            console.error("Failed to load support ticket:", err)
            setError(err)
            setTicket(null)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        refreshTicket()
    }, [refreshTicket])

    return {
        ticket,
        loading,
        error,
        refreshTicket
    }
}