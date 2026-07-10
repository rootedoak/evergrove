export function calculateAgeFromMonthAndYear({
    birthMonth,
    birthYear,
    now = new Date()
}) {
    const month = Number(birthMonth)
    const year = Number(birthYear)

    if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12 ||
        !Number.isInteger(year)
    ) {
        return null
    }

    let age = now.getFullYear() - year

    const currentMonth = now.getMonth() + 1

    if (currentMonth < month) {
        age -= 1
    }

    return age
}

export function checkEvergroveAccountEligibility(values) {
    const age = calculateAgeFromMonthAndYear(values)

    if (age === null || age < 0 || age > 120) {
        return {
            eligible: false,
            reason: "invalid"
        }
    }

    if (age < 18) {
        return {
            eligible: false,
            reason: "adult_account_required"
        }
    }

    return {
        eligible: true,
        reason: null
    }
}