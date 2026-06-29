import { createInsight } from "./createInsight"
import { getTaskTemplate } from "../utils/taskTemplates"
import { createLocalDate } from "./dateUtils"

function getChristmasDate(year) {
    return `${year}-12-25`
}

function getDaysUntil(dateString) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const target = createLocalDate(dateString)
    target.setHours(0, 0, 0, 0)

    return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

export default function holidayInsight(context) {
    const todayString = context.data.today
    const year = Number(todayString.slice(0, 4))

    const christmasDate = getChristmasDate(year)
    const daysUntilChristmas = getDaysUntil(christmasDate)

    if (daysUntilChristmas < 0 || daysUntilChristmas > 45) {
        return null
    }

    return createInsight({
        id: `holiday-christmas-${year}`,
        category: "holidays",
        score: daysUntilChristmas <= 7 ? 98 : 88,
        icon: "🎄",
        title: `Christmas is ${daysUntilChristmas === 0 ? "today" : `in ${daysUntilChristmas} days`}`,
        description: "Evergrove can help your family get ready without the last-minute scramble.",
        actionLabel: "Create Christmas Checklist",

        execute: async (context) => {
            const tasks = getTaskTemplate("christmas")

            for (const taskTitle of tasks) {
                await context.services.tasks.create(taskTitle)
            }

            return {
                completedTitle: "Christmas checklist created",
                completedDescription: `${tasks.length} to-dos were added for your household.`,
                completedActionLabel: "View To-Dos",
                completedRoute: "/tasks",
            }
        },
    })
}