import { useEffect, useState } from "react"
import {
    getPersonalInboxItems,
    markInboxItemRead,
    deletePersonalInboxItem
} from "../services/personalInboxService"

export default function usePersonalInbox() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    async function loadItems() {
        try {
            const data = await getPersonalInboxItems()
            setItems(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadItems()

        function handleInboxUpdated() {
            loadItems()
        }

        window.addEventListener(
            "evergrovePersonalInboxUpdated",
            handleInboxUpdated
        )

        return () => {
            window.removeEventListener(
                "evergrovePersonalInboxUpdated",
                handleInboxUpdated
            )
        }
    }, [])

    async function markRead(id) {
        await markInboxItemRead(id)
        await loadItems()
    }

    async function removeItem(id) {
        await deletePersonalInboxItem(id)
        await loadItems()
    }

    return {
        items,
        loading,
        refreshInbox: loadItems,
        markRead,
        removeItem
    }
}