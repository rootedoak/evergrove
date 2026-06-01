import { supabase } from "../lib/supabase"
import { ensureMyHousehold } from "./householdService"

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user
}

export async function getFamilyMembers() {
    const household = await ensureMyHousehold()

    const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("household_id", household.id)
        .order("created_at", { ascending: true })

    if (error) throw error

    return data || []
}

export async function createFamilyMember(member) {
    const user = await getCurrentUser()
    const household = await ensureMyHousehold()

    const { data, error } = await supabase
        .from("family_members")
        .insert([
            {
                ...member,
                user_id: user.id,
                household_id: household.id
            }
        ])
        .select()
        .single()

    if (error) throw error

    return data
}

export async function updateFamilyMember(id, updates) {
    const household = await ensureMyHousehold()

    const { data, error } = await supabase
        .from("family_members")
        .update(updates)
        .eq("id", id)
        .eq("household_id", household.id)
        .select()
        .single()

    if (error) throw error

    return data
}

export async function deleteFamilyMember(id) {
    const household = await ensureMyHousehold()

    const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id)

    if (error) throw error

    return true
}