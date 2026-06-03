import { useState } from "react"
import { supabase } from "../lib/supabase"

import logo from "../assets/evergrove-logo.svg"

export default function Login({ onLogin }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errorMessage, setErrorMessage] = useState("")

    async function handleLogin(event) {
        event.preventDefault()
        setErrorMessage("")

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            setErrorMessage(error.message)
            return
        }

        onLogin()
    }

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleLogin}>
                <div className="brand-mark login-mark">E</div>

                <img
                    src={logo}
                    alt="Evergrove"
                    className="login-logo"
                />

                <h1>Evergrove</h1>
                <p>Sign in to your family planner.</p>

                {errorMessage && (
                    <div className="error-box">{errorMessage}</div>
                )}

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    required
                />

                <button type="submit">Sign In</button>
            </form>
        </div>
    )
}