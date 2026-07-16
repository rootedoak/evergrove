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

export async function createHousehold(name) {
    const user = await getCurrentUser()

    const { data: household, error: householdError } = await supabase
        .from("households")
        .insert({
            name: name || "My Household",
            created_by: user.id
        })
        .select()
        .single()

    if (householdError) throw householdError

    const { error: memberError } = await supabase
        .from("household_members")
        .insert({
            household_id: household.id,
            user_id: user.id,
            role: "owner"
        })

    if (memberError) throw memberError

    return household
}

export async function getMyHouseholdAccess() {
    const household = await ensureMyHousehold()

    const [
        { data: isMember, error: memberError },
        { data: role, error: roleError },
        { data: canManage, error: manageError }
    ] = await Promise.all([
        supabase.rpc("is_household_member", {
            target_household_id: household.id
        }),
        supabase.rpc("get_household_role", {
            target_household_id: household.id
        }),
        supabase.rpc("has_household_role", {
            target_household_id: household.id,
            allowed_roles: ["owner", "adult"]
        })
    ])

    if (memberError) throw memberError
    if (roleError) throw roleError
    if (manageError) throw manageError

    return {
        householdId: household.id,
        isMember,
        role,
        canManage
    }
}