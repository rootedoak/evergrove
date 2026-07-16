import { Navigate } from "react-router-dom"

import useHouseholdRole from "../hooks/useHouseholdRole"

import LoadingScreen from "./LoadingScreen"

export default function RoleRoute({
    allow,
    children
}) {
    const {
        role,
        loading
    } = useHouseholdRole()

    if (loading) {
        return <LoadingScreen />
    }

    if (!allow.includes(role)) {
        return <Navigate to="/" replace />
    }

    return children
}