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

export function getSchoolActions(schoolItems) {
    return schoolItems
        .filter(item => {
            if (item.completed) return false

            const days = getDaysUntil(item.due_date)

            return days !== null && days >= 0 && days <= 14
        })
        .map(item => {
            const daysRemaining = getDaysUntil(item.due_date)

            return {
                id: item.id,
                avatar: item.family_members?.avatar_emoji || "🏫",
                title: item.title,
                subtitle: item.family_members?.name || "",
                dueDate: item.due_date,
                daysRemaining,
                label: `Due ${formatDays(daysRemaining)}`
            }
        })
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
}