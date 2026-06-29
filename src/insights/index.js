import birthdayInsight from "./birthdayInsight"
import dinnerInsight from "./dinnerInsight"
import overdueTasksInsight from "./overdueTasksInsight"
import tomorrowScheduleInsight from "./tomorrowScheduleInsight"
import holidayInsight from "./holidayInsight"

// Every provider determines whether it has a helpful insight
// for the household today.
//
// Providers should not import application services directly.
// Use the Intelligence Context instead.

const providers = [
    birthdayInsight,
    holidayInsight,
    dinnerInsight,
    tomorrowScheduleInsight,
    overdueTasksInsight,
]

export function getEvergroveInsights(context) {
    return providers
        .map(provider => provider(context))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
}