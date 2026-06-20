import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"

async function getCurrentUser() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user found.")

    return user
}

export async function getReactionsForTargets(targetType, targetIds = []) {
    const household = await getCurrentHousehold()

    if (!targetIds.length) {
        return []
    }

    const { data, error } = await supabase
        .from("household_reactions")
        .select("*")
        .eq("household_id", household.id)
        .eq("target_type", targetType)
        .in("target_id", targetIds)

    if (error) throw error

    return data || []
}

export async function addReaction({ targetType, targetId, reaction }) {
    const user = await getCurrentUser()
    const household = await getCurrentHousehold()

    const { data, error } = await supabase
        .from("household_reactions")
        .insert({
            household_id: household.id,
            user_id: user.id,
            target_type: targetType,
            target_id: targetId,
            reaction,
        })
        .select()
        .single()

    if (error) {
        if (error.code === "23505") {
            return null
        }

        throw error
    }

    return data
}

export async function removeReaction({ targetType, targetId, reaction }) {
    const user = await getCurrentUser()

    const { error } = await supabase
        .from("household_reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("reaction", reaction)

    if (error) throw error
}