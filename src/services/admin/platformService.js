import { supabase } from "../../lib/supabase"

export async function getPlatformSummary() {
    const [
        householdsResult,
        familyMembersResult,
        authenticatedUsersResult
    ] = await Promise.all([
        supabase
            .from("households")
            .select("id", {
                count: "exact",
                head: true
            }),

        supabase
            .from("family_members")
            .select("id", {
                count: "exact",
                head: true
            }),

        supabase
            .from("admin_user_summary")
            .select("user_id")
    ])

    if (householdsResult.error) {
        throw householdsResult.error
    }

    if (familyMembersResult.error) {
        throw familyMembersResult.error
    }

    if (authenticatedUsersResult.error) {
        throw authenticatedUsersResult.error
    }

    const authenticatedUserIds = new Set(
        (authenticatedUsersResult.data ?? [])
            .map(user => user.user_id)
            .filter(Boolean)
    )

    return {
        householdCount:
            householdsResult.count ?? 0,

        familyMemberCount:
            familyMembersResult.count ?? 0,

        authenticatedUserCount:
            authenticatedUserIds.size,

        openIssues: 0
    }
}

export async function searchHouseholds(searchTerm) {
    if (!searchTerm?.trim()) {
        return []
    }

    const { data, error } = await supabase
        .from("households")
        .select(`
            id,
            name,
            created_at,
            family_members (
                id,
                name
            )
        `)
        .ilike("name", `%${searchTerm}%`)
        .limit(10)

    if (error) throw error

    return data ?? []
}

export async function searchPlatform(searchTerm) {
    if (!searchTerm?.trim()) {
        return []
    }

    const term = searchTerm.trim()

    const { data, error } = await supabase
        .from("admin_household_directory")
        .select("*")
        .or(
            `household_name.ilike.%${term}%,family_member_name.ilike.%${term}%,email.ilike.%${term}%`
        )
        .limit(25)

    if (error) throw error

    const householdMap = new Map()

    for (const row of data ?? []) {
        if (!householdMap.has(row.household_id)) {
            householdMap.set(row.household_id, {
                id: row.household_id,
                name: row.household_name,
                createdAt: row.household_created_at,
                memberCount: row.member_count ?? 0,
                members: [],
                emails: []
            })
        }

        const household = householdMap.get(row.household_id)

        if (
            row.family_member_name &&
            !household.members.includes(row.family_member_name)
        ) {
            household.members.push(row.family_member_name)
        }

        if (
            row.email &&
            !household.emails.includes(row.email)
        ) {
            household.emails.push(row.email)
        }
    }

    return Array.from(householdMap.values())
}