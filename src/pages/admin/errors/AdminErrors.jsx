import { useEffect, useMemo, useState } from "react"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"

import {
    getApplicationErrors
} from "../../../services/admin/adminErrorService"

function formatDateTime(value) {
    if (!value) return "Unknown"

    return new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    })
}

function getRoute(error) {
    return `${error.pathname}${error.search}`
}

export default function AdminErrors() {
    const [errors, setErrors] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState("")
    const [days, setDays] = useState(30)
    const [selectedError, setSelectedError] = useState(null)

    useEffect(() => {
        let active = true

        async function loadErrors() {
            setLoading(true)
            setLoadError("")

            try {
                const data = await getApplicationErrors({
                    days,
                    limit: 100
                })

                if (active) {
                    setErrors(data)
                    setSelectedError(current => {
                        if (
                            current &&
                            data.some(error => error.id === current.id)
                        ) {
                            return current
                        }

                        return data[0] ?? null
                    })
                }
            } catch (error) {
                console.error(
                    "Unable to load application errors",
                    error
                )

                if (active) {
                    setLoadError(
                        error.message ||
                        "Unable to load application errors."
                    )
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        loadErrors()

        return () => {
            active = false
        }
    }, [days])

    const uniqueUsers = useMemo(() => {
        return new Set(
            errors
                .map(error => error.userId)
                .filter(Boolean)
        ).size
    }, [errors])

    const uniqueRoutes = useMemo(() => {
        return new Set(
            errors.map(error => error.pathname)
        ).size
    }, [errors])

    return (
        <div className="admin-page">
            <AdminPageHeader
                eyebrow="System"
                title="Errors"
                description="Review unexpected application failures recorded by Evergrove."
                actions={
                    <select
                        className="admin-select"
                        value={days}
                        onChange={event =>
                            setDays(Number(event.target.value))
                        }
                        aria-label="Error reporting period"
                    >
                        <option value={7}>
                            Last 7 days
                        </option>

                        <option value={30}>
                            Last 30 days
                        </option>

                        <option value={90}>
                            Last 90 days
                        </option>
                    </select>
                }
            />

            <section className="admin-grid admin-grid-3">
                <AdminCard title="Recorded Errors">
                    <strong className="admin-error-stat">
                        {errors.length}
                    </strong>

                    <p>
                        In the selected period
                    </p>
                </AdminCard>

                <AdminCard title="Affected Users">
                    <strong className="admin-error-stat">
                        {uniqueUsers}
                    </strong>

                    <p>
                        Unique authenticated users
                    </p>
                </AdminCard>

                <AdminCard title="Affected Routes">
                    <strong className="admin-error-stat">
                        {uniqueRoutes}
                    </strong>

                    <p>
                        Unique application paths
                    </p>
                </AdminCard>
            </section>

            {loading && (
                <AdminEmptyState>
                    Loading application errors...
                </AdminEmptyState>
            )}

            {!loading && loadError && (
                <AdminCard title="Unable to load errors">
                    <p>{loadError}</p>
                </AdminCard>
            )}

            {!loading &&
                !loadError &&
                errors.length === 0 && (
                    <AdminEmptyState>
                        No application errors were recorded during
                        this period.
                    </AdminEmptyState>
                )}

            {!loading &&
                !loadError &&
                errors.length > 0 && (
                    <section className="admin-error-layout">
                        <AdminCard title="Recent Errors">
                            <div className="admin-error-list">
                                {errors.map(error => (
                                    <button
                                        key={error.id}
                                        type="button"
                                        className={
                                            selectedError?.id === error.id
                                                ? "admin-error-row active"
                                                : "admin-error-row"
                                        }
                                        onClick={() =>
                                            setSelectedError(error)
                                        }
                                    >
                                        <div>
                                            <strong>
                                                {error.message}
                                            </strong>

                                            <span>
                                                {getRoute(error)}
                                            </span>
                                        </div>

                                        <time>
                                            {formatDateTime(
                                                error.createdAt
                                            )}
                                        </time>
                                    </button>
                                ))}
                            </div>
                        </AdminCard>

                        <AdminCard title="Error Details">
                            {selectedError ? (
                                <div className="admin-error-details">
                                    <div>
                                        <span>Message</span>
                                        <strong>
                                            {selectedError.message}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Route</span>
                                        <strong>
                                            {getRoute(selectedError)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>App Version</span>
                                        <strong>
                                            {selectedError.appVersion}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Source</span>
                                        <strong>
                                            {selectedError.source}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Occurred</span>
                                        <strong>
                                            {formatDateTime(
                                                selectedError.occurredAt
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>User ID</span>
                                        <strong>
                                            {selectedError.userId ||
                                                "Unknown"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Household ID</span>
                                        <strong>
                                            {selectedError.householdId ||
                                                "Unknown"}
                                        </strong>
                                    </div>

                                    <div className="admin-error-stack">
                                        <span>Component Stack</span>

                                        <pre>
                                            {selectedError.componentStack ||
                                                "No component stack recorded."}
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <AdminEmptyState>
                                    Select an error to view its details.
                                </AdminEmptyState>
                            )}
                        </AdminCard>
                    </section>
                )}
        </div>
    )
}