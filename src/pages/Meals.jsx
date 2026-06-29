import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
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

import AppPage from "../components/ui/AppPage"
import PageHeader from "../components/ui/PageHeader"
import MealAssistantCard from "../components/meals/MealAssistantCard"
import MealWeekCard from "../components/meals/MealWeekCard"
import SavedMealsSection from "../components/meals/SavedMealsSection"
import GrocerySummaryCard from "../components/meals/GrocerySummaryCard"

import Button from "../components/ui/Button"

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
    const [showMealForm, setShowMealForm] = useState(false)
    const [groceryExpanded, setGroceryExpanded] = useState(false)
    const [mealSearch, setMealSearch] = useState("")
    const [mobileTab, setMobileTab] = useState("week")

    const [showMealsFabMenu, setShowMealsFabMenu] = useState(false)

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

    const [mealMenuOpen, setMealMenuOpen] = useState(null)

    const [dayQuickAdd, setDayQuickAdd] = useState({
        dateValue: "",
        mealId: "",
        notes: "",
        planType: "home",
        restaurantName: ""
    })

    const [mealForm, setMealForm] = useState({
        name: "",
        description: "",
        category: "Dinner",
        recipe_url: "",
        is_favorite: false,
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

    useEffect(() => {
        const mealPlanId = location.state?.mealPlanId

        if (!mealPlanId || mealPlans.length === 0) return

        const mealPlan = mealPlans.find(
            plan => plan.id === mealPlanId
        )

        if (!mealPlan) return

        const meal = meals.find(
            item => item.id === mealPlan.meal_id
        )

        if (meal) {
            setMobileTab("meals")
            startEditMeal(meal)

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            })
        }

        navigate(location.pathname, {
            replace: true,
            state: {}
        })
    }, [location.state, mealPlans, meals, navigate])

    useEffect(() => {
        function handleResize() {
            setIsMobile(window.innerWidth <= 768)
        }

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

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

    const plannedDaysCount = useMemo(() => {
        return weekDays.filter(day => {
            const plansForDay = weekMealPlans[day.dateValue] || []
            return plansForDay.length > 0
        }).length
    }, [weekDays, weekMealPlans])

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

    const filteredMeals = useMemo(() => {
        const search = mealSearch.trim().toLowerCase()

        if (!search) return meals

        return meals.filter(meal =>
            meal.name?.toLowerCase().includes(search) ||
            meal.category?.toLowerCase().includes(search) ||
            meal.description?.toLowerCase().includes(search)
        )
    }, [meals, mealSearch])

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
            recipe_url: meal.recipe_url || "",
            is_favorite: meal.is_favorite || false,
            ingredients: meal.meal_ingredients?.length
                ? meal.meal_ingredients.map(ingredient => ({
                    name: ingredient.name || "",
                    quantity: ingredient.quantity || "",
                    category: ingredient.category || ""
                }))
                : [{ name: "", quantity: "", category: "" }]
        })

        setShowMealForm(true)
    }

    function cancelEditMeal() {
        setEditingMealId(null)

        setMealForm({
            name: "",
            description: "",
            category: "Dinner",
            recipe_url: "",
            is_favorite: false,
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

    function startDayQuickAdd(dateValue) {
        setDayQuickAdd({
            dateValue,
            mealId: "",
            notes: "",
            planType: "home",
            restaurantName: ""
        })
    }

    function cancelDayQuickAdd() {
        setDayQuickAdd({
            dateValue: "",
            mealId: "",
            notes: "",
            planType: "home",
            restaurantName: ""
        })
    }

    async function handleDayQuickAdd() {
        const isRestaurant = dayQuickAdd.planType === "restaurant"
        const isLeftovers = dayQuickAdd.planType === "leftovers"

        const selectedMeal = meals.find(
            meal => meal.id === dayQuickAdd.mealId
        )

        if (!dayQuickAdd.dateValue) return
        if (!isRestaurant && !isLeftovers && !selectedMeal) return
        if (isRestaurant && !dayQuickAdd.restaurantName.trim()) return

        await createMealPlan({
            meal: selectedMeal,
            plannedDate: dayQuickAdd.dateValue,
            notes: dayQuickAdd.notes,
            planType: dayQuickAdd.planType,
            restaurantName: dayQuickAdd.restaurantName
        })

        cancelDayQuickAdd()
        await loadData()
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
            recipe_url: "",
            is_favorite: false,
            ingredients: [{ name: "", quantity: "", category: "" }]
        })

        setShowMealForm(false)

        await loadData()
    }

    async function handleCreatePlan(event) {
        event.preventDefault()

        const isRestaurant = planForm.planType === "restaurant"
        const isLeftovers = planForm.planType === "leftovers"

        const selectedMeal = meals.find(
            meal => meal.id === planForm.mealId
        )

        if (!planForm.plannedDate) return
        if (!isRestaurant && !isLeftovers && !selectedMeal) return
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

    function handleHeaderAdd() {
        if (mobileTab === "week") {
            startDayQuickAdd(getTodayDate())
            return
        }

        if (mobileTab === "meals") {
            cancelEditMeal()
            setShowMealForm(true)
            return
        }

        if (mobileTab === "groceries") {
            setGroceryExpanded(true)
            setGroceryForm({
                name: "",
                quantity: "",
                category: ""
            })
            return
        }
    }

    function handlePlanTonight() {
        setMobileTab("week")

        startDayQuickAdd(getTodayDate())
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

    const addButtonLabel =
        mobileTab === "week"
            ? "Plan"
            : mobileTab === "groceries"
                ? "Item"
                : "Add"

    if (loading) {
        return <p className="muted-text">Loading meal planner...</p>
    }

    return (
        <AppPage>
            <PageHeader
                eyebrow="Meals"
                title="Meal Planning"
                subtitle="Plan dinners, save favorites, and build grocery lists."
                action={
                    <Button
                        size="sm"
                        onClick={handleHeaderAdd}
                    >
                        <Plus size={16} />
                        {addButtonLabel}
                    </Button>
                }
            />

            {error && <div className="error-banner">{error}</div>}

            <div className="eg-stack">
                {error && <div className="error-banner">{error}</div>}

                <div className="meals-mobile-tabs">
                    <button
                        type="button"
                        className={mobileTab === "week" ? "active" : ""}
                        onClick={() => setMobileTab("week")}
                    >
                        Week
                    </button>

                    <button
                        type="button"
                        className={mobileTab === "meals" ? "active" : ""}
                        onClick={() => setMobileTab("meals")}
                    >
                        Meals
                    </button>

                    <button
                        type="button"
                        className={mobileTab === "groceries" ? "active" : ""}
                        onClick={() => setMobileTab("groceries")}
                    >
                        Groceries
                    </button>
                </div>

                {(!isMobile || mobileTab === "week") && (
                    <MealAssistantCard
                        dinnerTonight={dinnerTonight}
                        plannedDaysCount={plannedDaysCount}
                        openGroceryCount={openGroceryItems.length}
                        onGenerateShoppingList={handleGenerateShoppingList}
                        onPlanTonight={handlePlanTonight}
                    />
                )}

                {(!isMobile || mobileTab === "week") && (
                    <MealWeekCard
                        weekDays={weekDays}
                        weekMealPlans={weekMealPlans}
                        meals={meals}
                        dayQuickAdd={dayQuickAdd}
                        setDayQuickAdd={setDayQuickAdd}
                        startDayQuickAdd={startDayQuickAdd}
                        cancelDayQuickAdd={cancelDayQuickAdd}
                        handleDayQuickAdd={handleDayQuickAdd}
                        deleteMealPlan={deleteMealPlan}
                        setMealPlans={setMealPlans}
                        mealPlans={mealPlans}
                        setWeekStart={setWeekStart}
                        weekStart={weekStart}
                        addDays={addDays}
                        getStartOfWeek={getStartOfWeek}
                        handleGenerateWeek={handleGenerateWeek}
                    />
                )}

                {isMobile && mobileTab === "meals" && (
                    <SavedMealsSection
                        showMealForm={showMealForm}
                        handleCreateMeal={handleCreateMeal}
                        mealForm={mealForm}
                        setMealForm={setMealForm}
                        shoppingCategoryOrder={shoppingCategoryOrder}
                        updateIngredient={updateIngredient}
                        addIngredientRow={addIngredientRow}
                        removeIngredientRow={removeIngredientRow}
                        editingMealId={editingMealId}
                        cancelEditMeal={cancelEditMeal}
                        mealSearch={mealSearch}
                        setMealSearch={setMealSearch}
                        filteredMeals={filteredMeals}
                        quickAddMealId={quickAddMealId}
                        quickAddDate={quickAddDate}
                        setQuickAddDate={setQuickAddDate}
                        quickAddNotes={quickAddNotes}
                        setQuickAddNotes={setQuickAddNotes}
                        startQuickAdd={startQuickAdd}
                        cancelQuickAdd={cancelQuickAdd}
                        handleQuickAdd={handleQuickAdd}
                        mealMenuOpen={mealMenuOpen}
                        setMealMenuOpen={setMealMenuOpen}
                        startEditMeal={startEditMeal}
                        deleteMeal={deleteMeal}
                        meals={meals}
                        setMeals={setMeals}
                    />
                )}

                {(!isMobile || mobileTab === "groceries") && (
                    <GrocerySummaryCard
                        groceryExpanded={groceryExpanded}
                        setGroceryExpanded={setGroceryExpanded}
                        openGroceryItems={openGroceryItems}
                        handleGenerateShoppingList={handleGenerateShoppingList}
                        handleCreateGroceryItem={handleCreateGroceryItem}
                        groceryForm={groceryForm}
                        setGroceryForm={setGroceryForm}
                        shoppingCategoryOrder={shoppingCategoryOrder}
                        groceryItemsByCategory={groceryItemsByCategory}
                        toggleGroceryItem={toggleGroceryItem}
                        deleteGroceryItem={deleteGroceryItem}
                        loadData={loadData}
                    />
                )}
            </div>
        </AppPage>
    )
}