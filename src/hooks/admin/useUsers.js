import { useEffect, useState } from "react"

import { getUsers } from "../../services/admin/userAdminService"

export default function useUsers(search) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    async function refresh() {
        try {
            setLoading(true)
            setUsers(await getUsers(search))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
    }, [search])

    return {
        users,
        loading,
        refresh
    }
}