export function getRegistrationStatus(activity) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const openDate = activity.registration_open_date
        ? new Date(`${activity.registration_open_date}T00:00:00`)
        : null

    const closeDate = activity.registration_close_date
        ? new Date(`${activity.registration_close_date}T00:00:00`)
        : null

    if (!openDate && !closeDate) {
        return {
            label: "No Registration Dates",
            className: "status-neutral"
        }
    }

    if (openDate && today < openDate) {
        const days = Math.ceil(
            (openDate - today) / (1000 * 60 * 60 * 24)
        )

        return {
            label: `Opens in ${days} Days`,
            className: "status-warning"
        }
    }

    if (
        openDate &&
        closeDate &&
        today >= openDate &&
        today <= closeDate
    ) {
        const days = Math.ceil(
            (closeDate - today) / (1000 * 60 * 60 * 24)
        )

        if (days <= 7) {
            return {
                label: `Closes in ${days} Days`,
                className: "status-danger"
            }
        }

        return {
            label: "Registration Open",
            className: "status-success"
        }
    }

    if (closeDate && today > closeDate) {
        return {
            label: "Registration Closed",
            className: "status-muted"
        }
    }

    return {
        label: "Registration Open",
        className: "status-success"
    }
}