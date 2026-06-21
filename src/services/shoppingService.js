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

    const lists = data || []

    const sourceGroceryItemIds = [
        ...new Set(
            lists
                .flatMap(list => list.shopping_list_items || [])
                .flatMap(item => item.source_grocery_item_ids || [])
                .filter(Boolean)
        )
    ]

    if (sourceGroceryItemIds.length === 0) {
        return lists
    }

    const { data: groceryItems, error: groceryError } = await supabase
        .from("grocery_items")
        .select(`
            id,
            name,
            meal_plans (
                id,
                meal_name
            )
        `)
        .eq("household_id", household.id)
        .in("id", sourceGroceryItemIds)

    if (groceryError) throw groceryError

    const groceryItemById = new Map(
        (groceryItems || []).map(item => [item.id, item])
    )

    return lists.map(list => ({
        ...list,
        shopping_list_items: (list.shopping_list_items || []).map(item => {
            const usedIn = (item.source_grocery_item_ids || [])
                .map(sourceId => groceryItemById.get(sourceId))
                .filter(Boolean)
                .map(sourceItem => sourceItem.meal_plans?.meal_name)
                .filter(Boolean)

            return {
                ...item,
                used_in: [...new Set(usedIn)].join(", ")
            }
        })
    }))
}

export async function createShoppingList({
    title,
    sourceWeekStart,
    sourceWeekEnd,
    items = [],
    replaceExisting = false
}) {
    const { user, household } = await getUserAndHousehold()

    let existingList = null

    if (sourceWeekStart && sourceWeekEnd) {
        const { data, error: existingError } = await supabase
            .from("shopping_lists")
            .select("*")
            .eq("household_id", household.id)
            .eq("status", "active")
            .eq("source_week_start", sourceWeekStart)
            .eq("source_week_end", sourceWeekEnd)
            .maybeSingle()

        if (existingError) throw existingError

        existingList = data

        if (existingList && !replaceExisting) {
            return {
                ...existingList,
                alreadyExists: true
            }
        }
    }

    const itemRowsForList = listId =>
        items
            .filter(item => item.name?.trim())
            .map(item => ({
                user_id: user.id,
                household_id: household.id,
                shopping_list_id: listId,
                name: item.name.trim(),
                quantity: item.quantity || "",
                category: item.category || "Uncategorized",
                checked: false,
                source_grocery_item_ids: item.source_grocery_item_ids || []
            }))

    if (existingList && replaceExisting) {
        const { error: deleteItemsError } = await supabase
            .from("shopping_list_items")
            .delete()
            .eq("shopping_list_id", existingList.id)
            .eq("household_id", household.id)

        if (deleteItemsError) throw deleteItemsError

        const { data: updatedList, error: updateError } = await supabase
            .from("shopping_lists")
            .update({
                title,
                source_week_start: sourceWeekStart || null,
                source_week_end: sourceWeekEnd || null,
                updated_at: new Date().toISOString()
            })
            .eq("id", existingList.id)
            .eq("household_id", household.id)
            .select()
            .single()

        if (updateError) throw updateError

        const replacementRows = itemRowsForList(existingList.id)

        if (replacementRows.length > 0) {
            const { error: itemError } = await supabase
                .from("shopping_list_items")
                .insert(replacementRows)

            if (itemError) throw itemError
        }

        return {
            ...updatedList,
            replacedExisting: true
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

    const itemRows = itemRowsForList(list.id)

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