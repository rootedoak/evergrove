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
        const previousItems = items

        setItems(current =>
            current.map(item =>
                item.id === id
                    ? { ...item, status: "read" }
                    : item
            )
        )

        try {
            await markInboxItemRead(id)
        } catch (error) {
            console.error(error)
            setItems(previousItems)
            throw error
        }
    }

    async function removeItem(id) {
        const previousItems = items

        setItems(current =>
            current.filter(item => item.id !== id)
        )

        try {
            await deletePersonalInboxItem(id)
        } catch (error) {
            console.error(error)
            setItems(previousItems)
            throw error
        }
    }

    return {
        items,
        loading,
        refreshInbox: loadItems,
        markRead,
        removeItem
    }
}