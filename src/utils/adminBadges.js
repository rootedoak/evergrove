function isRecentlyCreated(createdAt, days = 7) {
    if (!createdAt) return false

    const created = new Date(createdAt)
    const cutoff = new Date()

    cutoff.setDate(cutoff.getDate() - days)

    return created >= cutoff
}

export function getHouseholdBadges(household) {
    const badges = []

    if (isRecentlyCreated(household.created)) {
        badges.push({
            label: "New",
            variant: "success"
        })
    }

    return badges
}

export function getUserBadges(user) {
    const badges = []

    if (isRecentlyCreated(user.created_at)) {
        badges.push({
            label: "New",
            variant: "success"
        })
    }

    return badges
}