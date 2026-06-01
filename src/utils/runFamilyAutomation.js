import { getRoutines } from "../services/routineService"
import { runRoutineAutomation } from "./routineAutomation"

export async function runFamilyAutomation() {
    try {
        const routines = await getRoutines()

        await runRoutineAutomation(routines)

        // Future automation modules:
        // await runRegistrationAutomation()
        // await runSchoolAutomation()
        // await runNotificationAutomation()
        // await runDocumentAutomation()
    } catch (error) {
        console.error("Family automation failed:", error)
    }
}