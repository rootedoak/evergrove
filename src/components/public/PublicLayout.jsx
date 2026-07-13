import { useEffect } from "react"
import {
    Link,
    NavLink,
    Outlet,
    useLocation
} from "react-router-dom"

import logo from "../../assets/evergrove-logo.svg"
import "../../styles/public.css"

function PublicScrollManager() {
    const location = useLocation()

    useEffect(() => {
        if (location.hash) {
            const elementId = location.hash.slice(1)

            const timer = window.setTimeout(() => {
                const element =
                    document.getElementById(elementId)

                if (element) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    })
                }
            }, 50)

            return () => {
                window.clearTimeout(timer)
            }
        }

        window.scrollTo({
            top: 0,
            behavior: "auto"
        })
    }, [location.pathname, location.hash])

    return null
}

export default function PublicLayout() {
    return (
        <div className="public-site">
            <PublicScrollManager />

            <header className="public-site-header">
                <Link
                    to="/"
                    className="public-site-brand"
                    aria-label="Evergrove home"
                >
                    <img src={logo} alt="" />

                    <div>
                        <strong>Evergrove</strong>
                        <span>Where organized families grow.</span>
                    </div>
                </Link>

                <nav
                    className="public-site-nav"
                    aria-label="Public navigation"
                >
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            isActive ? "active" : undefined
                        }
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/about"
                        className={({ isActive }) =>
                            isActive ? "active" : undefined
                        }
                    >
                        About
                    </NavLink>

                    <NavLink
                        to="/trust"
                        className={({ isActive }) =>
                            isActive ? "active" : undefined
                        }
                    >
                        Trust
                    </NavLink>

                    <Link to="/#faq">
                        FAQ
                    </Link>
                </nav>

                <div className="public-site-header-actions">
                    <Link
                        to="/login?mode=signin"
                        className="public-site-sign-in"
                    >
                        Sign In
                    </Link>

                    <Link
                        to="/login?mode=signup"
                        className="public-site-button public-site-button--small"
                    >
                        Get Started
                    </Link>
                </div>
            </header>

            <main className="public-site-main">
                <Outlet />
            </main>

            <footer className="public-site-footer">
                <div className="public-site-footer-brand">
                    <img src={logo} alt="" />

                    <div>
                        <strong>Evergrove</strong>
                        <span>Where organized families grow.</span>
                    </div>
                </div>

                <div className="public-site-footer-links">
                    <Link to="/">Home</Link>
                    <Link to="/about">About</Link>
                    <Link to="/trust">Trust Center</Link>
                    <Link to="/#faq">FAQ</Link>
                    <Link to="/login?mode=signin">Sign In</Link>
                </div>

                <p>
                    © {new Date().getFullYear()} Evergrove.
                    Built for family life.
                </p>
            </footer>
        </div>
    )
}