import { useEffect, useMemo, useState } from "react"

import {
    getReactionsForTargets,
    addReaction,
    removeReaction,
} from "../services/reactionService"

export default function useReactions(targetType, targetIds = []) {
    const [reactions, setReactions] = useState([])
    const [loading, setLoading] = useState(true)

    const targetKey = useMemo(
        () => targetIds.filter(Boolean).sort().join(","),
        [targetIds]
    )

    async function loadReactions() {
        if (!targetType || !targetIds.length) {
            setReactions([])
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            const data = await getReactionsForTargets(targetType, targetIds)
            setReactions(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadReactions()
    }, [targetType, targetKey])

    async function toggleReaction({ targetId, reaction }) {
        const existing = reactions.find(
            item =>
                item.target_id === targetId &&
                item.reaction === reaction
        )

        if (existing) {
            await removeReaction({
                targetType,
                targetId,
                reaction,
            })

            setReactions(current =>
                current.filter(item => item.id !== existing.id)
            )

            return
        }

        const created = await addReaction({
            targetType,
            targetId,
            reaction,
        })

        if (created) {
            setReactions(current => [
                created,
                ...current,
            ])
        }
    }

    function getReactionSummary(targetId) {
        const targetReactions = reactions.filter(
            item => item.target_id === targetId
        )

        return targetReactions.reduce((summary, item) => {
            summary[item.reaction] = (summary[item.reaction] || 0) + 1
            return summary
        }, {})
    }

    return {
        reactions,
        loading,
        loadReactions,
        toggleReaction,
        getReactionSummary,
    }
}