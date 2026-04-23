'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import PageHeader from '@/components/layout/PageHeader'
import VideoUpload from '@/components/sessions/VideoUpload'
import AnalysisStatus from '@/components/sessions/AnalysisStatus'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { sessionsApi } from '@/lib/api/sessions'
import { analysisApi } from '@/lib/api/analysis'
import { usePlayers } from '@/lib/hooks/usePlayers'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'

const STEPS = ['Session Info', 'Upload Video', 'Analyze']

export default function NewSessionPage() {
    const router = useRouter()

    const { players } = usePlayers()

    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [session, setSession] = useState(null)
    const [taskId, setTaskId] = useState(null)

    const [form, setForm] = useState({
        session_type: 'bowling',
        player_id: '',
        description: '',
    })

    // Step 1: Create session
    const handleCreateSession = async (e) => {
        e.preventDefault()
        if (!form.player_id) {
            toast.error('Please select a player')
            return
        }
        setLoading(true)
        try {
            const created = await sessionsApi.createSession({
                ...form,
                player_id: parseInt(form.player_id),
            })
            setSession(created)
            setStep(1)
            toast.success('Session created!', { description: 'Now upload your video.' })
        } catch (err) {
            toast.error('Failed to create session', {
                description: err.response?.data?.detail || 'Something went wrong',
            })
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Upload video
    const handleUpload = async (file, onProgress) => {
        setLoading(true)
        try {
            await sessionsApi.uploadVideo(session.id, file, onProgress)
            toast.success('Video uploaded!', { description: 'Ready to analyze.' })
            setStep(2)
        } catch (err) {
            toast.error('Upload failed', {
                description: err.response?.data?.detail || 'Something went wrong',
            })
            throw err
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Trigger analysis
    const handleAnalyze = async () => {
        setLoading(true)
        try {
            const result = await analysisApi.triggerAnalysis(
                session.id,
                form.session_type
            )
            const id = result?.task_id || result
            setTaskId(typeof id === 'string' ? id : null)
            toast.success('Analysis started!', { description: 'This may take a few minutes.' })
        } catch (err) {
            toast.error('Analysis failed to start', {
                description: err.response?.data?.detail || 'Something went wrong',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar title="New Session" />
            <div className="flex-1 p-6">
                <PageHeader
                    title="New Training Session"
                    description="Upload a cricket training video for AI analysis"
                    backHref="/sessions"
                    backLabel="Sessions"
                />

                {/* Stepper */}
                <div className="flex items-center gap-2 mb-8">
                    {STEPS.map((label, i) => (
                        <div key={label} className="flex items-center gap-2">
                            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${i < step
                                    ? 'bg-green-600 text-white'
                                    : i === step
                                        ? 'bg-green-600/30 text-green-400 border border-green-600'
                                        : 'bg-slate-800 text-slate-500'
                                }`}>
                                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                            </div>
                            <span className={`text-sm font-medium ${i === step ? 'text-white' : i < step ? 'text-green-400' : 'text-slate-500'
                                }`}>{label}</span>
                            {i < STEPS.length - 1 && (
                                <div className={`h-px w-8 mx-1 ${i < step ? 'bg-green-600' : 'bg-slate-700'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="max-w-xl">
                    {/* STEP 0 — Session info */}
                    {step === 0 && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white text-base">Session Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateSession} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Player *</Label>
                                        <Select
                                            value={form.player_id}
                                            onValueChange={(v) => setForm({ ...form, player_id: v })}
                                        >
                                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                                <SelectValue placeholder="Select a player" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                {players.map((p) => (
                                                    <SelectItem
                                                        key={p.id}
                                                        value={String(p.id)}
                                                        className="text-white hover:bg-slate-700"
                                                    >
                                                        {p.full_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Session Type *</Label>
                                        <Select
                                            value={form.session_type}
                                            onValueChange={(v) => setForm({ ...form, session_type: v })}
                                        >
                                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                <SelectItem value="bowling" className="text-white hover:bg-slate-700">Bowling</SelectItem>
                                                <SelectItem value="batting" className="text-white hover:bg-slate-700">Batting</SelectItem>
                                                <SelectItem value="both" className="text-white hover:bg-slate-700">Both</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Description</Label>
                                        <Textarea
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            placeholder="Optional session notes..."
                                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                                            rows={3}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                                        ) : 'Create Session & Continue'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 1 — Upload video */}
                    {step === 1 && session && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white text-base">
                                    Upload Video for Session #{session.id}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <VideoUpload
                                    onUpload={handleUpload}
                                    loading={loading}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 2 — Analyze */}
                    {step === 2 && session && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white text-base">
                                    Run AI Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-slate-400 text-sm">
                                    Your video is ready. Click below to start the AI analysis
                                    pipeline. This will extract pose data, classify shots, and
                                    generate insights.
                                </p>

                                {!taskId ? (
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleAnalyze}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</>
                                        ) : '🚀 Start Analysis'}
                                    </Button>
                                ) : (
                                    <AnalysisStatus
                                        taskId={taskId}
                                        onComplete={() => {
                                            setTimeout(() => router.push(`/sessions/${session.id}`), 1500)
                                        }}
                                    />
                                )}

                                <Button
                                    variant="outline"
                                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                                    onClick={() => router.push(`/sessions/${session.id}`)}
                                >
                                    Skip & View Session
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}