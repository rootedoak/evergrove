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

export async function getShoppingLists() {
    const { household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("shopping_lists")
        .select(`
            *,
            shopping_list_items (*)
        `)
        .eq("household_id", household.id)
        .order("created_at", { ascending: false })

    if (error) throw error

    return data || []
}

export async function createShoppingList({
    title,
    sourceWeekStart,
    sourceWeekEnd,
    items = []
}) {
    const { user, household } = await getUserAndHousehold()

    if (sourceWeekStart && sourceWeekEnd) {
        const { data: existingList, error: existingError } = await supabase
            .from("shopping_lists")
            .select("*")
            .eq("household_id", household.id)
            .eq("status", "active")
            .eq("source_week_start", sourceWeekStart)
            .eq("source_week_end", sourceWeekEnd)
            .maybeSingle()

        if (existingError) throw existingError

        if (existingList) {
            return {
                ...existingList,
                alreadyExists: true
            }
        }
    }

    const { data: list, error: listError } = await supabase
        .from("shopping_lists")
        .insert({
            user_id: user.id,
            household_id: household.id,
            title,
            status: "active",
            source_week_start: sourceWeekStart || null,
            source_week_end: sourceWeekEnd || null
        })
        .select()
        .single()

    if (listError) throw listError

    const itemRows = items
        .filter(item => item.name?.trim())
        .map(item => ({
            user_id: user.id,
            household_id: household.id,
            shopping_list_id: list.id,
            name: item.name.trim(),
            quantity: item.quantity || "",
            category: item.category || "Uncategorized",
            checked: false,
            source_grocery_item_ids: item.source_grocery_item_ids || []
        }))

    if (itemRows.length > 0) {
        const { error: itemError } = await supabase
            .from("shopping_list_items")
            .insert(itemRows)

        if (itemError) throw itemError
    }

    return list
}

export async function createShoppingListItem({ shoppingListId, name, quantity, category }) {
    const { user, household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("shopping_list_items")
        .insert({
            user_id: user.id,
            household_id: household.id,
            shopping_list_id: shoppingListId,
            name,
            quantity: quantity || "",
            category: category || "Uncategorized",
            checked: false
        })
        .select()
        .single()

    if (error) throw error

    return data
}

export async function toggleShoppingListItem(id, checked) {
    const { household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("shopping_list_items")
        .update({ checked })
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteShoppingListItem(id) {
    const { household } = await getUserAndHousehold()

    const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error

    return true
}

export async function archiveShoppingList(id) {
    const { household } = await getUserAndHousehold()

    const { data, error } = await supabase
        .from("shopping_lists")
        .update({
            status: "archived",
            archived_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteShoppingList(id) {
    const { household } = await getUserAndHousehold()

    const { error } = await supabase
        .from("shopping_lists")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error

    return true
}