import { supabase } from "../../lib/supabase"

export async function getFeatureFlags() {
    const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("name", { ascending: true })

    if (error) throw error
    return data || []
}

export async function createFeatureFlag(flag) {
    const { data, error } = await supabase
        .from("feature_flags")
        .insert({
            key: flag.key,
            name: flag.name,
            description: flag.description || "",
            is_enabled_globally: flag.is_enabled_globally || false,
            rollout_percentage: Number(flag.rollout_percentage || 0),
            target_household_ids: flag.target_household_ids || [],
            target_user_ids: flag.target_user_ids || []
        })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateFeatureFlag(id, updates) {
    const { data, error } = await supabase
        .from("feature_flags")
        .update({
            ...updates,
            rollout_percentage:
                updates.rollout_percentage !== undefined
                    ? Number(updates.rollout_percentage || 0)
                    : undefined,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteFeatureFlag(id) {
    const { error } = await supabase
        .from("feature_flags")
        .delete()
        .eq("id", id)

    if (error) throw error
}