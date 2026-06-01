import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Profile() {
    const [user, setUser] = useState(null)

    useEffect(() => {
        async function loadUser() {
            const {
                data: { user }
            } = await supabase.auth.getUser()

            setUser(user)
        }

        loadUser()
    }, [])

    async function handleLogout() {
        const confirmed = window.confirm(
            "Are you sure you want to sign out?"
        )

        if (!confirmed) return

        await supabase.auth.signOut()
    }

    return (
        <>
            <section className="hero-card">
                <p className="eyebrow">Account</p>
                <h2>Profile</h2>

                <p>
                    Manage your account and Evergrove preferences.
                </p>
            </section>

            <section className="card">
                <h3>Account Information</h3>

                <div className="stack">
                    <div>
                        <strong>Email</strong>
                        <p>{user?.email || "Loading..."}</p>
                    </div>

                    <div>
                        <strong>User ID</strong>
                        <p>{user?.id || "Loading..."}</p>
                    </div>
                </div>
            </section>

            <section className="card">
                <h3>Account Actions</h3>

                <div className="card-actions">
                    <button
                        className="danger-button"
                        onClick={handleLogout}
                    >
                        Sign Out
                    </button>
                </div>
            </section>
        </>
    )
}