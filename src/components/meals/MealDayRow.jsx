import { ChevronRight, Plus } from "lucide-react"

export default function MealDayRow({
    day,
    plans,
    onClick
}) {
    const firstPlan = plans[0]

    const mealName =
        firstPlan?.meal_name || "Plan dinner"

    const icon =
        firstPlan?.plan_type === "restaurant"
            ? "🍽️"
            : firstPlan?.plan_type === "leftovers"
                ? "🥡"
                : firstPlan
                    ? "🍽️"
                    : null

    return (
        <button
            type="button"
            className="eg-meal-day-row"
            onClick={onClick}
        >
            <div className="eg-meal-day-date">
                <strong>{day.dayLabel}</strong>
                <span>{day.dateLabel}</span>
            </div>

            <div className="eg-meal-day-main">
                {icon ? (
                    <span className="eg-meal-icon">
                        {icon}
                    </span>
                ) : (
                    <Plus size={18} />
                )}

                <span className={firstPlan ? "" : "muted"}>
                    {mealName}
                </span>
            </div>

            <ChevronRight size={18} />
        </button>
    )
}