import { supabase } from "../lib/supabase"

export async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user
}

export async function getCurrentHousehold() {
    const user = await getCurrentUser()

    const { data, error } = await supabase
        .from("household_members")
        .select(`
            household_id,
            role,
            households (
                id,
                name
            )
        `)
        .eq("user_id", user.id)
        .limit(1)
        .single()

    if (error) throw error

    return {
        id: data.household_id,
        role: data.role,
        name: data.households?.name || "My Family"
    }
}

export async function ensureMyHousehold() {
    return getCurrentHousehold()
}