import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { getIsAdmin } from "../../services/admin/adminService"

export default function AdminRoute({ children }) {
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        async function checkAccess() {
            const result = await getIsAdmin()
            setIsAdmin(result)
            setLoading(false)
        }

        checkAccess()
    }, [])

    if (loading) {
        return <div className="page-shell">Checking admin access...</div>
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}