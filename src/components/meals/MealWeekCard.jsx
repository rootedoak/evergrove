import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"

import SectionCard from "../ui/SectionCard"
import Button from "../ui/Button"

export default function MealWeekCard({
    weekDays,
    weekMealPlans,
    meals,
    dayQuickAdd,
    setDayQuickAdd,
    startDayQuickAdd,
    cancelDayQuickAdd,
    handleDayQuickAdd,
    deleteMealPlan,
    setMealPlans,
    mealPlans,
    setWeekStart,
    weekStart,
    addDays,
    getStartOfWeek,
    handleGenerateWeek
}) {
    function getPlanIcon(plan) {
        if (!plan) return null
        if (plan.plan_type === "restaurant") return "🍽️"
        if (plan.plan_type === "leftovers") return "🥡"
        return "🍽️"
    }

    return (
        <SectionCard
            title="This Week"
            subtitle={`${weekDays[0].dateLabel} - ${weekDays[6].dateLabel}`}
            actions={
                <Button variant="secondary" size="sm" onClick={handleGenerateWeek}>
                    <Plus size={16} />
                    Generate
                </Button>
            }
        >
            <div className="eg-week-controls">
                <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                    <ChevronLeft size={16} />
                    Previous
                </Button>

                <Button variant="ghost" size="sm" onClick={() => setWeekStart(getStartOfWeek(new Date()))}>
                    This Week
                </Button>

                <Button variant="ghost" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                    Next
                    <ChevronRight size={16} />
                </Button>
            </div>

            <div className="eg-meal-week-list compact">
                {weekDays.map(day => {
                    const plans = weekMealPlans[day.dateValue] || []
                    const isAdding = dayQuickAdd.dateValue === day.dateValue

                    return (
                        <div key={day.dateValue} className="eg-meal-day-row-wrap">
                            <button
                                type="button"
                                className="eg-meal-day-row"
                                onClick={() => {
                                    if (isAdding) {
                                        cancelDayQuickAdd()
                                        return
                                    }

                                    startDayQuickAdd(day.dateValue)
                                }}
                            >
                                <div className="eg-meal-day-date">
                                    <strong>{day.dayLabel}</strong>
                                    <span>{day.dateLabel}</span>
                                </div>

                                <div className="eg-meal-day-main">
                                    {plans.length === 0 ? (
                                        <>
                                            <span className="eg-meal-add-icon">+</span>
                                            <span className="muted">Plan dinner</span>
                                        </>
                                    ) : (
                                        <div className="eg-meal-plan-stack">
                                            {plans.map(plan => (
                                                <span key={plan.id} className="eg-meal-plan-pill">
                                                    <span>{getPlanIcon(plan)}</span>
                                                    {plan.meal_name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <ChevronRight size={18} />
                            </button>

                            {plans.length > 0 && (
                                <div className="eg-meal-plan-actions">
                                    {plans.map(plan => (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            className="eg-danger-icon-button"
                                            onClick={async event => {
                                                event.stopPropagation()

                                                const previousMealPlans = mealPlans

                                                setMealPlans(current =>
                                                    current.filter(item => item.id !== plan.id)
                                                )

                                                try {
                                                    await deleteMealPlan(plan.id)
                                                } catch (error) {
                                                    console.error(error)
                                                    setMealPlans(previousMealPlans)
                                                    alert(error.message || "Could not delete meal plan.")
                                                }
                                            }}
                                            aria-label="Delete meal plan"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {isAdding && (
                                <div className="eg-quick-add-panel">
                                    <select
                                        className="form-input"
                                        value={dayQuickAdd.planType}
                                        onChange={event =>
                                            setDayQuickAdd({
                                                ...dayQuickAdd,
                                                planType: event.target.value,
                                                mealId: "",
                                                restaurantName: ""
                                            })
                                        }
                                    >
                                        <option value="home">Home Meal</option>
                                        <option value="restaurant">Restaurant Night</option>
                                        <option value="leftovers">Leftovers</option>
                                    </select>

                                    {dayQuickAdd.planType === "restaurant" ? (
                                        <input
                                            className="form-input"
                                            value={dayQuickAdd.restaurantName}
                                            onChange={event =>
                                                setDayQuickAdd({
                                                    ...dayQuickAdd,
                                                    restaurantName: event.target.value
                                                })
                                            }
                                            placeholder="Restaurant name"
                                        />
                                    ) : dayQuickAdd.planType === "leftovers" ? (
                                        <input className="form-input" value="Leftovers" disabled />
                                    ) : (
                                        <select
                                            className="form-input"
                                            value={dayQuickAdd.mealId}
                                            onChange={event =>
                                                setDayQuickAdd({
                                                    ...dayQuickAdd,
                                                    mealId: event.target.value
                                                })
                                            }
                                        >
                                            <option value="">Choose a meal</option>

                                            {meals.map(meal => (
                                                <option key={meal.id} value={meal.id}>
                                                    {meal.is_favorite ? "⭐ " : ""}
                                                    {meal.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    <input
                                        className="form-input"
                                        value={dayQuickAdd.notes}
                                        onChange={event =>
                                            setDayQuickAdd({
                                                ...dayQuickAdd,
                                                notes: event.target.value
                                            })
                                        }
                                        placeholder="Notes"
                                    />

                                    <div className="eg-actions-row">
                                        <Button size="sm" onClick={handleDayQuickAdd}>
                                            Add Meal
                                        </Button>

                                        <Button variant="secondary" size="sm" onClick={cancelDayQuickAdd}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </SectionCard>
    )
}