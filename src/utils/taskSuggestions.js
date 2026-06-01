function getDaysUntil(dateString) {
    if (!dateString) return null

    const today = new Date()
    const target = new Date(`${dateString}T00:00:00`)

    today.setHours(0, 0, 0, 0)

    const diffMs = target - today
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function getTaskSuggestions(activities) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return activities
        .filter(activity => {
            if (activity.registration_task_created) {
                return false
            }

            if (!activity.registration_open_date) {
                return false
            }

            const openDate = new Date(
                `${activity.registration_open_date}T00:00:00`
            )

            const closeDate = activity.registration_close_date
                ? new Date(
                    `${activity.registration_close_date}T00:00:00`
                )
                : null

            if (today < openDate) {
                return false
            }

            if (closeDate && today > closeDate) {
                return false
            }

            return true
        })
        .map(activity => ({
            activityId: activity.id,
            familyMemberId: activity.family_member_id,
            activityName: activity.name,
            familyMemberName:
                activity.family_members?.name || "Family Member",
            avatar:
                activity.family_members?.avatar_emoji || "📅",
            daysRemaining: getDaysUntil(
                activity.registration_close_date
            ),
            title: `Register ${activity.family_members?.name || "Family Member"} for ${activity.name}`
        }))
        .sort((a, b) => {
            const aDays = a.daysRemaining ?? 999
            const bDays = b.daysRemaining ?? 999

            return aDays - bDays
        })
}