export const TRUST_DOCUMENTS = [
    {
        slug: "privacy",
        documentType: "privacy",
        title: "Privacy Policy",
        description:
            "How Evergrove collects, uses, and protects your family's information.",
        readingTime: "9 minute read"
    },
    {
        slug: "terms",
        documentType: "terms",
        title: "Terms of Service",
        description:
            "The agreement that governs your use of Evergrove.",
        readingTime: "10 minute read"
    },
    {
        slug: "beta",
        documentType: "beta",
        title: "Beta Program Agreement",
        description:
            "What to expect while Evergrove is still being tested and improved.",
        readingTime: "4 minute read"
    },
    {
        slug: "ai-automation",
        documentType: "ai_automation",
        title: "AI & Automation",
        description:
            "How Evergrove uses automation and where human judgment still matters.",
        readingTime: "5 minute read"
    },
    {
        slug: "acceptable-use",
        documentType: "acceptable_use",
        title: "Acceptable Use Policy",
        description:
            "The rules that help keep Evergrove safe and respectful.",
        readingTime: "4 minute read"
    }
]

export function getTrustDocumentBySlug(slug) {
    return (
        TRUST_DOCUMENTS.find(
            document => document.slug === slug
        ) ?? null
    )
}