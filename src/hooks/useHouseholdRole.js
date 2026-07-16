import { useCallback, useEffect, useState } from "react"

import { supabase } from "../lib/supabase"

export default function useHouseholdRole() {
    const [role, setRole] = useState(null)
    const [householdId, setHouseholdId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadHouseholdRole = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser()

            if (userError) throw userError

            if (!user) {
                setRole(null)
                setHouseholdId(null)
                return
            }

            const { data, error: membershipError } = await supabase
                .from("household_members")
                .select(`
                    household_id,
                    role
                `)
                .eq("user_id", user.id)
                .limit(1)
                .maybeSingle()

            if (membershipError) throw membershipError

            setRole(data?.role || null)
            setHouseholdId(data?.household_id || null)
        } catch (loadError) {
            console.error(
                "Could not load household role:",
                loadError
            )

            setError(loadError)
            setRole(null)
            setHouseholdId(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadHouseholdRole()
    }, [loadHouseholdRole])

    return {
        role,
        householdId,
        loading,
        error,
        refreshHouseholdRole: loadHouseholdRole,
        isOwner: role === "owner",
        isAdult: role === "owner" || role === "adult",
        isTeen: role === "teen"
    }
}