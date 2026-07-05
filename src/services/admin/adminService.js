import { supabase } from "../../lib/supabase"

export async function getIsAdmin() {
    const { data, error } = await supabase.rpc("is_admin")

    if (error) {
        console.error("Failed to check admin access:", error)
        return false
    }

    return Boolean(data)
}