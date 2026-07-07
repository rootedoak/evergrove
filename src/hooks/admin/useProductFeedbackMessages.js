import { useEffect, useState } from "react"
import { getFeedbackMessages } from "../../services/admin/productFeedbackMessageService"

export default function useProductFeedbackMessages(feedbackId) {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function refreshMessages() {
        if (!feedbackId) return

        setLoading(true)
        setError(null)

        try {
            const data = await getFeedbackMessages(feedbackId)
            setMessages(data)
        } catch (err) {
            console.error("Failed to load feedback messages:", err)
            setError(err)
            setMessages([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshMessages()
    }, [feedbackId])

    return {
        messages,
        loading,
        error,
        refreshMessages
    }
}