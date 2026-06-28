export function createIntelligenceContext({
    navigate,
    createAssistantTask,
}) {
    return {
        navigate,
        createAssistantTask,

        actions: {
            navigate,
            createAssistantTask,
        }
    }
}