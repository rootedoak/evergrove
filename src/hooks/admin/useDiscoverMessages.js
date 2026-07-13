import {
    useCallback,
    useEffect,
    useState
} from "react"

import {
    getDiscoverMessages
} from "../../services/admin/discoverMessageAdminService"

export default function useDiscoverMessages() {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refreshMessages = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const data =
                await getDiscoverMessages()

            setMessages(data)
        } catch (err) {
            console.error(
                "Failed to load discover messages:",
                err
            )

            setError(err)
            setMessages([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refreshMessages()
    }, [refreshMessages])

    return {
        messages,
        loading,
        error,
        refreshMessages
    }
}