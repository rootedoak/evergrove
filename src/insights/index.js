import birthdayInsight from "./birthdayInsight"
import dinnerInsight from "./dinnerInsight"
import overdueTasksInsight from "./overdueTasksInsight"
import tomorrowScheduleInsight from "./tomorrowScheduleInsight"

const providers = [
    birthdayInsight,
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