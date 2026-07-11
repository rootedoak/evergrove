import { supabase } from "../../lib/supabase"

const ROADMAP_FIELDS = `
    id,
    title,
    description,
    product_area,
    status,
    priority,
    target_release,
    internal_notes,
    customer_visible,
    completed_at,
    sort_order,
    created_at,
    updated_at
`

export async function getRoadmapItems() {
    const { data, error } = await supabase
        .from("product_roadmap_items")
        .select(ROADMAP_FIELDS)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })

    if (error) throw error

    return data ?? []
}

export async function createRoadmapItem(item) {
    const payload = normalizeRoadmapItem(item)

    const { data, error } = await supabase
        .from("product_roadmap_items")
        .insert(payload)
        .select(ROADMAP_FIELDS)
        .single()

    if (error) throw error

    return data
}

export async function updateRoadmapItem(itemId, updates) {
    if (!itemId) {
        throw new Error("A roadmap item ID is required.")
    }

    const payload = normalizeRoadmapItem(updates, {
        includeDefaults: false
    })

    const { data, error } = await supabase
        .from("product_roadmap_items")
        .update(payload)
        .eq("id", itemId)
        .select(ROADMAP_FIELDS)
        .single()

    if (error) throw error

    return data
}

export async function updateRoadmapItemStatus(itemId, status) {
    if (!itemId) {
        throw new Error("A roadmap item ID is required.")
    }

    if (!status) {
        throw new Error("A roadmap status is required.")
    }

    const { data, error } = await supabase
        .from("product_roadmap_items")
        .update({ status })
        .eq("id", itemId)
        .select(ROADMAP_FIELDS)
        .single()

    if (error) throw error

    return data
}

export async function markRoadmapItemComplete(itemId) {
    return updateRoadmapItemStatus(itemId, "complete")
}

export async function deleteRoadmapItem(itemId) {
    if (!itemId) {
        throw new Error("A roadmap item ID is required.")
    }

    const { error } = await supabase
        .from("product_roadmap_items")
        .delete()
        .eq("id", itemId)

    if (error) throw error
}

function normalizeRoadmapItem(
    item,
    { includeDefaults = true } = {}
) {
    const payload = {}

    if ("title" in item || includeDefaults) {
        payload.title = item.title?.trim() ?? ""
    }

    if ("description" in item || includeDefaults) {
        payload.description = cleanOptionalText(item.description)
    }

    if ("product_area" in item || includeDefaults) {
        payload.product_area =
            item.product_area?.trim() || "Platform"
    }

    if ("status" in item || includeDefaults) {
        payload.status = item.status || "backlog"
    }

    if ("priority" in item || includeDefaults) {
        payload.priority = item.priority || "medium"
    }

    if ("target_release" in item || includeDefaults) {
        payload.target_release = cleanOptionalText(
            item.target_release
        )
    }

    if ("internal_notes" in item || includeDefaults) {
        payload.internal_notes = cleanOptionalText(
            item.internal_notes
        )
    }

    if ("customer_visible" in item || includeDefaults) {
        payload.customer_visible =
            item.customer_visible ?? true
    }

    if ("sort_order" in item || includeDefaults) {
        payload.sort_order = Number(item.sort_order) || 0
    }

    return payload
}

function cleanOptionalText(value) {
    const cleanedValue = value?.trim()

    return cleanedValue || null
}