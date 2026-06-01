import { useEffect, useState } from "react"
import { getSchoolItems } from "../services/schoolService"

export default function useSchoolItems() {
    const [schoolItems, setSchoolItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function loadSchoolItems() {
        try {
            setError(null)
            const data = await getSchoolItems()
            setSchoolItems(data)
        } catch (error) {
            console.error(error)
            setError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSchoolItems()
    }, [])

    return {
        schoolItems,
        loading,
        error,
        refreshSchoolItems: loadSchoolItems
    }
}