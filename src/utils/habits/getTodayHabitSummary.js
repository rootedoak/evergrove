export default function getTodayHabitSummary({
    habits = [],
    completedToday = []
}) {
    const total = habits.length

    const completed = completedToday.length

    const remaining =
        Math.max(
            0,
            total - completed
        )

    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            )

    const remainingHabits =
        habits.filter(
            habit =>
                !habit.completedToday
        )

    return {
        total,
        completed,
        remaining,
        percentage,
        remainingHabits,
        allComplete:
            total > 0 &&
            remaining === 0
    }
}