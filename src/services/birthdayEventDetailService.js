import { supabase } from "../lib/supabase"
import { ensureMyHousehold } from "./householdService"

export async function getBirthdayEventDetail({ familyMemberId, occurrenceDate }) {
    const household = await ensureMyHousehold()

    const { data, error } = await supabase
        .from("birthday_event_details")
        .select("*")
        .eq("household_id", household.id)
        .eq("family_member_id", familyMemberId)
        .eq("occurrence_date", occurrenceDate)
        .maybeSingle()

    if (error) throw error

    return data
}

export async function saveBirthdayEventDetail({ familyMemberId, occurrenceDate, notes }) {
    const household = await ensureMyHousehold()

    const { data, error } = await supabase
        .from("birthday_event_details")
        .upsert({
            household_id: household.id,
            family_member_id: familyMemberId,
            occurrence_date: occurrenceDate,
            notes: notes?.trim() || null,
            updated_at: new Date().toISOString()
        }, {
            onConflict: "household_id,family_member_id,occurrence_date"
        })
        .select()
        .single()

    if (error) throw error

    return data
}