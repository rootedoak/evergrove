export async function requireAdminUser({ supabase, req }) {
    const authHeader = req.headers.authorization || ""

    if (!authHeader.startsWith("Bearer ")) {
        throw new Error("Missing authorization token.")
    }

    const token = authHeader.replace("Bearer ", "")

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser(token)

    if (userError) throw userError
    if (!user) throw new Error("Invalid user token.")

    const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle()

    if (adminError) throw adminError
    if (!adminUser) throw new Error("User is not an admin.")

    return user
}