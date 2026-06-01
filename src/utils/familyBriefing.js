function getDaysUntil(dateString) {
    if (!dateString) return null

    const today = new Date()
    const target = new Date(`${dateString}T00:00:00`)

    today.setHours(0, 0, 0, 0)

    const diffMs = target - today
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function buildFamilyBriefing({
    activities = [],
    tasks = [],
    schoolItems = [],
    documents = []
}) {
    const openTasks = tasks.filter(task => task.status !== "complete")

    const schoolDueSoon = schoolItems.filter(item => {
        if (item.completed) return false

        const days = getDaysUntil(item.due_date)
        return days !== null && days >= 0 && days <= 7
    })

    const registrationsClosingSoon = activities.filter(activity => {
        const days = getDaysUntil(activity.registration_close_date)
        return days !== null && days >= 0 && days <= 7
    })

    const registrationsOpeningSoon = activities.filter(activity => {
        const days = getDaysUntil(activity.registration_open_date)
        return days !== null && days >= 0 && days <= 7
    })

    const upcomingEvents = [
        ...activities.flatMap(activity => [
            activity.registration_open_date,
            activity.registration_close_date,
            activity.start_date,
            activity.end_date
        ]),
        ...tasks.map(task => task.due_date),
        ...schoolItems.map(item => item.due_date)
    ].filter(date => {
        const days = getDaysUntil(date)
        return days !== null && days >= 0 && days <= 30
    })

    const highlights = []

    if (schoolDueSoon.length > 0) {
        highlights.push({
            icon: "🏫",
            title: `${schoolDueSoon.length} school item${schoolDueSoon.length === 1 ? "" : "s"} due this week`
        })
    }

    if (registrationsClosingSoon.length > 0) {
        highlights.push({
            icon: "⏳",
            title: `${registrationsClosingSoon.length} registration${registrationsClosingSoon.length === 1 ? "" : "s"} closing soon`
        })
    }

    if (registrationsOpeningSoon.length > 0) {
        highlights.push({
            icon: "📣",
            title: `${registrationsOpeningSoon.length} registration${registrationsOpeningSoon.length === 1 ? "" : "s"} opening soon`
        })
    }

    if (openTasks.length > 0) {
        highlights.push({
            icon: "✅",
            title: `${openTasks.length} open task${openTasks.length === 1 ? "" : "s"}`
        })
    }

    if (documents.length > 0) {
        highlights.push({
            icon: "📄",
            title: `${documents.length} document${documents.length === 1 ? "" : "s"} stored`
        })
    }

    highlights.push({
        icon: "📅",
        title: `${upcomingEvents.length} upcoming timeline event${upcomingEvents.length === 1 ? "" : "s"} in the next 30 days`
    })

    return {
        highlights,
        counts: {
            openTasks: openTasks.length,
            schoolDueSoon: schoolDueSoon.length,
            registrationsClosingSoon: registrationsClosingSoon.length,
            registrationsOpeningSoon: registrationsOpeningSoon.length,
            documents: documents.length,
            upcomingEvents: upcomingEvents.length
        }
    }
}