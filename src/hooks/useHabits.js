import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react"

import {
    adjustHabitProgress,
    getHabits,
    getHouseholdHabitProgress,
    getTodayLocal
} from "../services/habitService"

export default function useHabits(
    householdId
) {
    const [habits, setHabits] =
        useState([])

    const [todayProgress, setTodayProgress] =
        useState([])

    const [
        updatingHabitIds,
        setUpdatingHabitIds
    ] = useState([])

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState(null)

    const loadHabits =
        useCallback(async () => {
            if (!householdId) {
                setHabits([])
                setTodayProgress([])
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError(null)

                const today =
                    getTodayLocal()

                const [
                    habitData,
                    progressData
                ] = await Promise.all([
                    getHabits({
                        householdId
                    }),
                    getHouseholdHabitProgress({
                        householdId,
                        startDate: today,
                        endDate: today
                    })
                ])

                setHabits(
                    habitData || []
                )

                setTodayProgress(
                    progressData || []
                )
            } catch (loadError) {
                console.error(
                    "Unable to load habits:",
                    loadError
                )

                setError(loadError)
            } finally {
                setLoading(false)
            }
        }, [householdId])

    useEffect(() => {
        loadHabits()
    }, [loadHabits])

    async function updateCountHabit(
        habitId,
        delta
    ) {
        if (
            !habitId ||
            !Number.isFinite(delta) ||
            delta === 0 ||
            updatingHabitIds.includes(
                habitId
            )
        ) {
            return
        }

        const habit =
            habits.find(
                item =>
                    item.id === habitId
            )

        if (
            !habit ||
            habit.goal_type !== "count"
        ) {
            return
        }

        const today =
            getTodayLocal()

        const existingProgress =
            todayProgress.find(
                progress =>
                    progress
                        .habit_definition_id ===
                    habitId
            ) || null

        const previousProgress =
            todayProgress

        const currentValue =
            Number(
                existingProgress
                    ?.progress_value ||
                0
            )

        const nextValue =
            Math.max(
                0,
                currentValue + delta
            )

        if (
            nextValue === currentValue
        ) {
            return
        }

        const goalValue =
            Number(
                habit.goal_value || 1
            )

        const isComplete =
            nextValue >= goalValue

        const optimisticProgress = {
            ...existingProgress,
            habit_definition_id:
                habitId,
            progress_date:
                today,
            progress_value:
                nextValue,
            is_complete:
                isComplete,
            completed_at:
                isComplete
                    ? (
                        existingProgress
                            ?.completed_at ||
                        new Date()
                            .toISOString()
                    )
                    : null,
            updated_at:
                new Date()
                    .toISOString()
        }

        setError(null)

        setUpdatingHabitIds(
            current => [
                ...current,
                habitId
            ]
        )

        setTodayProgress(
            current => {
                const alreadyExists =
                    current.some(
                        progress =>
                            progress
                                .habit_definition_id ===
                            habitId
                    )

                if (!alreadyExists) {
                    return [
                        ...current,
                        optimisticProgress
                    ]
                }

                return current.map(
                    progress =>
                        progress
                            .habit_definition_id ===
                            habitId
                            ? optimisticProgress
                            : progress
                )
            }
        )

        try {
            const result =
                await adjustHabitProgress({
                    habitDefinitionId:
                        habitId,
                    progressDate:
                        today,
                    delta
                })

            const savedProgress =
                Array.isArray(result)
                    ? result[0]
                    : result

            if (!savedProgress) {
                return
            }

            setTodayProgress(
                current => {
                    const alreadyExists =
                        current.some(
                            progress =>
                                progress
                                    .habit_definition_id ===
                                habitId
                        )

                    if (!alreadyExists) {
                        return [
                            ...current,
                            savedProgress
                        ]
                    }

                    return current.map(
                        progress =>
                            progress
                                .habit_definition_id ===
                                habitId
                                ? savedProgress
                                : progress
                    )
                }
            )
        } catch (updateError) {
            console.error(
                "Unable to update habit progress:",
                updateError
            )

            setTodayProgress(
                previousProgress
            )

            setError(updateError)

            throw updateError
        } finally {
            setUpdatingHabitIds(
                current =>
                    current.filter(
                        id =>
                            id !== habitId
                    )
            )
        }
    }

    const habitsWithProgress =
        useMemo(() => {
            const progressByHabitId =
                new Map(
                    todayProgress.map(
                        progress => [
                            progress
                                .habit_definition_id,
                            progress
                        ]
                    )
                )

            return habits.map(
                habit => {
                    const progress =
                        progressByHabitId.get(
                            habit.id
                        ) || null

                    return {
                        ...habit,

                        todayProgress:
                            progress,

                        completedToday:
                            Boolean(
                                progress
                                    ?.is_complete
                            ),

                        progressValue:
                            Number(
                                progress
                                    ?.progress_value ||
                                0
                            ),

                        isUpdating:
                            updatingHabitIds.includes(
                                habit.id
                            ),

                        currentStreak: 0,

                        longestStreak: 0
                    }
                }
            )
        }, [
            habits,
            todayProgress,
            updatingHabitIds
        ])

    const completedToday =
        useMemo(
            () =>
                habitsWithProgress.filter(
                    habit =>
                        habit.completedToday
                ),
            [habitsWithProgress]
        )

    const remainingToday =
        useMemo(
            () =>
                habitsWithProgress.filter(
                    habit =>
                        !habit.completedToday
                ),
            [habitsWithProgress]
        )

    const completionPercentage =
        habitsWithProgress.length > 0
            ? Math.round(
                (
                    completedToday.length /
                    habitsWithProgress.length
                ) * 100
            )
            : 0

    return {
        habits:
            habitsWithProgress,

        rawHabits:
            habits,

        todayProgress,

        completedToday,

        remainingToday,

        completionPercentage,

        loading,

        error,

        updatingHabitIds,

        updateCountHabit,

        setHabits,

        setTodayProgress,

        refreshHabits:
            loadHabits
    }
}