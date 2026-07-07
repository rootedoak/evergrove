import { supabase } from "../../lib/supabase"

const featureMap = {
    session_started: "App Sessions",
    daily_active: "Daily Active",
    task_created: "Tasks",
    task_completed: "Tasks",

    calendar_event_created: "Calendar",
    activity_created: "Calendar",

    meal_created: "Meals",
    meal_planned: "Meals",

    shopping_item_added: "Shopping",

    trip_created: "Trips",

    announcement_created: "Announcements",

    feedback_submitted: "Support",
    login: "Logins"
}

function getSinceDate(days) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    return since
}

function getLocalDateKey(value = new Date()) {
    const date = new Date(value)

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-")
}

function calculateTrend(current, previous) {
    if (previous === 0) {
        return {
            change: current > 0 ? 100 : 0,
            direction: current > 0 ? "up" : "neutral"
        }
    }

    const change = ((current - previous) / previous) * 100

    return {
        change: Math.round(change),
        direction:
            change > 0
                ? "up"
                : change < 0
                    ? "down"
                    : "neutral"
    }
}

export async function getDashboardKpis({ days = 30 } = {}) {
    const currentSince = getSinceDate(days)
    const previousSince = getSinceDate(days * 2)

    const { data: current, error: currentError } = await supabase
        .from("usage_events")
        .select("household_id")
        .gte("created_at", currentSince.toISOString())

    if (currentError) throw currentError

    const { data: previous, error: previousError } = await supabase
        .from("usage_events")
        .select("household_id")
        .gte("created_at", previousSince.toISOString())
        .lt("created_at", currentSince.toISOString())

    if (previousError) throw previousError

    const currentEvents = current?.length ?? 0
    const previousEvents = previous?.length ?? 0

    const currentHouseholds = new Set(
        (current ?? [])
            .map(row => row.household_id)
            .filter(Boolean)
    ).size

    const previousHouseholds = new Set(
        (previous ?? [])
            .map(row => row.household_id)
            .filter(Boolean)
    ).size

    return {
        activeHouseholds: {
            value: currentHouseholds,
            ...calculateTrend(currentHouseholds, previousHouseholds)
        },

        events: {
            value: currentEvents,
            ...calculateTrend(currentEvents, previousEvents)
        }
    }
}

export async function getFeatureUsage({ days = 30 } = {}) {
    const since = getSinceDate(days)

    const { data, error } = await supabase
        .from("usage_events")
        .select("event_type")
        .gte("created_at", since.toISOString())

    if (error) throw error

    const counts = {}

    for (const row of data ?? []) {
        const feature = featureMap[row.event_type] || "Other"
        counts[feature] = (counts[feature] || 0) + 1
    }

    return Object.entries(counts)
        .map(([feature, count]) => ({
            feature,
            count
        }))
        .sort((a, b) => b.count - a.count)
}

export async function getDailyActiveHouseholds({ days = 14 } = {}) {
    const since = getSinceDate(days)

    const { data, error } = await supabase
        .from("usage_events")
        .select("household_id, created_at")
        .gte("created_at", since.toISOString())

    if (error) throw error

    const dailyMap = new Map()

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)

        const key = getLocalDateKey(date)
        dailyMap.set(key, new Set())
    }

    for (const row of data ?? []) {
        if (!row.household_id || !row.created_at) continue

        const key = getLocalDateKey(row.created_at)

        if (!dailyMap.has(key)) {
            dailyMap.set(key, new Set())
        }

        dailyMap.get(key).add(row.household_id)
    }

    return Array.from(dailyMap.entries()).map(([date, households]) => ({
        date,
        activeHouseholds: households.size
    }))
}

export async function getSupportMetrics({ days = 30 } = {}) {
    const since = getSinceDate(days)

    const { data, error } = await supabase
        .from("product_feedback")
        .select("feedback_type, status, created_at")
        .gte("created_at", since.toISOString())

    if (error) throw error

    const byStatus = {}
    const byType = {}

    for (const row of data ?? []) {
        byStatus[row.status || "unknown"] =
            (byStatus[row.status || "unknown"] || 0) + 1

        byType[row.feedback_type || "unknown"] =
            (byType[row.feedback_type || "unknown"] || 0) + 1
    }

    const openTickets =
        (byStatus.new ?? 0) +
        (byStatus.reviewing ?? 0) +
        (byStatus.planned ?? 0)

    return {
        total: data?.length ?? 0,
        openTickets,
        byStatus,
        byType
    }
}

