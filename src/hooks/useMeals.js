import { useEffect, useState } from "react"
import { getMealPlans } from "../services/mealService"

function getTodayDate() {
    const today = new Date()

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-")
}

export default function useMeals() {
    const [dinnerTonight, setDinnerTonight] = useState(null)
    const [loading, setLoading] = useState(true)

    async function loadMeals() {
        try {
            setLoading(true)

            const plans = await getMealPlans()

            const tonight =
                plans.find(
                    plan => plan.planned_date === getTodayDate()
                ) || null

            setDinnerTonight(tonight)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadMeals()
    }, [])

    return {
        dinnerTonight,
        loading
    }
}