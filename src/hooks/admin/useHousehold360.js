import {
    useCallback,
    useEffect,
    useState
} from "react"

import {
    getHousehold360,
    setHouseholdBillingExemption
} from "../../services/admin/household360Service"

export default function useHousehold360(householdId) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [savingBilling, setSavingBilling] =
        useState(false)

    const refresh = useCallback(async () => {
        if (!householdId) return

        setLoading(true)
        setError(null)

        try {
            const result =
                await getHousehold360(householdId)

            setData(result)
        } catch (err) {
            console.error(
                "Failed to load Household 360:",
                err
            )

            setError(err)
            setData(null)
        } finally {
            setLoading(false)
        }
    }, [householdId])

    useEffect(() => {
        refresh()
    }, [refresh])

    const changeBillingExemption =
        useCallback(
            async ({
                billingExempt,
                reason = null
            }) => {
                if (!householdId) {
                    throw new Error(
                        "householdId is required"
                    )
                }

                setSavingBilling(true)

                try {
                    await setHouseholdBillingExemption({
                        householdId,
                        billingExempt,
                        reason
                    })

                    await refresh()
                } finally {
                    setSavingBilling(false)
                }
            },
            [householdId, refresh]
        )

    return {
        data,
        loading,
        error,
        refresh,
        savingBilling,
        changeBillingExemption
    }
}