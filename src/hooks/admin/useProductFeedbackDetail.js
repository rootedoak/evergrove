import {
    useCallback,
    useEffect,
    useState
} from "react"

import {
    getFeedbackAttachmentUrl,
    getProductFeedbackDetail
} from "../../services/admin/productFeedbackAdminService"

export default function useProductFeedbackDetail(id) {
    const [ticket, setTicket] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refreshTicket = useCallback(async () => {
        if (!id) {
            setTicket(null)
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const ticketData =
                await getProductFeedbackDetail(id)

            let attachmentUrl = null

            if (ticketData?.attachment_path) {
                attachmentUrl =
                    await getFeedbackAttachmentUrl(
                        ticketData.attachment_path
                    )
            }

            setTicket({
                ...ticketData,
                attachment_url: attachmentUrl
            })
        } catch (err) {
            console.error(
                "Failed to load support ticket:",
                err
            )

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