import { useState } from "react"
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2
} from "lucide-react"

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
    mealPlanComponents,
    createMealPlanComponent,
    deleteMealPlanComponent,
    shoppingCategoryOrder,
    deleteMealPlan,
    setWeekStart,
    weekStart,
    addDays,
    getStartOfWeek,
    handleGenerateWeek,
    weekEventCounts
}) {
    const [sideFormPlanId, setSideFormPlanId] =
        useState(null)

    const [sideForm, setSideForm] = useState({
        name: "",
        quantity: "",
        category: ""
    })

    function openSideForm(planId) {
        setSideFormPlanId(planId)

        setSideForm({
            name: "",
            quantity: "",
            category: ""
        })
    }

    function closeSideForm() {
        setSideFormPlanId(null)

        setSideForm({
            name: "",
            quantity: "",
            category: ""
        })
    }

    async function handleAddSide(planId) {
        const trimmedName =
            sideForm.name.trim()

        if (!trimmedName) return

        const formSnapshot = {
            mealPlanId: planId,
            name: trimmedName,
            quantity: sideForm.quantity,
            category: sideForm.category
        }

        closeSideForm()

        try {
            await createMealPlanComponent(
                formSnapshot
            )
        } catch (error) {
            console.error(error)
        }
    }

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
            action={
                <Button variant="secondary" size="sm" onClick={handleGenerateWeek}>
                    <Plus size={16} />
                    Plan My Week
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
                            <div
                                className="eg-meal-day-row"
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                    if (isAdding) {
                                        cancelDayQuickAdd()
                                        return
                                    }

                                    startDayQuickAdd(day.dateValue)
                                }}
                                onKeyDown={event => {
                                    if (
                                        event.key !== "Enter" &&
                                        event.key !== " "
                                    ) {
                                        return
                                    }

                                    event.preventDefault()

                                    if (isAdding) {
                                        cancelDayQuickAdd()
                                        return
                                    }

                                    startDayQuickAdd(day.dateValue)
                                }}
                            >
                                <div className="eg-meal-day-content">
                                    <div className="eg-meal-day-header">
                                        <div className="eg-meal-day-date">
                                            <strong>{day.dayLabel}</strong>
                                            <span>{day.dateLabel}</span>
                                        </div>

                                        {weekEventCounts?.[day.dateValue] > 0 && (
                                            <span
                                                className="eg-calendar-count"
                                                aria-label={
                                                    `${weekEventCounts[day.dateValue]} ${weekEventCounts[day.dateValue] === 1
                                                        ? "calendar event"
                                                        : "calendar events"
                                                    }`
                                                }
                                                title={
                                                    `${weekEventCounts[day.dateValue]} ${weekEventCounts[day.dateValue] === 1
                                                        ? "calendar event"
                                                        : "calendar events"
                                                    }`
                                                }
                                            >
                                                <CalendarDays
                                                    size={13}
                                                    className="eg-calendar-count-icon"
                                                    aria-hidden="true"
                                                />

                                                <span>
                                                    {weekEventCounts[day.dateValue]}
                                                </span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="eg-meal-day-main">
                                        {plans.length === 0 ? (
                                            <>
                                                <span className="eg-meal-add-icon">
                                                    +
                                                </span>

                                                <span className="muted">
                                                    Plan dinner
                                                </span>
                                            </>
                                        ) : (
                                            <div className="eg-meal-plan-stack">
                                                {plans.map(plan => {
                                                    const sides =
                                                        mealPlanComponents.filter(
                                                            component =>
                                                                component.meal_plan_id ===
                                                                plan.id
                                                        )

                                                    const isSideFormOpen =
                                                        sideFormPlanId === plan.id

                                                    return (
                                                        <div
                                                            key={plan.id}
                                                            className="eg-meal-plan-entry"
                                                            onClick={event =>
                                                                event.stopPropagation()
                                                            }
                                                        >
                                                            <div className="eg-meal-plan-entry-header">
                                                                <div className="eg-meal-plan-title">
                                                                    <span
                                                                        className="eg-meal-plan-icon"
                                                                        aria-hidden="true"
                                                                    >
                                                                        {getPlanIcon(plan)}
                                                                    </span>

                                                                    <span>
                                                                        {plan.meal_name}
                                                                    </span>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    className="eg-danger-icon-button"
                                                                    onClick={() =>
                                                                        deleteMealPlan(plan.id)
                                                                    }
                                                                    aria-label={`Delete ${plan.meal_name}`}
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>

                                                            {sides.length > 0 && (
                                                                <div className="eg-meal-sides">
                                                                    <span className="eg-meal-sides-label">
                                                                        Sides
                                                                    </span>

                                                                    <div className="eg-meal-side-list">
                                                                        {sides.map(side => (
                                                                            <div
                                                                                key={side.id}
                                                                                className={[
                                                                                    "eg-meal-side-row",
                                                                                    side.isOptimistic
                                                                                        ? "is-saving"
                                                                                        : ""
                                                                                ]
                                                                                    .filter(Boolean)
                                                                                    .join(" ")}
                                                                            >
                                                                                <div className="eg-meal-side-details">
                                                                                    <span className="eg-meal-side-bullet">
                                                                                        •
                                                                                    </span>

                                                                                    <span>
                                                                                        {side.name}
                                                                                    </span>

                                                                                    {side.quantity && (
                                                                                        <span className="eg-meal-side-quantity">
                                                                                            {side.quantity}
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                <button
                                                                                    type="button"
                                                                                    className="eg-meal-side-delete"
                                                                                    onClick={() =>
                                                                                        deleteMealPlanComponent(
                                                                                            side.id
                                                                                        )
                                                                                    }
                                                                                    disabled={
                                                                                        side.isOptimistic
                                                                                    }
                                                                                    aria-label={`Remove ${side.name}`}
                                                                                >
                                                                                    <Trash2 size={13} />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {isSideFormOpen ? (
                                                                <div className="eg-meal-side-form">
                                                                    <input
                                                                        className="form-input"
                                                                        value={sideForm.name}
                                                                        onChange={event =>
                                                                            setSideForm(current => ({
                                                                                ...current,
                                                                                name: event.target.value
                                                                            }))
                                                                        }
                                                                        placeholder="Side or extra item"
                                                                        autoFocus
                                                                    />

                                                                    <div className="eg-meal-side-form-row">
                                                                        <input
                                                                            className="form-input"
                                                                            value={sideForm.quantity}
                                                                            onChange={event =>
                                                                                setSideForm(current => ({
                                                                                    ...current,
                                                                                    quantity:
                                                                                        event.target.value
                                                                                }))
                                                                            }
                                                                            placeholder="Quantity"
                                                                        />

                                                                        <select
                                                                            className="form-input"
                                                                            value={sideForm.category}
                                                                            onChange={event =>
                                                                                setSideForm(current => ({
                                                                                    ...current,
                                                                                    category:
                                                                                        event.target.value
                                                                                }))
                                                                            }
                                                                        >
                                                                            <option value="">
                                                                                Category
                                                                            </option>

                                                                            {shoppingCategoryOrder.map(
                                                                                category => (
                                                                                    <option
                                                                                        key={category}
                                                                                        value={category}
                                                                                    >
                                                                                        {category}
                                                                                    </option>
                                                                                )
                                                                            )}
                                                                        </select>
                                                                    </div>

                                                                    <div className="eg-actions-row">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleAddSide(plan.id)
                                                                            }
                                                                        >
                                                                            Add Side
                                                                        </Button>

                                                                        <Button
                                                                            variant="secondary"
                                                                            size="sm"
                                                                            onClick={closeSideForm}
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="eg-meal-add-side-button"
                                                                    onClick={() =>
                                                                        openSideForm(plan.id)
                                                                    }
                                                                >
                                                                    <Plus size={13} />
                                                                    Add side
                                                                </button>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <ChevronRight
                                    size={18}
                                    className="eg-meal-day-chevron"
                                />
                            </div>

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