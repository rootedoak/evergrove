import { useEffect } from "react"
import { useLocation } from "react-router-dom"

const DEFAULT_METADATA = {
    title: "Evergrove | Where Organized Families Grow",
    description:
        "Evergrove helps families organize calendars, tasks, meals, shopping, trips, school, and everyday life in one calm, shared place."
}

function getMetadata(pathname, search) {
    const searchParams = new URLSearchParams(search)
    const loginMode = searchParams.get("mode")

    if (pathname === "/about") {
        return {
            title: "About Evergrove | A Calmer Way to Manage Family Life",
            description:
                "Learn why Evergrove was created and how it helps families spend less time managing life and more time living it."
        }
    }

    if (pathname === "/trust") {
        return {
            title: "Evergrove Trust Center | Privacy, Security, and Legal",
            description:
                "Review Evergrove's privacy, security, legal, and data protection information."
        }
    }

    if (pathname.startsWith("/trust/")) {
        return {
            title: "Legal and Trust Information | Evergrove",
            description:
                "Review Evergrove's legal, privacy, security, and data protection documentation."
        }
    }

    if (
        pathname === "/login" &&
        (
            loginMode === "signup" ||
            loginMode === "create-account"
        )
    ) {
        return {
            title: "Create Your Evergrove Account",
            description:
                "Create your Evergrove household and bring your family's schedules, tasks, meals, shopping, school, and everyday life together."
        }
    }

    if (
        pathname === "/login" &&
        (
            loginMode === "invite"
        )
    ) {
        return {
            title: "Continue Your Household Invitation | Evergrove",
            description:
                "Continue your invitation and join your household on Evergrove."
        }
    }

    if (pathname === "/login") {
        return {
            title: "Log In | Evergrove",
            description:
                "Log in to Evergrove and manage your family's calendar, tasks, meals, shopping, trips, and everyday life."
        }
    }

    if (pathname.startsWith("/r/")) {
        return {
            title: "Join Evergrove | Where Organized Families Grow",
            description:
                "Discover Evergrove and create a calmer, more organized place for your family's everyday life."
        }
    }

    if (pathname.startsWith("/invite/")) {
        return {
            title: "Join Your Household | Evergrove",
            description:
                "Accept your household invitation and join your family on Evergrove."
        }
    }

    return DEFAULT_METADATA
}

function updateMetaDescription(description) {
    let descriptionTag = document.querySelector(
        'meta[name="description"]'
    )

    if (!descriptionTag) {
        descriptionTag = document.createElement("meta")
        descriptionTag.setAttribute("name", "description")
        document.head.appendChild(descriptionTag)
    }

    descriptionTag.setAttribute("content", description)
}

export default function PublicMetadata() {
    const location = useLocation()

    useEffect(() => {
        const metadata = getMetadata(
            location.pathname,
            location.search
        )

        document.title = metadata.title
        updateMetaDescription(metadata.description)
    }, [location.pathname, location.search])

    return null
}