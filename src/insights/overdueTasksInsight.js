import { createInsight } from "./createInsight"

export default function overdueTasksInsight(context) {
    const todayString = context.data.today
    const dinnerTonight = context.data.meals?.dinnerTonight

    const overdueTasks = openTasks.filter(task =>
        task.due_date &&
        task.due_date < todayString &&
        task.status !== "complete"
    )

    if (overdueTasks.length === 0) return null

    return createInsight({
        id: `overdue-tasks-${todayString}`,
        category: "tasks",
        score: overdueTasks.length >= 3 ? 90 : 75,
        icon: "⚠️",
        title: `${overdueTasks.length} overdue to-do${overdueTasks.length === 1 ? "" : "s"}`,
        description: "A quick review can help keep the household moving.",
        actionLabel: "Review To-Dos",

        execute: async ({ navigate }) => {
            context.actions.navigate("/tasks?filter=overdue")

            return {
                completedTitle: "Overdue to-dos opened",
                completedDescription: "You can review overdue household tasks now.",
                completedActionLabel: "View To-Dos",
                completedRoute: "/tasks",
            }
        },
    })
}