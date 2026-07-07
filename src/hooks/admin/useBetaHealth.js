import { useEffect, useState } from "react"
import { getBetaHealthUsers } from "../../services/admin/betaHealthService"

export default function useBetaHealth() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                setUsers(await getBetaHealthUsers())
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    return {
        users,
        loading
    }
}