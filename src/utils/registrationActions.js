function getDaysUntil(dateString) {
    if (!dateString) return null

    const today = new Date()
    const target = new Date(`${dateString}T00:00:00`)

    today.setHours(0, 0, 0, 0)

    const diffMs = target - today
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function formatDays(days) {
    if (days === 0) return "today"
    if (days === 1) return "tomorrow"
    return `in ${days} days`
}

export function getRegistrationActions(activities) {
    return activities
        .flatMap(activity => {
            const member = activity.family_members
            const actions = []

            const openDays = getDaysUntil(activity.registration_open_date)
            const closeDays = getDaysUntil(activity.registration_close_date)

            if (closeDays !== null && closeDays >= 0 && closeDays <= 7) {
                actions.push({
                    id: `${activity.id}-close-action`,
                    priority: closeDays,
                    urgency: closeDays <= 1 ? "high" : "medium",
                    avatar: member?.avatar_emoji || "📅",
                    title: `${activity.name} registration closes ${formatDays(closeDays)}`,
                    subtitle: member?.name || "No family member assigned",
                    date: activity.registration_close_date
                })
            }

            if (openDays !== null && openDays >= 0 && openDays <= 14) {
                actions.push({
                    id: `${activity.id}-open-action`,
                    priority: openDays + 20,
                    urgency: openDays <= 1 ? "medium" : "low",
                    avatar: member?.avatar_emoji || "📅",
                    title: `${activity.name} registration opens ${formatDays(openDays)}`,
                    subtitle: member?.name || "No family member assigned",
                    date: activity.registration_open_date
                })
            }

            return actions
        })
        .sort((a, b) => a.priority - b.priority)
}