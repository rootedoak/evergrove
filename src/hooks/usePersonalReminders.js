import { useEffect, useState } from "react"

import {
    getPersonalReminders,
    createPersonalReminder,
    updatePersonalReminder,
    deletePersonalReminder
} from "../services/personalReminderService"

export default function usePersonalReminders() {
    const [reminders, setReminders] = useState([])
    const [loading, setLoading] = useState(true)

    async function loadReminders() {
        setLoading(true)

        const data = await getPersonalReminders()

        setReminders(data)
        setLoading(false)
    }

    useEffect(() => {
        loadReminders()
    }, [])

    async function addReminder(payload) {
        await createPersonalReminder(payload)
        await loadReminders()
    }

    async function updateReminder(id, payload) {
        await updatePersonalReminder(id, payload)
        await loadReminders()
    }

    async function removeReminder(id) {
        await deletePersonalReminder(id)
        await loadReminders()
    }

    return {
        reminders,
        loading,
        refreshReminders: loadReminders,
        addReminder,
        updateReminder,
        removeReminder
    }
}