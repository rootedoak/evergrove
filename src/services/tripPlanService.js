import { supabase } from "../lib/supabase"

async function getCurrentUserId() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user.id
}

export async function getTripPlans(tripId) {
    const { data, error } = await supabase
        .from("trip_plans")
        .select("*")
        .eq("trip_id", tripId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })

    if (error) throw error

    return data || []
}

export async function createTripPlan(plan) {
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
        .from("trip_plans")
        .insert([
            {
                ...plan,
                user_id: userId
            }
        ])
        .select()
        .single()

    if (error) throw error

    return data
}

export async function updateTripPlan(id, updates) {
    const { data, error } = await supabase
        .from("trip_plans")
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteTripPlan(id) {
    const { error } = await supabase
        .from("trip_plans")
        .delete()
        .eq("id", id)

    if (error) throw error
}