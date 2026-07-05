import { supabase } from "../../lib/supabase"

export async function getHouseholds() {
    const { data, error } = await supabase
        .from("admin_household_directory")
        .select("*")
        .order("household_name")

    if (error) throw error

    const households = new Map()

    for (const row of data ?? []) {
        if (!households.has(row.household_id)) {
            households.set(row.household_id, {
                id: row.household_id,
                household: row.household_name,
                members: row.member_count ?? 0,
                memberNames: [],
                emails: [],
                created: row.household_created_at
            })
        }

        const household = households.get(row.household_id)

        if (
            row.family_member_name &&
            !household.memberNames.includes(row.family_member_name)
        ) {
            household.memberNames.push(row.family_member_name)
        }

        if (
            row.email &&
            !household.emails.includes(row.email)
        ) {
            household.emails.push(row.email)
        }
    }

    return Array.from(households.values())
}