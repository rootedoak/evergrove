import { useState } from "react"

import AdminPageHeader from "../../../components/admin/AdminPageHeader"
import AdminCard from "../../../components/admin/AdminCard"
import AdminEmptyState from "../../../components/admin/AdminEmptyState"

import useUsers from "../../../hooks/admin/useUsers"

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

                            <div
                                key={user.family_member_id}
                                className="admin-search-result"
                            >
                                <div className="admin-user-card">

                                    <div>

                                        <strong>{user.name}</strong>

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

                            </div>

                        ))}

                    </div>

                )}

            </AdminCard>

        </div>
    )
}