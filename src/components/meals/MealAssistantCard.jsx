import InsightCard from "../dashboard/InsightCard"

export default function MealAssistantCard({
    dinnerTonight,
    plannedDaysCount,
    openGroceryCount,
    onGenerateShoppingList,
    onPlanTonight
}) {
    const hasDinner = Boolean(dinnerTonight)
    const remainingDays = Math.max(0, 7 - plannedDaysCount)

    const insight = {
        title: hasDinner
            ? `${dinnerTonight.meal_name} is planned for tonight`
            : "Dinner is not planned",

        description: hasDinner
            ? dinnerTonight.notes || "Everything looks ready for tonight."
            : `${remainingDays} dinner${remainingDays === 1 ? "" : "s"} still need planning this week.`,

        actionLabel: hasDinner
            ? "Edit Tonight"
            : "Plan Dinner",

        actionType: hasDinner
            ? "edit"
            : "plan",

        actionType: hasDinner && openGroceryCount > 0
            ? "shopping"
            : "plan"
    }

    function handleAction(activeInsight) {
        switch (activeInsight.actionType) {
            case "edit":
                onPlanTonight()   // We'll make this open today's dinner for editing
                break

            case "plan":
                onPlanTonight()   // Opens today's quick add
                break

            default:
                onPlanTonight()
        }
    }

    return (
        <InsightCard
            insight={insight}
            onAction={handleAction}
        />
    )
}