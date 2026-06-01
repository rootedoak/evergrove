import { useEffect, useState } from "react"
import { getDocuments } from "../services/documentService"

export default function useDocuments() {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function loadDocuments() {
        try {
            setError(null)
            const data = await getDocuments()
            setDocuments(data)
        } catch (error) {
            console.error(error)
            setError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDocuments()
    }, [])

    return {
        documents,
        loading,
        error,
        refreshDocuments: loadDocuments
    }
}