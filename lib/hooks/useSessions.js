import { useState, useEffect } from 'react'
import { sessionsApi } from '../api/sessions'

export function useSessions(playerId = null) {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        setLoading(true)
        sessionsApi
            .getSessions(0, 100, playerId)
            .then(setSessions)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [playerId])

    return { sessions, loading, error, setSessions }
}

export function useSession(sessionId) {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!sessionId) return
        setLoading(true)
        sessionsApi
            .getSession(sessionId)
            .then(setSession)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [sessionId])

    return { session, loading, error }
}