export function generateAnalyticsInsights({
    featureUsage = [],
    supportMetrics = null,
    dailyActiveHouseholds = []
}) {
    const insights = []

    const totalUsage = featureUsage.reduce(
        (sum, item) => sum + item.count,
        0
    )

    const topFeature = featureUsage[0]

    if (topFeature && totalUsage > 0) {
        const percentage = Math.round(
            (topFeature.count / totalUsage) * 100
        )

        insights.push({
            tone: "positive",
            title: `${topFeature.feature} is leading usage`,
            description: `${topFeature.feature} accounts for ${percentage}% of tracked activity in the selected period.`,
            footer: `${topFeature.count} usage events`
        })
    }

    if (supportMetrics?.total > 0) {
        const openTickets = supportMetrics.openTickets ?? 0

        insights.push({
            tone: openTickets > 0 ? "warning" : "positive",
            title: openTickets > 0
                ? "Support needs attention"
                : "Support queue is clear",
            description: openTickets > 0
                ? `${openTickets} support tickets are still active.`
                : "There are no active support tickets in the selected period.",
            footer: `${supportMetrics.total} total tickets`
        })
    }

    const activeDays = dailyActiveHouseholds.filter(
        day => day.activeHouseholds > 0
    ).length

    if (dailyActiveHouseholds.length > 0) {
        insights.push({
            tone: activeDays > 0 ? "neutral" : "warning",
            title: activeDays > 0
                ? "Household activity is being captured"
                : "No household activity captured",
            description: activeDays > 0
                ? `${activeDays} of the last ${dailyActiveHouseholds.length} days had household activity.`
                : "No usage events were recorded during this period.",
            footer: "Based on usage event tracking"
        })
    }

    if (insights.length === 0) {
        insights.push({
            tone: "idea",
            title: "Analytics are warming up",
            description: "As more usage events are tracked, Evergrove HQ will surface product insights here.",
            footer: "Keep instrumenting high-value events"
        })
    }

    return insights
}

export async function getEngagementMetrics() {
    const now = new Date()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const { data, error } = await supabase
        .from("usage_events")
        .select("user_id, event_type, metadata, created_at")
        .in("event_type", ["session_started", "daily_active"])
        .gte("created_at", thirtyDaysAgo.toISOString())

    if (error) throw error

    const rows = data ?? []

    const sessions = rows.filter(
        row => row.event_type === "session_started"
    )

    const dailyActiveRows = rows.filter(
        row => row.event_type === "daily_active"
    )

    const dau = new Set(
        dailyActiveRows
            .filter(row => new Date(row.created_at) >= todayStart)
            .map(row => row.user_id)
            .filter(Boolean)
    ).size

    const wau = new Set(
        dailyActiveRows
            .filter(row => new Date(row.created_at) >= sevenDaysAgo)
            .map(row => row.user_id)
            .filter(Boolean)
    ).size

    const mau = new Set(
        dailyActiveRows
            .map(row => row.user_id)
            .filter(Boolean)
    ).size

    const activeUsers = new Set(
        dailyActiveRows
            .map(row => row.user_id)
            .filter(Boolean)
    ).size

    const sessionsPerActiveUser =
        activeUsers > 0
            ? Number((sessions.length / activeUsers).toFixed(1))
            : 0

    const activeDaysByUser = new Map()

    for (const row of dailyActiveRows) {
        if (!row.user_id) continue

        const localDate =
            row.metadata?.local_date ||
            getLocalDateKey(row.created_at)

        if (!activeDaysByUser.has(row.user_id)) {
            activeDaysByUser.set(row.user_id, new Set())
        }

        activeDaysByUser.get(row.user_id).add(localDate)
    }

    const totalActiveDays = Array.from(activeDaysByUser.values())
        .reduce((sum, dates) => sum + dates.size, 0)

    const averageActiveDaysPerWeek =
        activeDaysByUser.size > 0
            ? Number((totalActiveDays / activeDaysByUser.size / (30 / 7)).toFixed(1))
            : 0

    return {
        sessions: sessions.length,
        dau,
        wau,
        mau,
        sessionsPerActiveUser,
        averageActiveDaysPerWeek
    }
}