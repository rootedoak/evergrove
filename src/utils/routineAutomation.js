import { createTaskFromRoutine } from "../services/routineService"

function isDue(dateString) {
    if (!dateString) return false

    const today = new Date()
    const dueDate = new Date(`${dateString}T00:00:00`)

    today.setHours(0, 0, 0, 0)

    return dueDate <= today
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