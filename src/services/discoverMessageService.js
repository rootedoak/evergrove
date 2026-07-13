import { supabase } from "../lib/supabase"

async function getCurrentUserId() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error("No authenticated user")

    return user.id
}

async function getDiscoverMessageImageUrl(path) {
    if (!path) return null

    const { data, error } = await supabase.storage
        .from("discover-message-images")
        .createSignedUrl(path, 60 * 60)

    if (error) throw error

    return data?.signedUrl ?? null
}

export async function getNextDiscoverMessage() {
    const userId = await getCurrentUserId()

    const [
        { data: messages, error: messagesError },
        { data: receipts, error: receiptsError }
    ] = await Promise.all([
        supabase
            .from("discover_messages")
            .select(`
                id,
                title,
                message,
                message_type,
                priority,
                action_label,
                action_url,
                dismissible,
                starts_at,
                ends_at,
                created_at,
                image_path,
                image_name,
                image_type,
                image_size
            `)
            .eq("published", true)
            .order("priority", {
                ascending: false
            })
            .order("created_at", {
                ascending: false
            }),

        supabase
            .from("discover_message_receipts")
            .select(`
                discover_message_id,
                dismissed_at
            `)
            .eq("user_id", userId)
    ])

    if (messagesError) throw messagesError
    if (receiptsError) throw receiptsError

    const receiptByMessageId = new Map(
        (receipts ?? []).map(receipt => [
            receipt.discover_message_id,
            receipt
        ])
    )

    const nextMessage =
        (messages ?? []).find(message => {
            const receipt =
                receiptByMessageId.get(message.id)

            return !receipt?.dismissed_at
        }) ?? null

    if (!nextMessage) return null

    const imageUrl =
        nextMessage.image_path
            ? await getDiscoverMessageImageUrl(
                nextMessage.image_path
            )
            : null

    return {
        ...nextMessage,
        image_url: imageUrl
    }
}

export async function markDiscoverMessageSeen(
    discoverMessageId
) {
    if (!discoverMessageId) {
        throw new Error(
            "discoverMessageId is required"
        )
    }

    const userId = await getCurrentUserId()
    const now = new Date().toISOString()

    const {
        data: existingReceipt,
        error: receiptError
    } = await supabase
        .from("discover_message_receipts")
        .select(`
            id,
            view_count
        `)
        .eq(
            "discover_message_id",
            discoverMessageId
        )
        .eq("user_id", userId)
        .maybeSingle()

    if (receiptError) throw receiptError

    if (existingReceipt) {
        const { error } = await supabase
            .from("discover_message_receipts")
            .update({
                last_seen_at: now,
                view_count:
                    (existingReceipt.view_count ?? 0) + 1,
                updated_at: now
            })
            .eq("id", existingReceipt.id)

        if (error) throw error
        return
    }

    const { error } = await supabase
        .from("discover_message_receipts")
        .insert({
            discover_message_id:
                discoverMessageId,
            user_id: userId,
            first_seen_at: now,
            last_seen_at: now,
            view_count: 1,
            created_at: now,
            updated_at: now
        })

    if (error) throw error
}

export async function dismissDiscoverMessage(
    discoverMessageId
) {
    if (!discoverMessageId) {
        throw new Error(
            "discoverMessageId is required"
        )
    }

    const userId = await getCurrentUserId()
    const now = new Date().toISOString()

    const {
        data: existingReceipt,
        error: receiptError
    } = await supabase
        .from("discover_message_receipts")
        .select("id")
        .eq(
            "discover_message_id",
            discoverMessageId
        )
        .eq("user_id", userId)
        .maybeSingle()

    if (receiptError) throw receiptError

    if (existingReceipt) {
        const { error } = await supabase
            .from("discover_message_receipts")
            .update({
                dismissed_at: now,
                updated_at: now
            })
            .eq("id", existingReceipt.id)

        if (error) throw error
        return
    }

    const { error } = await supabase
        .from("discover_message_receipts")
        .insert({
            discover_message_id:
                discoverMessageId,
            user_id: userId,
            first_seen_at: now,
            last_seen_at: now,
            view_count: 1,
            dismissed_at: now,
            created_at: now,
            updated_at: now
        })

    if (error) throw error
}

export async function trackDiscoverMessageAction(
    discoverMessageId
) {
    if (!discoverMessageId) {
        throw new Error(
            "discoverMessageId is required"
        )
    }

    const userId = await getCurrentUserId()
    const now = new Date().toISOString()

    const {
        data: existingReceipt,
        error: receiptError
    } = await supabase
        .from("discover_message_receipts")
        .select("id")
        .eq(
            "discover_message_id",
            discoverMessageId
        )
        .eq("user_id", userId)
        .maybeSingle()

    if (receiptError) throw receiptError

    if (existingReceipt) {
        const { error } = await supabase
            .from("discover_message_receipts")
            .update({
                action_clicked_at: now,
                updated_at: now
            })
            .eq("id", existingReceipt.id)

        if (error) throw error
        return
    }

    const { error } = await supabase
        .from("discover_message_receipts")
        .insert({
            discover_message_id:
                discoverMessageId,
            user_id: userId,
            first_seen_at: now,
            last_seen_at: now,
            view_count: 1,
            action_clicked_at: now,
            created_at: now,
            updated_at: now
        })

    if (error) throw error
}