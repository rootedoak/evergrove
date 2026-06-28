function createLocalDate(dateString) {
    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number)

    return new Date(year, month - 1, day)
}

function getDateStringOffset(baseDateString, offsetDays) {
    const date = createLocalDate(baseDateString)
    date.setDate(date.getDate() + offsetDays)

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-")
}

function getHour() {
    return new Date().getHours()
}

function noDinnerInsight({ dinnerTonight }) {
    if (dinnerTonight) return null

    const hour = getHour()

    let score = 45
    if (hour >= 12) score = 70
    if (hour >= 16) score = 95

    return {
        id: "no-dinner-planned",
        score,
        icon: "🍽️",
        title: "Dinner is not planned yet",
        description: "A quick dinner plan can help the evening go smoother.",
        actionLabel: "Plan Dinner",
        actionType: "plan_dinner",
    }
}

function tomorrowScheduleInsight({ todayString, allEvents }) {
    const tomorrowString = getDateStringOffset(todayString, 1)

    const tomorrowEvents = allEvents.filter(event =>
        event.date === tomorrowString
    )

    if (tomorrowEvents.length === 0) return null

    return {
        id: "tomorrow-schedule",
        score: tomorrowEvents.length >= 3 ? 85 : 60,
        icon: "📅",
        title: `${tomorrowEvents.length} thing${tomorrowEvents.length === 1 ? "" : "s"} tomorrow`,
        description: `First up: ${tomorrowEvents[0].title}`,
        actionLabel: "View Tomorrow",
        actionType: "view_tomorrow",
        payload: {
            date: tomorrowString
        }
    }
}

function overdueTasksInsight({ todayString, openTasks }) {
    const overdueTasks = openTasks.filter(task =>
        task.due_date &&
        task.due_date < todayString &&
        task.status !== "complete"
    )

    if (overdueTasks.length === 0) return null

    return {
        id: "overdue-tasks",
        score: overdueTasks.length >= 3 ? 90 : 75,
        icon: "⚠️",
        title: `${overdueTasks.length} overdue to-do${overdueTasks.length === 1 ? "" : "s"}`,
        description: "A quick review can help keep the household moving.",
        actionLabel: "Review To-Dos",
        actionType: "review_tasks",
    }
}

function birthdayTomorrowInsight({ todayString, allEvents }) {
    const tomorrowString = getDateStringOffset(todayString, 1)

    const birthday = allEvents.find(event => {
        const type = String(event.type || event.event_type || event.sourceType || "").toLowerCase()
        const subtitle = String(event.subtitle || "").toLowerCase()
        const title = String(event.title || "").toLowerCase()

        return (
            event.date === tomorrowString &&
            (
                type.includes("birthday") ||
                subtitle.includes("birthday") ||
                title.includes("birthday")
            )
        )
    })

    if (!birthday) return null

    return {
        id: "birthday-tomorrow",
        score: 100,
        icon: "🎂",
        title: `${birthday.title} is tomorrow`,
        description: "You still have time to handle gifts, cake, or family plans.",
        actionLabel: "Create Checklist",
        actionType: "birthday_checklist",
        payload: {
            event: birthday
        }
    }
}

export function getEvergroveInsights({
    todayString,
    dinnerTonight,
    todayEvents = [],
    allEvents = [],
    openTasks = [],
}) {
    const context = {
        todayString,
        dinnerTonight,
        todayEvents,
        allEvents,
        openTasks,
    }

    return [
        birthdayTomorrowInsight(context),
        noDinnerInsight(context),
        tomorrowScheduleInsight(context),
        overdueTasksInsight(context),
    ]
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
}