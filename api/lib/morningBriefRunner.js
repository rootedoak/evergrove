import { configureWebPush, sendPushToUser } from "./pushNotifications.js"
import { buildMorningBrief } from "./morningBriefBuilder.js"

function todayInTimezone(timezone) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date())
}

function currentHourInTimezone(timezone) {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        hourCycle: "h23"
    }).format(new Date())
}

function alreadySentToday(value, timezone) {
    if (!value) return false

    const sentDay = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date(value))

    return sentDay === todayInTimezone(timezone)
}

export async function runMorningBriefs({
    supabase,
    userId = null,
    householdId = null,
    respectScheduledHour = true,
    ignoreAlreadySentToday = false
}) {
    configureWebPush()

    let usersQuery = supabase
        .from("user_display_preferences")
        .select(`
            id,
            user_id,
            morning_brief_enabled,
            morning_brief_time,
            last_morning_brief_sent_at
        `)
        .eq("morning_brief_enabled", true)

    if (userId) {
        usersQuery = usersQuery.eq("user_id", userId)
    }

    const { data: users, error: usersError } = await usersQuery

    if (usersError) throw usersError

    const summary = {
        checkedUsers: users?.length || 0,
        sentUsers: 0,
        failedUsers: 0,
        expiredRemoved: 0,
        skips: {
            noHousehold: 0,
            householdMismatch: 0,
            alreadySentToday: 0,
            outsideScheduledHour: 0,
            noPushDelivered: 0
        },
        errors: []
    }

    for (const userPreference of users || []) {
        try {
            const { data: membership, error: membershipError } = await supabase
                .from("household_members")
                .select("household_id")
                .eq("user_id", userPreference.user_id)
                .limit(1)
                .maybeSingle()

            if (membershipError) throw membershipError

            const resolvedHouseholdId = membership?.household_id

            if (!resolvedHouseholdId) {
                summary.skips.noHousehold += 1
                continue
            }

            if (householdId && resolvedHouseholdId !== householdId) {
                summary.skips.householdMismatch += 1
                continue
            }

            const {
                data: householdPreferences,
                error: householdPreferenceError
            } = await supabase
                .from("household_preferences")
                .select("timezone")
                .eq("household_id", resolvedHouseholdId)
                .maybeSingle()

            if (householdPreferenceError) {
                throw householdPreferenceError
            }

            const timezone =
                householdPreferences?.timezone || "America/Chicago"

            if (
                !ignoreAlreadySentToday &&
                alreadySentToday(
                    userPreference.last_morning_brief_sent_at,
                    timezone
                )
            ) {
                summary.skips.alreadySentToday += 1
                continue
            }

            if (respectScheduledHour) {
                const currentHour = currentHourInTimezone(timezone)

                const briefHour = String(
                    userPreference.morning_brief_time || "07:00"
                )
                    .slice(0, 2)
                    .padStart(2, "0")

                if (currentHour !== briefHour) {
                    summary.skips.outsideScheduledHour += 1
                    continue
                }
            }

            const brief = await buildMorningBrief({
                supabase,
                userId: userPreference.user_id,
                householdId: resolvedHouseholdId,
                timezone
            })

            const pushResult = await sendPushToUser({
                supabase,
                userId: userPreference.user_id,
                title: brief.title,
                body: brief.body,
                url: brief.url
            })

            summary.expiredRemoved += pushResult.expiredRemoved || 0

            if ((pushResult.sent || 0) === 0) {
                summary.skips.noPushDelivered += 1
                continue
            }

            const { error: updateError } = await supabase
                .from("user_display_preferences")
                .update({
                    last_morning_brief_sent_at: new Date().toISOString()
                })
                .eq("id", userPreference.id)

            if (updateError) throw updateError

            summary.sentUsers += 1
        } catch (error) {
            summary.failedUsers += 1

            summary.errors.push({
                userId: userPreference.user_id,
                error: error.message || "Unknown error"
            })

            console.error("Morning brief user failed", {
                userId: userPreference.user_id,
                error
            })
        }
    }

    const skippedUsers = Object.values(summary.skips)
        .reduce((total, count) => total + count, 0)

    return {
        ok: summary.failedUsers === 0,
        ...summary,
        skippedUsers
    }
}