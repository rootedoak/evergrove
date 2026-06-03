import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Plus,
    ShoppingCart,
    Trash2,
    UtensilsCrossed
} from "lucide-react"
import {
    createGroceryItem,
    createMeal,
    createMealPlan,
    updateMeal,
    deleteGroceryItem,
    deleteMeal,
    deleteMealPlan,
    getGroceryItems,
    getMealPlans,
    getMeals,
    toggleGroceryItem
} from "../services/mealService"
import { createShoppingList } from "../services/shoppingService"
import usePreferences from "../hooks/usePreferences"

const defaultShoppingCategoryOrder = [
    "Produce",
    "Meat",
    "Dairy",
    "Frozen",
    "Pantry",
    "Household",
    "Uncategorized"
]

function toDateInputValue(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-")
}

function getTodayDate() {
    return toDateInputValue(new Date())
}

function getStartOfWeek(date) {
    const nextDate = new Date(date)
    const day = nextDate.getDay()
    const diff = nextDate.getDate() - day
    nextDate.setDate(diff)
    nextDate.setHours(0, 0, 0, 0)
    return nextDate
}

function addDays(date, days) {
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + days)
    return nextDate
}

function formatDayLabel(date) {
    return date.toLocaleDateString(undefined, { weekday: "short" })
}

