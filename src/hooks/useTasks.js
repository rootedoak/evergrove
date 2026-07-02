import { useEffect, useState } from "react"
import { getTasks } from "../services/taskService"

export default function useTasks() {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function loadTasks() {
        try {
            setError(null)
            const data = await getTasks()
            setTasks(data)
        } catch (error) {
            console.error(error)
            setError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTasks()
    }, [])

    return {
        tasks,
        loading,
        setTasks,
        error,
        refreshTasks: loadTasks
    }
}