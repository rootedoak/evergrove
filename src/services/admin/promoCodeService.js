import { supabase } from "../../lib/supabase"

export async function getPromoCodesAdmin() {
    const { data, error } = await supabase.rpc(
        "get_promo_codes_admin"
    )

    if (error) {
        throw new Error(
            error.message ||
            "We could not load promo codes."
        )
    }

    return data ?? []
}

export async function createPromoCodeAdmin({
    name,
    code,
    description = "",
    offerType = "beta_access",
    maxRedemptions = null,
    expiresAt = null,
    percentOff = null,
    amountOff = null,
    trialDays = null,
    billingStatusAfterRedemption = null
}) {
    const normalizedName = name?.trim()
    const normalizedCode = code
        ?.trim()
        .toUpperCase()

    if (!normalizedName) {
        throw new Error("Promo name is required.")
    }

    if (!normalizedCode) {
        throw new Error("Promo code is required.")
    }

    const { data, error } = await supabase.rpc(
        "create_promo_code_admin",
        {
            p_name: normalizedName,
            p_code: normalizedCode,
            p_description:
                description?.trim() || null,
            p_offer_type: offerType,
            p_max_redemptions:
                normalizePositiveInteger(
                    maxRedemptions
                ),
            p_expires_at:
                expiresAt || null,
            p_percent_off:
                normalizeNumber(percentOff),
            p_amount_off:
                normalizePositiveInteger(amountOff),
            p_trial_days:
                normalizePositiveInteger(trialDays),
            p_billing_status_after_redemption:
                billingStatusAfterRedemption ||
                null
        }
    )

    if (error) {
        throw new Error(
            error.message ||
            "We could not create the promo code."
        )
    }

    return data
}

export async function setPromoCodeStatusAdmin({
    promoCodeId,
    status
}) {
    if (!promoCodeId) {
        throw new Error("Promo code is required.")
    }

    const allowedStatuses = new Set([
        "active",
        "disabled",
        "expired"
    ])

    if (!allowedStatuses.has(status)) {
        throw new Error(
            "That promo-code status is not valid."
        )
    }

    const { data, error } = await supabase.rpc(
        "set_promo_code_status_admin",
        {
            p_promo_code_id: promoCodeId,
            p_status: status
        }
    )

    if (error) {
        throw new Error(
            error.message ||
            "We could not update the promo code."
        )
    }

    return data
}

function normalizePositiveInteger(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null
    }

    const parsedValue = Number.parseInt(
        String(value),
        10
    )

    if (
        !Number.isFinite(parsedValue) ||
        parsedValue <= 0
    ) {
        return null
    }

    return parsedValue
}

function normalizeNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null
    }

    const parsedValue = Number(value)

    if (!Number.isFinite(parsedValue)) {
        return null
    }

    return parsedValue
}

export async function assignPromoCodeToHouseholdAdmin({
    householdId,
    promoCodeId
}) {
    const { data, error } = await supabase.rpc(
        "assign_promo_code_to_household_admin",
        {
            p_household_id: householdId,
            p_promo_code_id: promoCodeId
        }
    )

    if (error) throw error

    return data
}