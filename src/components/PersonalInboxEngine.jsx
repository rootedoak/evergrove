import { useEffect } from "react"

import {
    getPersonalInboxItems,
    createPersonalInboxItem
} from "../services/personalInboxService"

import {
    getPersonalReminders,
    updatePersonalReminder
} from "../services/personalReminderService"

function getTodayString() {
    const today = new Date()

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-")
}

function addDays(dateString, days) {
    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    date.setDate(date.getDate() + days)

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-")
}

function addMonths(dateString, months) {
    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    date.setMonth(date.getMonth() + months)

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-")
}

function addYears(dateString, years) {
    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    date.setFullYear(date.getFullYear() + years)

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-")
}

function getNextDueDate(reminder) {
    if (!reminder.next_due) return null

    if (reminder.frequency === "weekly") {
        return addDays(reminder.next_due, 7)
    }

    if (reminder.frequency === "monthly") {
        return addMonths(reminder.next_due, 1)
    }

    if (reminder.frequency === "yearly") {
        return addYears(reminder.next_due, 1)
    }

    return null
}

export default function PersonalInboxEngine() {
    useEffect(() => {
        let isMounted = true

        async function processDueReminders() {
            try {
                const today = getTodayString()
                const reminders = await getPersonalReminders()
                const inboxItems = await getPersonalInboxItems()

                const dueReminders = reminders.filter(reminder => {
                    return (
                        reminder.is_active !== false &&
                        reminder.next_due &&
                        reminder.next_due <= today
                    )
                })

                for (const reminder of dueReminders) {
                    if (!isMounted) return

                    const alreadyCreated = inboxItems.some(item => {
                        return (
                            item.related_type === "personal_reminder" &&
                            item.related_id === reminder.id &&
                            item.due_date === reminder.next_due
                        )
                    })

                    if (!alreadyCreated) {
                        await createPersonalInboxItem({
                            title: reminder.title,
                            message: reminder.notes || null,
                            item_type: "reminder",
                            related_type: "personal_reminder",
                            related_id: reminder.id,
                            due_date: reminder.next_due
                        })
                    }

                    const nextDue = getNextDueDate(reminder)

                    await updatePersonalReminder(reminder.id, {
                        next_due: nextDue,
                        is_active: Boolean(nextDue)
                    })
                }
            } catch (error) {
                console.error("Personal inbox reminder engine failed", error)
            }
        }

        processDueReminders()

        return () => {
            isMounted = false
        }
    }, [])

    return null
}