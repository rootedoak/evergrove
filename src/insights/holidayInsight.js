import { createInsight } from "./createInsight"
import { getTaskTemplate } from "../utils/taskTemplates"
import { createLocalDate } from "./dateUtils"
import { holidayDefinitions } from "../intelligence/holidayDefinitions"

function getHolidayDate(year, holiday) {
    return [
        year,
        String(holiday.month).padStart(2, "0"),
        String(holiday.day).padStart(2, "0"),
    ].join("-")
}

function getDaysUntil(fromDateString, targetDateString) {
    const fromDate = createLocalDate(fromDateString)
    fromDate.setHours(0, 0, 0, 0)

    const targetDate = createLocalDate(targetDateString)
    targetDate.setHours(0, 0, 0, 0)

    return Math.round((targetDate - fromDate) / (1000 * 60 * 60 * 24))
}

function getActiveHolidayMoment(daysUntil, holiday) {
    return holiday.moments
        .filter(moment =>
            daysUntil <= moment.daysBefore &&
            daysUntil >= 0
        )
        .sort((a, b) => a.daysBefore - b.daysBefore)[0]
}

export default function holidayInsight(context) {
    const todayString = context.data.today
    const year = Number(todayString.slice(0, 4))

    const possibleInsights = holidayDefinitions
        .map(holiday => {
            const holidayDate = getHolidayDate(year, holiday)
            const daysUntil = getDaysUntil(todayString, holidayDate)

            const activeMoment = getActiveHolidayMoment(daysUntil, holiday)

            if (!activeMoment) return null

            return createInsight({
                id: `holiday-${holiday.id}-${activeMoment.template}-${year}`,
                category: "holidays",
                score: (activeMoment.priority || 50) + activeMoment.score,
                icon: holiday.icon,
                title: activeMoment.title,
                description: activeMoment.description,
                actionLabel: activeMoment.actionLabel,

                execute: async (context) => {
                    const tasks = getTaskTemplate(activeMoment.template)

                    for (const taskTitle of tasks) {
                        await context.services.tasks.create(taskTitle)
                    }

                    return {
                        completedTitle: `${holiday.name} checklist created`,
                        completedDescription: `${tasks.length} to-dos were added for ${holiday.name}.`,
                        completedActionLabel: "View To-Dos",
                        completedRoute: "/tasks",
                    }
                },
            })
        })
        .filter(Boolean)

    return possibleInsights.sort((a, b) => b.score - a.score)[0] || null
}