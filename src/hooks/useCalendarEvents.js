import { useEffect, useState } from "react"
import { getCalendarEvents } from "../services/calendarEventService"

export default function useCalendarEvents() {
    const [calendarEvents, setCalendarEvents] = useState([])
    const [loading, setLoading] = useState(true)

    async function refreshCalendarEvents() {
        try {
            const data = await getCalendarEvents()
            setCalendarEvents(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshCalendarEvents()
    }, [])

    return {
        calendarEvents,
        loading,
        refreshCalendarEvents
    }
}