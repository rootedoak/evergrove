import { supabase } from "../lib/supabase"
import { ensureMyHousehold } from "./householdService"

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user found.")

    return user
}

async function getUserAndHousehold() {
    const user = await getCurrentUser()
    const household = await ensureMyHousehold()

    return { user, household }
}

export async function getMeals() {
    const { household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("meals")
        .select(`
            *,
            meal_ingredients (*),
            meal_plans (
                id,
                planned_date,
                plan_type,
                is_leftovers
            )
        `)
        .eq("household_id", household.id)
        .order("name", { ascending: true })

    if (error) throw error
    return data || []
}

export async function createMeal({
    name,
    description,
    category,
    recipe_url = "",
    is_favorite = false,
    ingredients = []
}) {
    const { user, household } = await getUserAndHousehold()

    const { data: meal, error: mealError } = await supabase
        .from("meals")
        .insert({
            user_id: user.id,
            household_id: household.id,
            name,
            description,
            category: category || "Dinner",
            recipe_url: recipe_url || "",
            is_favorite: Boolean(is_favorite)
        })
        .select()
        .single()

    if (mealError) throw mealError

    const ingredientRows = ingredients
        .filter(item => item.name?.trim())
        .map(item => ({
            user_id: user.id,
            household_id: household.id,
            meal_id: meal.id,
            name: item.name.trim(),
            quantity: item.quantity || "",
            category: item.category || ""
        }))

    if (ingredientRows.length > 0) {
        const { error: ingredientError } = await supabase
            .from("meal_ingredients")
            .insert(ingredientRows)

        if (ingredientError) throw ingredientError
    }

    return meal
}

export async function updateMeal(
    id,
    {
        name,
        description,
        category,
        recipe_url = "",
        is_favorite = false,
        ingredients = []
    }
) {
    const { user, household } = await getUserAndHousehold()

    const { data: meal, error: mealError } = await supabase
        .from("meals")
        .update({
            name,
            description,
            category: category || "Dinner",
            recipe_url: recipe_url || "",
            is_favorite: Boolean(is_favorite)
        })
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (mealError) throw mealError

    const { error: deleteError } = await supabase
        .from("meal_ingredients")
        .delete()
        .eq("meal_id", id)
        .eq("household_id", household.id)

    if (deleteError) throw deleteError

    const ingredientRows = ingredients
        .filter(item => item.name?.trim())
        .map(item => ({
            user_id: user.id,
            household_id: household.id,
            meal_id: id,
            name: item.name.trim(),
            quantity: item.quantity || "",
            category: item.category || ""
        }))

    if (ingredientRows.length > 0) {
        const { error: ingredientError } = await supabase
            .from("meal_ingredients")
            .insert(ingredientRows)

        if (ingredientError) throw ingredientError
    }

    return meal
}

export async function deleteMeal(id) {
    const { household } = await getUserAndHousehold()

    const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error

    return true
}

export async function getMealPlans() {
    const { household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("household_id", household.id)
        .order("planned_date", { ascending: true })

    if (error) throw error
    return data || []
}

export async function createMealPlan({
    meal,
    plannedDate,
    notes,
    planType = "home",
    restaurantName = "",
    isLeftovers = false
}) {
    const { user, household } = await getUserAndHousehold()

    const isRestaurantNight = planType === "restaurant"
    const isLeftoversNight = planType === "leftovers" || isLeftovers

    const mealName = isLeftoversNight
        ? "Leftovers"
        : isRestaurantNight
            ? restaurantName || "Eat Out"
            : meal?.name || "Dinner"

    const { data: plan, error } = await supabase
        .from("meal_plans")
        .insert({
            user_id: user.id,
            household_id: household.id,
            meal_id: isRestaurantNight || isLeftoversNight ? null : meal?.id || null,
            meal_name: mealName,
            planned_date: plannedDate,
            notes: notes || "",
            plan_type: isLeftoversNight ? "leftovers" : planType,
            restaurant_name: isRestaurantNight ? restaurantName : null,
            meal_category: isLeftoversNight
                ? "Leftovers"
                : isRestaurantNight
                    ? "Restaurant"
                    : meal?.category || "Dinner",
            is_leftovers: Boolean(isLeftoversNight)
        })
        .select()
        .single()

    if (error) throw error

    if (!isRestaurantNight && !isLeftoversNight) {
        const groceryRows = (meal?.meal_ingredients || [])
            .filter(item => item.name?.trim())
            .map(item => ({
                user_id: user.id,
                household_id: household.id,
                name: item.name,
                quantity: item.quantity || "",
                category: item.category || "",
                source_meal_plan_id: plan.id,
                checked: false
            }))

        if (groceryRows.length > 0) {
            const { error: groceryError } = await supabase
                .from("grocery_items")
                .insert(groceryRows)

            if (groceryError) throw groceryError
        }
    }

    return plan
}

export async function deleteMealPlan(id) {
    const { household } = await getUserAndHousehold()

    const { error: groceryError } = await supabase
        .from("grocery_items")
        .delete()
        .eq("source_meal_plan_id", id)
        .eq("household_id", household.id)

    if (groceryError) throw groceryError

    const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error

    return true
}

export async function getGroceryItems({ startDate, endDate } = {}) {
    const { household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("grocery_items")
        .select(`
            *,
            meal_plans (
                id,
                meal_name,
                planned_date
            )
        `)
        .eq("household_id", household.id)
        .order("checked", { ascending: true })
        .order("category", { ascending: true })
        .order("name", { ascending: true })

    if (error) throw error

    const items = data || []

    if (!startDate || !endDate) {
        return items
    }

    return items.filter(item => {
        if (!item.source_meal_plan_id) return true

        const plannedDate = item.meal_plans?.planned_date
        if (!plannedDate) return false

        return plannedDate >= startDate && plannedDate <= endDate
    })
}

export async function createGroceryItem({ name, quantity, category }) {
    const { user, household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("grocery_items")
        .insert({
            user_id: user.id,
            household_id: household.id,
            name,
            quantity: quantity || "",
            category: category || "",
            checked: false
        })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function toggleGroceryItem(id, checked) {
    const { household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("grocery_items")
        .update({ checked })
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteGroceryItem(id) {
    const { household } = await getUserAndHousehold()

    const { error } = await supabase
        .from("grocery_items")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error

    return true
}

export async function clearCheckedGroceryItems() {
    const { household } = await getUserAndHousehold()

    const { error } = await supabase
        .from("grocery_items")
        .delete()
        .eq("household_id", household.id)
        .eq("checked", true)

    if (error) throw error

    return true
}