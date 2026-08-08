function getBillingExempt(household) {
    return (
        household?.billing_exempt ??
        household?.billingExempt ??
        false
    )
}

function getBillingStatus(household) {
    return (
        household?.billing_status ??
        household?.billingStatus ??
        null
    )
}

const ACCESSIBLE_BILLING_STATUSES = new Set([
    "beta",
    "trial",
    "active",
    "lifetime"
])

export function hasHouseholdAccess(household) {
    if (!household) {
        return false
    }

    if (getBillingExempt(household)) {
        return true
    }

    return ACCESSIBLE_BILLING_STATUSES.has(
        getBillingStatus(household)
    )
}

export function shouldShowHouseholdPricing(household) {
    return !hasHouseholdAccess(household)
}

export function getHouseholdAccessReason(household) {
    if (!household) {
        return "missing-household"
    }

    if (getBillingExempt(household)) {
        return "billing-exempt"
    }

    switch (getBillingStatus(household)) {
        case "beta":
            return "beta"
        case "trial":
            return "trial"
        case "active":
            return "active-subscription"
        case "lifetime":
            return "lifetime"
        case "past_due":
            return "past-due"
        case "canceled":
            return "canceled"
        default:
            return "unknown"
    }
}