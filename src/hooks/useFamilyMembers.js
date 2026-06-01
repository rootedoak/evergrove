import { useEffect, useState } from "react"
import { getFamilyMembers } from "../services/familyService"

export default function useFamilyMembers() {
    const [familyMembers, setFamilyMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function loadFamilyMembers() {
        try {
            setError(null)
            const data = await getFamilyMembers()
            setFamilyMembers(data)
        } catch (error) {
            console.error(error)
            setError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFamilyMembers()
    }, [])

    return {
        familyMembers,
        loading,
        error,
        refreshFamilyMembers: loadFamilyMembers
    }
}