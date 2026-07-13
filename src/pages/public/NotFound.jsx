import { ArrowLeft, Home, Leaf } from "lucide-react"
import { Link } from "react-router-dom"

export default function NotFound() {
    return (
        <section className="public-not-found">
            <div className="public-not-found__card">
                <div
                    className="public-not-found__icon"
                    aria-hidden="true"
                >
                    <Leaf size={34} />
                </div>

                <span className="public-not-found__eyebrow">
                    404 · Page not found
                </span>

                <h1>
                    Looks like we wandered off the trail.
                </h1>

                <p>
                    This page may have moved, the link may be outdated,
                    or the address may have been entered incorrectly.
                </p>

                <div className="public-not-found__actions">
                    <Link
                        to="/"
                        className="public-site-button"
                    >
                        <Home size={18} />
                        Return Home
                    </Link>

                    <Link
                        to="/about"
                        className="public-not-found__secondary"
                    >
                        <ArrowLeft size={18} />
                        Learn About Evergrove
                    </Link>
                </div>
            </div>
        </section>
    )
}