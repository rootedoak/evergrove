import { createTaskFromRoutine } from "../services/routineService"

function getLocalDateString() {
    const today = new Date()

    const year = today.getFullYear()
    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0")
    const day = String(
        today.getDate()
    ).padStart(2, "0")

    return `${year}-${month}-${day}`
}

function isDue(dateString) {
    if (!dateString) return false

    return (
        String(dateString).slice(0, 10) <=
        getLocalDateString()
    )
}

export async function runRoutineAutomation(routines) {
    const dueRoutines = routines.filter(
        routine =>
            routine.active &&
            routine.create_task &&
            !routine.task_created &&
            isDue(routine.next_due)
    )

    for (const routine of dueRoutines) {
        try {
            await createTaskFromRoutine(routine)
        } catch (error) {
            console.error(
                "Routine automation failed:",
                routine.title,
                error
            )
        }
    }
}
