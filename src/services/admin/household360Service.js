import { supabase } from "../../lib/supabase"

export async function getHousehold360(householdId) {
    if (!householdId) {
        throw new Error("householdId is required")
    }

    const { data, error } = await supabase
        .from("admin_household_directory")
        .select("*")
        .eq("household_id", householdId)
        .order("family_member_name")

    if (error) throw error

    const rows = data ?? []
    const firstRow = rows[0]

    if (!firstRow) {
        return null
    }

    const members = rows
        .filter(row => row.family_member_id)
        .map(row => ({
            id: row.family_member_id,
            name: row.family_member_name,
            userId: row.user_id,
            email: row.email
        }))

    return {
        household: {
            id: firstRow.household_id,
            name: firstRow.household_name,
            createdAt: firstRow.household_created_at,
            memberCount: firstRow.member_count ?? members.length
        },
        members
    }
}