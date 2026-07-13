import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react"

import {
    dismissDiscoverMessage,
    getNextDiscoverMessage,
    markDiscoverMessageSeen,
    trackDiscoverMessageAction
} from "../services/discoverMessageService"

export default function useDiscoverMessage({
    enabled = true
} = {}) {
    const [message, setMessage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [dismissing, setDismissing] = useState(false)

    const seenMessageIdsRef = useRef(new Set())

    const loadMessage = useCallback(async () => {
        if (!enabled) {
            setMessage(null)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const nextMessage =
                await getNextDiscoverMessage()

            setMessage(nextMessage)
        } catch (err) {
            console.error(
                "Failed to load discover message:",
                err
            )

            setError(err)
            setMessage(null)
        } finally {
            setLoading(false)
        }
    }, [enabled])

    useEffect(() => {
        loadMessage()
    }, [loadMessage])

    useEffect(() => {
        if (!message?.id) return

        if (
            seenMessageIdsRef.current.has(message.id)
        ) {
            return
        }

        seenMessageIdsRef.current.add(message.id)

        markDiscoverMessageSeen(message.id).catch(err => {
            console.error(
                "Failed to mark discover message seen:",
                err
            )

            seenMessageIdsRef.current.delete(message.id)
        })
    }, [message?.id])

    const dismiss = useCallback(async () => {
        if (!message?.id || dismissing) return

        setDismissing(true)
        setError(null)

        try {
            await dismissDiscoverMessage(message.id)
            setMessage(null)
        } catch (err) {
            console.error(
                "Failed to dismiss discover message:",
                err
            )

            setError(err)
        } finally {
            setDismissing(false)
        }
    }, [message?.id, dismissing])

    const trackAction = useCallback(async () => {
        if (!message?.id) return

        try {
            await trackDiscoverMessageAction(
                message.id
            )
        } catch (err) {
            console.error(
                "Failed to track discover message action:",
                err
            )
        }
    }, [message?.id])

    return {
        message,
        loading,
        error,
        dismissing,
        dismiss,
        trackAction,
        refresh: loadMessage
    }
}