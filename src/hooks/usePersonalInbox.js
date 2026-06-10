import { useEffect, useState } from "react"

import {
    getPersonalInboxItems,
    markInboxItemRead,
    deletePersonalInboxItem
} from "../services/personalInboxService"

export default function usePersonalInbox() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    async function loadInbox() {
        setLoading(true)

        const data = await getPersonalInboxItems()

        setItems(data)
        setLoading(false)
    }

    useEffect(() => {
        loadInbox()
    }, [])

    async function markRead(id) {
        await markInboxItemRead(id)
        await loadInbox()
    }

    async function removeItem(id) {
        await deletePersonalInboxItem(id)
        await loadInbox()
    }

    return {
        items,
        loading,
        refreshInbox: loadInbox,
        markRead,
        removeItem
    }
}