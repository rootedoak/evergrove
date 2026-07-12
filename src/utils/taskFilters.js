import {
    addDays,
    getLocalDateString,
    isDateInCurrentWeek,
    isTodayOrPast
} from "./dateUtils"

export function getTaskAssigneeType(
    task,
    currentMemberId,
    currentUserId,
    childMemberIds = []
) {
    // Assigned to the signed-in family member
    if (task.family_member_id === currentMemberId) {
        return "mine"
    }

    // My private task with no assignee
    if (
        !task.family_member_id &&
        task.visibility === "private" &&
        task.user_id === currentUserId
    ) {
        return "mine"
    }

    // Household task with no assignee
    if (!task.family_member_id) {
        return "family"
    }

    // Assigned to one of the kids
    if (childMemberIds.includes(task.family_member_id)) {
        return "kids"
    }

    // Assigned to another adult
    return "other"
}

export function filterTasksByScope(
    tasks,
    scope = "mine_family",
    currentMemberId,
    currentUserId,
    childMemberIds = []
) {
    return tasks.filter(task => {
        const assigneeType = getTaskAssigneeType(
            task,
            currentMemberId,
            currentUserId,
            childMemberIds
        )

        if (scope === "mine") {
            return assigneeType === "mine"
        }

        if (scope === "mine_family") {
            return (
                assigneeType === "mine" ||
                assigneeType === "family"
            )
        }

        if (scope === "family") {
            return assigneeType === "family"
        }

        if (scope === "kids") {
            return assigneeType === "kids"
        }

        return true
    })
}

export function filterDashboardTasks(
    tasks,
    window = "this_week",
    weekStartsOn = "sunday"
) {
    const openTasks = tasks.filter(
        task => task.status !== "complete"
    )

    if (window === "today") {
        return openTasks.filter(task =>
            isTodayOrPast(task.due_date)
        )
    }

    if (window === "next_7_days") {
        const todayKey = getLocalDateString()
        const limitKey = getLocalDateString(
            addDays(new Date(), 7)
        )

        return openTasks.filter(task => {
            if (!task.due_date) return false

            return (
                task.due_date >= todayKey &&
                task.due_date <= limitKey
            )
        })
    }

    return openTasks.filter(task =>
        isDateInCurrentWeek(
            task.due_date,
            weekStartsOn
        )
    )
}