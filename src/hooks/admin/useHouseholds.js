import { useEffect, useState } from "react"
import { getHouseholds } from "../../services/admin/householdAdminService"

export default function useHouseholds() {
    const [households, setHouseholds] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await getHouseholds()
                setHouseholds(data)
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    return {
        households,
        loading
    }
}