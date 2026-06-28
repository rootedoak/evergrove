export function createIntelligenceContext({
    household = null,
    user = null,

    data = {},

    services = {},

    actions = {},
}) {
    return {
        household,
        user,

        data,

        services,

        actions,
    }
}