import { getDateStringOffset } from "./dateUtils"
import { createInsight } from "./createInsight"
import { getTaskTemplate } from "../utils/taskTemplates"

export default function birthdayInsight(context) {
    const todayString = context.data.today
    const allEvents = context.data.calendar || []
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

    const name =
        birthday.title
            ?.replace("'s birthday", "")
            ?.replace(" birthday", "") ||
        "them"

    return createInsight({
        id: `birthday-${birthday.sourceId || birthday.id}-${birthday.date}`,
        category: "calendar",
        score: 100,
        icon: "🎂",
        title: `${birthday.title} is tomorrow`,
        description: "You still have time to handle gifts, cake, or family plans.",
        actionLabel: "Create Checklist",

        execute: async (context) => {
            const tasks = getTaskTemplate("birthday", { name })

            for (const taskTitle of tasks) {
                await context.services.tasks.create(taskTitle)
            }

            return {
                completedTitle: "Birthday checklist created",
                completedDescription: `${tasks.length} to-dos were added for ${name}.`,
                completedActionLabel: "View To-Dos",
                completedRoute: "/tasks",
            }
        },
    })
}