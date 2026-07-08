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

export async function searchHouseholds(search = "") {
    const households = await getHouseholds()
    const term = search.trim().toLowerCase()

    if (!term) return households.slice(0, 25)

    return households
        .filter((household) =>
            household.household?.toLowerCase().includes(term) ||
            household.memberNames?.some((name) =>
                name.toLowerCase().includes(term)
            ) ||
            household.emails?.some((email) =>
                email.toLowerCase().includes(term)
            )
        )
        .slice(0, 25)
}

export async function exportHouseholdData(householdId) {
    if (!householdId) {
        throw new Error("householdId is required")
    }

    const tables = [
        "households",
        "family_members",
        "tasks",
        "calendar_events",
        "meals",
        "meal_ingredients",
        "meal_plans",
        "shopping_lists",
        "shopping_items",
        "trips",
        "family_announcements",
        "personal_inbox_items",
        "household_feed",
        "product_feedback",
        "usage_events",
        "user_display_preferences"
    ]

    const exportData = {
        exported_at: new Date().toISOString(),
        household_id: householdId,
        tables: {}
    }

    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select("*")
            .eq("household_id", householdId)

        exportData.tables[table] = {
            error: error ? error.message : null,
            rows: data || []
        }
    }

    return exportData
}