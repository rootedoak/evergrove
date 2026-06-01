import { useEffect, useState } from "react"
import { getTrips } from "../services/tripService"

export default function useTrips() {
    const [trips, setTrips] = useState([])
    const [loading, setLoading] = useState(true)

    async function refreshTrips() {
        try {
            const data = await getTrips()
            setTrips(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshTrips()
    }, [])

    return {
        trips,
        loading,
        refreshTrips
    }
}