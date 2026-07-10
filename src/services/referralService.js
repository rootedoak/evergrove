import { supabase } from "../lib/supabase"
import { getCurrentHousehold } from "./householdService"

const REFERRAL_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const REFERRAL_CODE_LENGTH = 6
const MAX_CODE_ATTEMPTS = 10

function createReferralCode(length = REFERRAL_CODE_LENGTH) {
    const values = new Uint32Array(length)
    crypto.getRandomValues(values)

    return Array.from(
        values,
        value =>
            REFERRAL_CHARACTERS[
            value % REFERRAL_CHARACTERS.length
            ]
    ).join("")
}

export async function getHouseholdReferral() {
    const household = await getCurrentHousehold()

    if (!household?.id) {
        throw new Error("No household found.")
    }

    const { data, error } = await supabase
        .from("household_referrals")
        .select("*")
        .eq("referring_household_id", household.id)
        .eq("is_active", true)
        .maybeSingle()

    if (error) throw error

    return data
}

export async function getOrCreateHouseholdReferral() {
    const existingReferral = await getHouseholdReferral()

    if (existingReferral) {
        return existingReferral
    }

    const household = await getCurrentHousehold()

    if (!household?.id) {
        throw new Error("No household found.")
    }

    for (
        let attempt = 0;
        attempt < MAX_CODE_ATTEMPTS;
        attempt += 1
    ) {
        const referralCode = createReferralCode()

        const { data, error } = await supabase
            .from("household_referrals")
            .insert({
                referring_household_id: household.id,
                referral_code: referralCode
            })
            .select()
            .single()

        if (!error) {
            return data
        }

        const isDuplicateCode =
            error.code === "23505" ||
            error.message
                ?.toLowerCase()
                .includes("duplicate")

        if (!isDuplicateCode) {
            throw error
        }
    }

    throw new Error(
        "We could not create a referral link. Please try again."
    )
}

export async function getReferralByCode(referralCode) {
    const normalizedCode = referralCode
        ?.trim()
        .toUpperCase()

    if (!normalizedCode) {
        return null
    }

    const { data, error } = await supabase.rpc(
        "get_public_referral",
        {
            p_referral_code: normalizedCode
        }
    )

    if (error) throw error

    return data?.[0] ?? null
}

export async function startReferralConversion(referralId) {
    if (!referralId) {
        throw new Error("Referral ID is required.")
    }

    const existingConversionId = window.localStorage.getItem(
        "evergrove_referral_conversion_id"
    )

    if (existingConversionId) {
        return {
            id: existingConversionId,
            existing: true
        }
    }

    const { data, error } = await supabase.rpc(
        "start_referral_conversion",
        {
            p_referral_id: referralId
        }
    )

    if (error) throw error

    const conversion = data?.[0]

    if (!conversion?.id) {
        throw new Error(
            "We could not start the referral."
        )
    }

    window.localStorage.setItem(
        "evergrove_referral_conversion_id",
        conversion.id
    )

    return conversion
}

export function saveReferralAttribution({
    referralId,
    referralCode,
    conversionId
}) {
    if (referralId) {
        window.localStorage.setItem(
            "evergrove_referral_id",
            referralId
        )
    }

    if (referralCode) {
        window.localStorage.setItem(
            "evergrove_referral_code",
            referralCode
        )
    }

    if (conversionId) {
        window.localStorage.setItem(
            "evergrove_referral_conversion_id",
            conversionId
        )
    }
}

export function getStoredReferralAttribution() {
    return {
        referralId: window.localStorage.getItem(
            "evergrove_referral_id"
        ),
        referralCode: window.localStorage.getItem(
            "evergrove_referral_code"
        ),
        conversionId: window.localStorage.getItem(
            "evergrove_referral_conversion_id"
        )
    }
}

export function clearReferralAttribution() {
    window.localStorage.removeItem("evergrove_referral_id")
    window.localStorage.removeItem("evergrove_referral_code")
    window.localStorage.removeItem(
        "evergrove_referral_conversion_id"
    )
}

export function buildReferralUrl(referralCode) {
    if (!referralCode) return ""

    return `${window.location.origin}/r/${referralCode}`
}

export async function markReferralAccountCreated(userId) {
    const conversionId = window.localStorage.getItem(
        "evergrove_referral_conversion_id"
    )

    if (!conversionId || !userId) {
        return null
    }

    const { data, error } = await supabase.rpc(
        "advance_referral_conversion",
        {
            p_conversion_id: conversionId,
            p_new_status: "account_created",
            p_referred_user_id: userId,
            p_referred_household_id: null
        }
    )

    if (error) throw error

    const conversion = data?.[0]

    if (!conversion?.conversion_id) {
        throw new Error(
            "The referral account attribution was not recorded."
        )
    }

    return conversion
}

export async function markReferralHouseholdCreated(
    householdId
) {
    const conversionId = window.localStorage.getItem(
        "evergrove_referral_conversion_id"
    )

    if (!conversionId || !householdId) {
        return null
    }

    const { data, error } = await supabase.rpc(
        "advance_referral_conversion",
        {
            p_conversion_id: conversionId,
            p_new_status: "household_created",
            p_referred_user_id: null,
            p_referred_household_id: householdId
        }
    )

    if (error) throw error

    const conversion = data?.[0]

    if (!conversion?.conversion_id) {
        throw new Error(
            "The referral household attribution was not recorded."
        )
    }

    return conversion
}