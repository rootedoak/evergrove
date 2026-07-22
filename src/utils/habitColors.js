const HABIT_COLOR_MAP = {
    evergreen: {
        className: "eg-habit-color-evergreen",
        label: "Evergreen"
    },
    blue: {
        className: "eg-habit-color-blue",
        label: "Blue"
    },
    green: {
        className: "eg-habit-color-green",
        label: "Green"
    },
    teal: {
        className: "eg-habit-color-teal",
        label: "Teal"
    },
    purple: {
        className: "eg-habit-color-purple",
        label: "Purple"
    },
    orange: {
        className: "eg-habit-color-orange",
        label: "Orange"
    },
    yellow: {
        className: "eg-habit-color-yellow",
        label: "Yellow"
    },
    red: {
        className: "eg-habit-color-red",
        label: "Red"
    },
    pink: {
        className: "eg-habit-color-pink",
        label: "Pink"
    },
    indigo: {
        className: "eg-habit-color-indigo",
        label: "Indigo"
    },
    gray: {
        className: "eg-habit-color-gray",
        label: "Gray"
    }
}

export function getHabitColor(colorName) {
    return (
        HABIT_COLOR_MAP[colorName] ||
        HABIT_COLOR_MAP.evergreen
    )
}

export const HABIT_COLOR_NAMES =
    Object.keys(HABIT_COLOR_MAP)

export const HABIT_COLOR_OPTIONS =
    Object.entries(HABIT_COLOR_MAP).map(
        ([value, config]) => ({
            value,
            label: config.label,
            className: config.className
        })
    )