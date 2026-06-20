import { useEffect, useState } from "react"

import {
    getFeedEvents,
    createFeedEvent,
    deleteFeedEvent,
} from "../services/feedService"

export default function useHouseholdFeed(limit = 25) {
    const [feedEvents, setFeedEvents] = useState([])
    const [loading, setLoading] = useState(true)

    async function loadFeedEvents() {
        setLoading(true)

        try {
            const data = await getFeedEvents(limit)
            setFeedEvents(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFeedEvents()
    }, [limit])

    async function addFeedEvent(event) {
        const created = await createFeedEvent(event)

        setFeedEvents((current) => [
            created,
            ...current,
        ])

        return created
    }

    async function removeFeedEvent(id) {
        await deleteFeedEvent(id)

        setFeedEvents((current) =>
            current.filter((event) => event.id !== id)
        )
    }

    return {
        feedEvents,
        loading,
        loadFeedEvents,
        addFeedEvent,
        removeFeedEvent,
    }
}