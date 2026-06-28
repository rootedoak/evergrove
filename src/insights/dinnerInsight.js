import { createInsight } from "./createInsight"

function getHour() {
    return new Date().getHours()
}

export default function dinnerInsight(context) {
    const todayString = context.data.today
    const dinnerTonight = context.data.meals?.dinnerTonight

    if (dinnerTonight) return null

    const hour = getHour()

    let score = 45
    if (hour >= 12) score = 70
    if (hour >= 16) score = 95

    return createInsight({
        id: `no-dinner-${todayString}`,
        category: "meals",
        score,
        icon: "🍽️",
        title: "Dinner is not planned yet",
        description: "A quick dinner plan can help the evening go smoother.",
        actionLabel: "Plan Dinner",

        execute: async ({ navigate }) => {
            navigate("/meals")

            return {
                completedTitle: "Meal planning opened",
                completedDescription: "You can plan dinner from the Meals page.",
                completedActionLabel: "Go to Meals",
                completedRoute: "/meals",
            }
        },
    })
}