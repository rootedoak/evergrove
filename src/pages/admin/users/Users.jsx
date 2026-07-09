import { useState } from "react"
import { Link } from "react-router-dom"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"

import useUsers from "../../../hooks/admin/useUsers"

import AdminBadge from "../../../components/admin/AdminBadge"
import { getUserBadges } from "../../../utils/adminBadges"

export default function Users() {
    const [search, setSearch] = useState("")

    const {
        users,
        loading
    } = useUsers(search)

    return (
        <div className="admin-page">

            <AdminPageHeader
                eyebrow="Administration"
                title="Users"
                description="Browse and manage Evergrove users."
            />

            <AdminCard>

                <input
                    className="admin-input"
                    type="search"
                    placeholder="Search users..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                {loading ? (

                    <AdminEmptyState>
                        Loading users...
                    </AdminEmptyState>

                ) : users.length === 0 ? (

                    <AdminEmptyState>
                        No users found.
                    </AdminEmptyState>

                ) : (

                    <div className="admin-search-results">

                        {users.map(user => (

                            <Link
                                key={user.family_member_id}
                                to={`/admin/users/${user.user_id}`}
                                className="admin-search-result admin-dashboard-link-row"
                            >
                                <div className="admin-user-card">

                                    <div>

                                        <div className="admin-row-title-with-badge">
                                            <strong>{user.name}</strong>

                                            {getUserBadges(user).map(badge => (
                                                <AdminBadge
                                                    key={badge.label}
                                                    badge={badge}
                                                />
                                            ))}
                                        </div>

                                        <div className="admin-muted">
                                            {user.household_name ?? "No household"}
                                        </div>

                                    </div>

                                    <div className="admin-user-meta">

                                        <span>
                                            {user.ticket_count ?? 0} Tickets
                                        </span>

                                        <span>
                                            {user.usage_event_count ?? 0} Events
                                        </span>

                                    </div>

                                </div>

                            </Link>

                        ))}

                    </div>

                )}

            </AdminCard>

        </div>
    )
}