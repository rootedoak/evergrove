import { getDateStringOffset } from "./dateUtils"
import { createInsight } from "./createInsight"

export default function tomorrowScheduleInsight(context) {
    const { todayString, allEvents = [] } = context
    const tomorrowString = getDateStringOffset(todayString, 1)

    const tomorrowEvents = allEvents.filter(event =>
        event.date === tomorrowString
    )

    if (tomorrowEvents.length === 0) return null

    return createInsight({
        id: `tomorrow-schedule-${tomorrowString}`,
        category: "calendar",
        score: tomorrowEvents.length >= 3 ? 85 : 60,
        icon: "📅",
        title: `${tomorrowEvents.length} thing${tomorrowEvents.length === 1 ? "" : "s"} tomorrow`,
        description: `First up: ${tomorrowEvents[0].title}`,
        actionLabel: "View Tomorrow",
        payload: {
            date: tomorrowString
        },

        execute: async ({ navigate }) => {
            navigate("/calendar", {
                state: {
                    selectedDate: tomorrowString
                }
            })

            return {
                completedTitle: "Tomorrow opened",
                completedDescription: "Your family timeline is ready to review.",
                completedActionLabel: "View Calendar",
                completedRoute: "/calendar",
            }
        },
    })
}