function formatDateLabel(date) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export default function Meals() {
    const navigate = useNavigate()
    const location = useLocation()
    const { preferences } = usePreferences()

    const shoppingCategoryOrder =
        preferences?.shopping_category_order?.length
            ? preferences.shopping_category_order
            : defaultShoppingCategoryOrder

    const [meals, setMeals] = useState([])
    const [mealPlans, setMealPlans] = useState([])
    const [groceryItems, setGroceryItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()))
    const [editingMealId, setEditingMealId] = useState(null)
    const [quickAddMealId, setQuickAddMealId] = useState(null)
    const [quickAddDate, setQuickAddDate] = useState(getTodayDate())
    const [quickAddNotes, setQuickAddNotes] = useState("")

    const [mealForm, setMealForm] = useState({
        name: "",
        description: "",
        category: "Dinner",
        ingredients: [{ name: "", quantity: "", category: "" }]
    })

    const [planForm, setPlanForm] = useState({
        mealId: "",
        plannedDate: getTodayDate(),
        notes: "",
        planType: "home",
        restaurantName: ""
    })

    const [groceryForm, setGroceryForm] = useState({
        name: "",
        quantity: "",
        category: ""
    })

    async function loadData() {
        try {
            setLoading(true)
            setError("")

            const currentWeekDays = Array.from({ length: 7 }, (_, index) => {
                const date = addDays(weekStart, index)

                return {
                    dateValue: toDateInputValue(date)
                }
            })

            const [mealsData, plansData, groceriesData] = await Promise.all([
                getMeals(),
                getMealPlans(),
                getGroceryItems({
                    startDate: currentWeekDays[0].dateValue,
                    endDate: currentWeekDays[6].dateValue
                })
            ])

            setMeals(mealsData)
            setMealPlans(plansData)
            setGroceryItems(groceriesData)
        } catch (err) {
            console.error(err)
            setError("Could not load meal planner.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [weekStart])

    useEffect(() => {
        if (!location.state?.openMealPlanForm) return

        setPlanForm(current => ({
            ...current,
            plannedDate: location.state?.selectedDate || getTodayDate()
        }))

        window.scrollTo({ top: 0, behavior: "smooth" })

        navigate(location.pathname, { replace: true, state: {} })
    }, [location, navigate])

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, index) => {
            const date = addDays(weekStart, index)

            return {
                date,
                dateValue: toDateInputValue(date),
                dayLabel: formatDayLabel(date),
                dateLabel: formatDateLabel(date)
            }
        })
    }, [weekStart])

    const dinnerTonight = useMemo(() => {
        return mealPlans.find(plan => plan.planned_date === getTodayDate())
    }, [mealPlans])

    const weekMealPlans = useMemo(() => {
        const grouped = {}

        weekDays.forEach(day => {
            grouped[day.dateValue] = mealPlans.filter(
                plan => plan.planned_date === day.dateValue
            )
        })

        return grouped
    }, [mealPlans, weekDays])

    const consolidatedGroceryItems = useMemo(() => {
        const groups = {}

        groceryItems.forEach(item => {
            const itemName = item.name?.trim()
            if (!itemName) return

            const key = itemName.toLowerCase()

            if (!groups[key]) {
                groups[key] = {
                    name: itemName,
                    quantity: item.quantity || "",
                    category: item.category || "",
                    checked: item.checked,
                    items: [],
                    usedIn: []
                }
            }

            groups[key].items.push(item)

            if (!item.checked) {
                groups[key].checked = false
            }

            if (item.meal_plans?.meal_name) {
                const usedInName = item.meal_plans.meal_name

                if (!groups[key].usedIn.includes(usedInName)) {
                    groups[key].usedIn.push(usedInName)
                }
            }
        })

        return Object.values(groups).sort((a, b) => {
            if (a.checked !== b.checked) return a.checked ? 1 : -1
            return a.name.localeCompare(b.name)
        })
    }, [groceryItems])

    const openGroceryItems = consolidatedGroceryItems.filter(item => !item.checked)

    const groceryItemsByCategory = useMemo(() => {
        const groups = {}

        consolidatedGroceryItems.forEach(item => {
            const category = item.category?.trim() || "Uncategorized"

            if (!groups[category]) {
                groups[category] = []
            }

            groups[category].push(item)
        })

        return Object.entries(groups).sort(([categoryA], [categoryB]) => {
            const indexA = shoppingCategoryOrder.indexOf(categoryA)
            const indexB = shoppingCategoryOrder.indexOf(categoryB)

            if (indexA !== -1 && indexB !== -1) return indexA - indexB
            if (indexA !== -1) return -1
            if (indexB !== -1) return 1

            return categoryA.localeCompare(categoryB)
        })
    }, [consolidatedGroceryItems, shoppingCategoryOrder])

    function updateIngredient(index, field, value) {
        const nextIngredients = [...mealForm.ingredients]

        nextIngredients[index] = {
            ...nextIngredients[index],
            [field]: value
        }

        setMealForm({
            ...mealForm,
            ingredients: nextIngredients
        })
    }

    function addIngredientRow() {
        setMealForm({
            ...mealForm,
            ingredients: [
                ...mealForm.ingredients,
                { name: "", quantity: "", category: "" }
            ]
        })
    }

    function removeIngredientRow(index) {
        const nextIngredients = mealForm.ingredients.filter(
            (_, itemIndex) => itemIndex !== index
        )

        setMealForm({
            ...mealForm,
            ingredients: nextIngredients.length
                ? nextIngredients
                : [{ name: "", quantity: "", category: "" }]
        })
    }

    function startEditMeal(meal) {
        setEditingMealId(meal.id)

        setMealForm({
            name: meal.name || "",
            description: meal.description || "",
            category: meal.category || "Dinner",
            ingredients: meal.meal_ingredients?.length
                ? meal.meal_ingredients.map(ingredient => ({
                    name: ingredient.name || "",
                    quantity: ingredient.quantity || "",
                    category: ingredient.category || ""
                }))
                : [{ name: "", quantity: "", category: "" }]
        })
    }

    function cancelEditMeal() {
        setEditingMealId(null)

        setMealForm({
            name: "",
            description: "",
            category: "Dinner",
            ingredients: [{ name: "", quantity: "", category: "" }]
        })
    }

    function startQuickAdd(meal) {
        setQuickAddMealId(meal.id)
        setQuickAddDate(getTodayDate())
        setQuickAddNotes("")
    }

    function cancelQuickAdd() {
        setQuickAddMealId(null)
        setQuickAddDate(getTodayDate())
        setQuickAddNotes("")
    }

    async function handleQuickAdd(meal) {
        if (!meal || !quickAddDate) return

        await createMealPlan({
            meal,
            plannedDate: quickAddDate,
            notes: quickAddNotes,
            planType: "home",
            restaurantName: ""
        })

        cancelQuickAdd()
        await loadData()
    }

    async function handleGenerateWeek() {
        if (meals.length === 0) {
            alert("Add a few saved meals first.")
            return
        }

        if (!window.confirm("Generate random meals for all empty days this week?")) {
            return
        }

        const emptyDays = weekDays.filter(day => {
            const plansForDay = weekMealPlans[day.dateValue] || []
            return plansForDay.length === 0
        })

        if (emptyDays.length === 0) {
            alert("This week is already fully planned.")
            return
        }

        const shuffledMeals = [...meals].sort(() => Math.random() - 0.5)

        for (let index = 0; index < emptyDays.length; index += 1) {
            const meal = shuffledMeals[index % shuffledMeals.length]

            await createMealPlan({
                meal,
                plannedDate: emptyDays[index].dateValue,
                notes: "",
                planType: "home",
                restaurantName: ""
            })
        }

        await loadData()
    }

    async function handleGenerateShoppingList() {
        if (consolidatedGroceryItems.length === 0) {
            alert("No grocery items found for this week.")
            return
        }

        const startDate = weekDays[0].dateValue
        const endDate = weekDays[6].dateValue
        const title = `Week of ${weekDays[0].dateLabel} Groceries`

        const items = consolidatedGroceryItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            category: item.category,
            source_grocery_item_ids: item.items.map(sourceItem => sourceItem.id)
        }))

        const shoppingList = await createShoppingList({
            title,
            sourceWeekStart: startDate,
            sourceWeekEnd: endDate,
            items
        })

        if (shoppingList.alreadyExists) {
            const shouldReplace = window.confirm(
                "A shopping list already exists for this week. Replace it with the latest meal plan grocery list?"
            )

            if (!shouldReplace) {
                navigate("/shopping")
                return
            }

            await createShoppingList({
                title,
                sourceWeekStart: startDate,
                sourceWeekEnd: endDate,
                items,
                replaceExisting: true
            })
        }

        navigate("/shopping")
    }

    async function handleCreateMeal(event) {
        event.preventDefault()
        if (!mealForm.name.trim()) return

        if (editingMealId) {
            await updateMeal(editingMealId, mealForm)
        } else {
            await createMeal(mealForm)
        }

        setEditingMealId(null)

        setMealForm({
            name: "",
            description: "",
            category: "Dinner",
            ingredients: [{ name: "", quantity: "", category: "" }]
        })

        await loadData()
    }

    async function handleCreatePlan(event) {
        event.preventDefault()

        const isRestaurant = planForm.planType === "restaurant"

        const selectedMeal = meals.find(
            meal => meal.id === planForm.mealId
        )

        if (!planForm.plannedDate) return
        if (!isRestaurant && !selectedMeal) return
        if (isRestaurant && !planForm.restaurantName.trim()) return

        await createMealPlan({
            meal: selectedMeal,
            plannedDate: planForm.plannedDate,
            notes: planForm.notes,
            planType: planForm.planType,
            restaurantName: planForm.restaurantName
        })

        setPlanForm({
            mealId: "",
            plannedDate: getTodayDate(),
            notes: "",
            planType: "home",
            restaurantName: ""
        })

        await loadData()
    }

    async function handleCreateGroceryItem(event) {
        event.preventDefault()
        if (!groceryForm.name.trim()) return

        await createGroceryItem(groceryForm)

        setGroceryForm({
            name: "",
            quantity: "",
            category: ""
        })

        await loadData()
    }

    if (loading) {
        return <p className="muted-text">Loading meal planner...</p>
    }

    return (
        <div className="tasks-command-page">
            <header className="calendar-header">
                <div>
                    <p className="dashboard-household-name">
                        Meals
                    </p>

                    <h2>Meal Planning</h2>

                    <p>
                        Plan dinners, restaurant nights, and grocery shopping.
                    </p>
                </div>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <div className="dashboard-grid">
                <section className="panel hero-panel">
                    <div className="panel-icon">
                        <UtensilsCrossed size={22} />
                    </div>

                    <div>
                        <p className="eyebrow">Dinner Tonight</p>
                        <h3>{dinnerTonight ? dinnerTonight.meal_name : "Nothing planned yet"}</h3>
                        <p className="muted-text">
                            {dinnerTonight?.notes || "Add a meal below to keep tonight simple."}
                        </p>
                    </div>
                </section>

                <section className="panel stat-panel">
                    <ShoppingCart size={22} />
                    <div>
                        <p className="eyebrow">Grocery List</p>
                        <h3>{openGroceryItems.length}</h3>
                        <p className="muted-text">unique items remaining</p>
                    </div>
                </section>
            </div>

            <section className="panel">
                <div className="section-heading">
                    <div>
                        <h3>Weekly Meal Planner</h3>
                        <p>Plan home meals and restaurant nights across the week.</p>
                    </div>

                    <div className="button-row">
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={handleGenerateWeek}
                        >
                            Generate Week
                        </button>

                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => setWeekStart(addDays(weekStart, -7))}
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>

                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => setWeekStart(getStartOfWeek(new Date()))}
                        >
                            This Week
                        </button>

                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() => setWeekStart(addDays(weekStart, 7))}
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleCreatePlan} className="form-stack">
                    <div className="three-column-form">
                        <select
                            className="form-input"
                            value={planForm.planType}
                            onChange={event =>
                                setPlanForm({
                                    ...planForm,
                                    planType: event.target.value,
                                    mealId: "",
                                    restaurantName: ""
                                })
                            }
                        >
                            <option value="home">Home Meal</option>
                            <option value="restaurant">Restaurant Night</option>
                        </select>

                        {planForm.planType === "restaurant" ? (
                            <input
                                className="form-input"
                                value={planForm.restaurantName}
                                onChange={event =>
                                    setPlanForm({
                                        ...planForm,
                                        restaurantName: event.target.value
                                    })
                                }
                                placeholder="Restaurant name"
                            />
                        ) : (
                            <select
                                className="form-input"
                                value={planForm.mealId}
                                onChange={event =>
                                    setPlanForm({
                                        ...planForm,
                                        mealId: event.target.value
                                    })
                                }
                            >
                                <option value="">Choose a meal</option>

                                {meals.map(meal => (
                                    <option key={meal.id} value={meal.id}>
                                        {meal.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        <input
                            className="form-input"
                            type="date"
                            value={planForm.plannedDate}
                            onChange={event =>
                                setPlanForm({
                                    ...planForm,
                                    plannedDate: event.target.value
                                })
                            }
                        />
                    </div>

                    <input
                        className="form-input"
                        value={planForm.notes}
                        onChange={event =>
                            setPlanForm({
                                ...planForm,
                                notes: event.target.value
                            })
                        }
                        placeholder="Notes"
                    />

                    <button className="primary-button" type="submit">
                        <Plus size={16} />
                        Add to Week
                    </button>
                </form>

                <div className="weekly-meal-grid">
                    {weekDays.map(day => (
                        <div key={day.dateValue} className="weekly-meal-day">
                            <div className="weekly-meal-day-header">
                                <p>{day.dayLabel}</p>
                                <span>{day.dateLabel}</span>
                            </div>

                            <div className="weekly-meal-day-body">
                                {(weekMealPlans[day.dateValue] || []).length === 0 && (
                                    <p className="empty-day-text">No dinner planned</p>
                                )}

                                {(weekMealPlans[day.dateValue] || []).map(plan => (
                                    <div key={plan.id} className="weekly-meal-card">
                                        <div>
                                            <p className="row-title">
                                                {plan.plan_type === "restaurant" ? "🍽️ " : ""}
                                                {plan.meal_name}
                                            </p>

                                            {plan.notes && (
                                                <p className="row-subtitle">{plan.notes}</p>
                                            )}
                                        </div>

                                        <button
                                            className="icon-danger-button"
                                            type="button"
                                            onClick={async () => {
                                                await deleteMealPlan(plan.id)
                                                await loadData()
                                            }}
                                            aria-label="Delete meal plan"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="panel">
                <div className="section-heading">
                    <div>
                        <h3>Grocery List</h3>
                        <p>Generated from planned home meals, grouped by category.</p>
                    </div>

                    <div className="button-row">
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={handleGenerateShoppingList}
                        >
                            <ShoppingCart size={16} />
                            Generate Shopping List
                        </button>
                    </div>
                </div>

                <div className="grocery-layout">
                    <form onSubmit={handleCreateGroceryItem} className="form-stack grocery-form">
                        <input
                            className="form-input"
                            value={groceryForm.name}
                            onChange={event =>
                                setGroceryForm({ ...groceryForm, name: event.target.value })
                            }
                            placeholder="Item"
                        />

                        <div className="two-column-form">
                            <input
                                className="form-input"
                                value={groceryForm.quantity}
                                onChange={event =>
                                    setGroceryForm({ ...groceryForm, quantity: event.target.value })
                                }
                                placeholder="Quantity"
                            />

                            <select
                                className="form-input"
                                value={groceryForm.category}
                                onChange={event =>
                                    setGroceryForm({
                                        ...groceryForm,
                                        category: event.target.value
                                    })
                                }
                            >
                                <option value="">Category</option>
                                {shoppingCategoryOrder.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button className="secondary-button" type="submit">
                            <Plus size={16} />
                            Add Grocery Item
                        </button>
                    </form>

                    <div className="list-stack grocery-list-stack">
                        {groceryItemsByCategory.map(([category, items]) => (
                            <div key={category} className="grocery-category-group">
                                <div className="grocery-category-header">
                                    <h4>{category}</h4>
                                    <span>
                                        {items.length} item{items.length === 1 ? "" : "s"}
                                    </span>
                                </div>

                                {items.map(group => (
                                    <div key={group.name} className="list-row consolidated-grocery-row">
                                        <button
                                            className={group.checked ? "check-button checked" : "check-button"}
                                            type="button"
                                            onClick={async () => {
                                                await Promise.all(
                                                    group.items.map(item =>
                                                        toggleGroceryItem(item.id, !group.checked)
                                                    )
                                                )
                                                await loadData()
                                            }}
                                        >
                                            {group.checked && <Check size={14} />}
                                        </button>

                                        <div className="row-grow">
                                            <p className={group.checked ? "row-title completed" : "row-title"}>
                                                {group.quantity ? `${group.quantity} ` : ""}
                                                {group.name}
                                                {group.items.length > 1 ? ` (${group.items.length})` : ""}
                                            </p>

                                            {group.usedIn.length > 0 && (
                                                <div className="used-in-list">
                                                    <p>Used In:</p>
                                                    <ul>
                                                        {group.usedIn.map(mealName => (
                                                            <li key={mealName}>{mealName}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            className="icon-danger-button"
                                            type="button"
                                            onClick={async () => {
                                                await Promise.all(
                                                    group.items.map(item => deleteGroceryItem(item.id))
                                                )
                                                await loadData()
                                            }}
                                            aria-label="Delete grocery item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="panel saved-meals-panel">
                <div className="section-heading">
                    <div>
                        <h3>Saved Meals</h3>
                        <p>Create meals once, then reuse them in your weekly plan.</p>
                    </div>
                    <UtensilsCrossed size={20} />
                </div>

                <form onSubmit={handleCreateMeal} className="form-stack">
                    <div className="three-column-form saved-meal-main-fields">
                        <input
                            className="form-input"
                            value={mealForm.name}
                            onChange={event =>
                                setMealForm({ ...mealForm, name: event.target.value })
                            }
                            placeholder="Meal name"
                        />

                        <select
                            className="form-input"
                            value={mealForm.category}
                            onChange={event =>
                                setMealForm({
                                    ...mealForm,
                                    category: event.target.value
                                })
                            }
                        >
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Dessert">Dessert</option>
                            <option value="Snack">Snack</option>
                        </select>

                        <input
                            className="form-input"
                            value={mealForm.description}
                            onChange={event =>
                                setMealForm({ ...mealForm, description: event.target.value })
                            }
                            placeholder="Description"
                        />
                    </div>

                    <div className="ingredient-table">
                        <div className="ingredient-table-header">
                            <span>Ingredient</span>
                            <span>Quantity</span>
                            <span>Category</span>
                            <span></span>
                        </div>

                        <div className="ingredient-stack">
                            {mealForm.ingredients.map((ingredient, index) => (
                                <div key={index} className="ingredient-row">
                                    <input
                                        className="form-input"
                                        value={ingredient.name}
                                        onChange={event =>
                                            updateIngredient(index, "name", event.target.value)
                                        }
                                        placeholder="Ingredient"
                                    />

                                    <input
                                        className="form-input"
                                        value={ingredient.quantity}
                                        onChange={event =>
                                            updateIngredient(index, "quantity", event.target.value)
                                        }
                                        placeholder="Quantity"
                                    />

                                    <select
                                        className="form-input"
                                        value={ingredient.category}
                                        onChange={event =>
                                            updateIngredient(index, "category", event.target.value)
                                        }
                                    >
                                        <option value="">Category</option>
                                        {shoppingCategoryOrder.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => removeIngredientRow(index)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="button-row">
                        <button className="secondary-button" type="button" onClick={addIngredientRow}>
                            <Plus size={16} />
                            Add Ingredient
                        </button>

                        <button className="primary-button" type="submit">
                            {editingMealId ? "Update Meal" : "Save Meal"}
                        </button>

                        {editingMealId && (
                            <button
                                className="secondary-button"
                                type="button"
                                onClick={cancelEditMeal}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>

                <div className="meal-card-grid">
                    {meals.map(meal => (
                        <div key={meal.id} className="meal-card">
                            <div className="meal-card-header">
                                <div>
                                    <h4>{meal.name}</h4>
                                    <p>{meal.category || "Dinner"}</p>
                                </div>

                                <div className="button-row">
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => startEditMeal(meal)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="icon-danger-button"
                                        type="button"
                                        onClick={async () => {
                                            await deleteMeal(meal.id)
                                            await loadData()
                                        }}
                                        aria-label="Delete meal"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {meal.description && (
                                <p className="meal-description">{meal.description}</p>
                            )}

                            <ul className="ingredient-list">
                                {(meal.meal_ingredients || []).map(ingredient => (
                                    <li key={ingredient.id}>
                                        {ingredient.quantity ? `${ingredient.quantity} ` : ""}
                                        {ingredient.name}
                                    </li>
                                ))}
                            </ul>

                            <div className="quick-add-area">
                                {quickAddMealId === meal.id ? (
                                    <div className="quick-add-form">
                                        <input
                                            className="form-input"
                                            type="date"
                                            value={quickAddDate}
                                            onChange={event => setQuickAddDate(event.target.value)}
                                        />

                                        <input
                                            className="form-input"
                                            value={quickAddNotes}
                                            onChange={event => setQuickAddNotes(event.target.value)}
                                            placeholder="Notes"
                                        />

                                        <div className="button-row">
                                            <button
                                                className="primary-button"
                                                type="button"
                                                onClick={() => handleQuickAdd(meal)}
                                            >
                                                Add
                                            </button>

                                            <button
                                                className="secondary-button"
                                                type="button"
                                                onClick={cancelQuickAdd}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => startQuickAdd(meal)}
                                    >
                                        <Plus size={16} />
                                        Add To Week
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}