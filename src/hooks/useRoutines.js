import { useEffect, useState } from "react"
import { getRoutines } from "../services/routineService"

export default function useRoutines() {
    const [routines, setRoutines] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function loadRoutines() {
        try {
            setError(null)

            const data = await getRoutines()

            const refreshedData = await getRoutines()

            setRoutines(refreshedData)
        } catch (error) {
            console.error(error)
            setError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRoutines()
    }, [])

    return {
        routines,
        loading,
        error,
        refreshRoutines: loadRoutines
    }
}