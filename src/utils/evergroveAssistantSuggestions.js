function getDateString(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-")
}

function getThanksgiving(year) {
    const date = new Date(year, 10, 1)
    let thursdays = 0

    while (date.getMonth() === 10) {
        if (date.getDay() === 4) thursdays += 1
        if (thursdays === 4) return date
        date.setDate(date.getDate() + 1)
    }

    return null
}

const holidayLibrary = [
    {
        name: "Thanksgiving",
        icon: "🦃",
        getDate: getThanksgiving,
        tasks: [
            "Plan Thanksgiving menu",
            "Make Thanksgiving grocery list",
            "Confirm guests",
            "Clean common areas"
        ]
    },
    {
        name: "Christmas",
        icon: "🎄",
        getDate: year => new Date(year, 11, 25),
        tasks: [
            "Review Christmas gift list",
            "Plan Christmas meal",
            "Check wrapping supplies",
            "Schedule family holiday plans"
        ]
    },
    {
        name: "Halloween",
        icon: "🎃",
        getDate: year => new Date(year, 9, 31),
        tasks: [
            "Buy Halloween candy",
            "Plan costumes",
            "Check decorations",
            "Confirm trick-or-treat plans"
        ]
    },
    {
        name: "Independence Day",
        icon: "🎆",
        getDate: year => new Date(year, 6, 4),
        tasks: [
            "Plan Fourth of July meal",
            "Confirm family plans",
            "Buy cookout supplies",
            "Check outdoor setup"
        ]
    }
]

export function getEvergroveAssistantSuggestions(daysAhead = 45) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(today)
    endDate.setDate(today.getDate() + daysAhead)

    const yearsToCheck = [
        today.getFullYear(),
        today.getFullYear() + 1
    ]

    return holidayLibrary
        .flatMap(holiday =>
            yearsToCheck.map(year => {
                const date = holiday.getDate(year)

                if (!date) return null

                date.setHours(0, 0, 0, 0)

                if (date < today || date > endDate) return null

                return {
                    id: `${holiday.name}-${year}`,
                    name: holiday.name,
                    icon: holiday.icon,
                    date: getDateString(date),
                    daysAway: Math.ceil((date - today) / (1000 * 60 * 60 * 24)),
                    tasks: holiday.tasks
                }
            })
        )
        .filter(Boolean)
}