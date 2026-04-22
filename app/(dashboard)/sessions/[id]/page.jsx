'use client'

import { use, useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import PageHeader from '@/components/layout/PageHeader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import BowlingMetrics from '@/components/analysis/BowlingMetrics'
import BattingMetrics from '@/components/analysis/BattingMetrics'
import PitchHeatmap from '@/components/analysis/PitchHeatmap'
import FeedbackForm from '@/components/analysis/FeedbackForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/hooks/useSessions'
import { useSessionAnalysis } from '@/lib/hooks/useAnalysis'
import { analysisApi } from '@/lib/api/analysis'
import { sessionsApi } from '@/lib/api/sessions'
import { formatDate, getStatusBadgeVariant } from '@/lib/utils/formatters'
import { API_BASE_URL } from '@/lib/utils/constants'
import { RefreshCw, Video, Play } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function SessionDetailPage({ params }) {
    const { id } = use(params)
    const sessionId = parseInt(id)
    const { toast } = useToast()

    const { session, loading: sessionLoading } = useSession(sessionId)
    const { analysis, loading: analysisLoading, error: analysisError } = useSessionAnalysis(sessionId)
    const [feedback, setFeedback] = useState([])
    const [feedbackLoading, setFeedbackLoading] = useState(true)
    const [videoUrl, setVideoUrl] = useState(null)
    const [reanalyzing, setReanalyzing] = useState(false)

    useEffect(() => {
        analysisApi
            .getSessionFeedback(sessionId)
            .then(setFeedback)
            .catch(console.error)
            .finally(() => setFeedbackLoading(false))
    }, [sessionId])

    useEffect(() => {
        if (session?.video_path) {
            setVideoUrl(`${API_BASE_URL}/sessions/${sessionId}/annotated-video`)
        }
    }, [session, sessionId])

    const handleReanalyze = async () => {
        setReanalyzing(true)
        try {
            await analysisApi.triggerAnalysis(sessionId, session?.session_type || 'bowling')
            toast({ title: 'Re-analysis started!', description: 'Refresh in a moment to see updated results.' })
        } catch (err) {
            toast({ title: 'Failed to start analysis', variant: 'destructive' })
        } finally {
            setReanalyzing(false)
        }
    }

    const refreshFeedback = () => {
        analysisApi
            .getSessionFeedback(sessionId)
            .then(setFeedback)
            .catch(console.error)
    }

    if (sessionLoading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar title="Session" />
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner text="Loading session..." />
                </div>
            </div>
        )
    }

    if (!session) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar title="Session" />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-slate-400">Session not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar title="Session Detail" />
            <div className="flex-1 p-6">
                <PageHeader
                    title={session.title || `Session #${session.id}`}
                    description={`Created ${formatDate(session.created_at)}`}
                    backHref="/sessions"
                    backLabel="Sessions"
                    action={
                        <div className="flex gap-2">
                            <Badge
                                variant="outline"
                                className="border-slate-700 text-slate-400 capitalize"
                            >
                                {session.session_type}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(session.status)} className="capitalize">
                                {session.status}
                            </Badge>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left column — video */}
                    <div className="xl:col-span-1 space-y-4">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-white text-sm flex items-center gap-2">
                                    <Video className="h-4 w-4" />
                                    Session Video
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {session.video_path ? (
                                    <div className="space-y-3">
                                        <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
                                            <video
                                                src={videoUrl}
                                                controls
                                                className="w-full h-full object-contain"
                                                poster={
                                                    session.thumbnail_path
                                                        ? `${API_BASE_URL}/${session.thumbnail_path}`
                                                        : undefined
                                                }
                                            >
                                                Your browser does not support video playback.
                                            </video>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                                            onClick={handleReanalyze}
                                            disabled={reanalyzing}
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${reanalyzing ? 'animate-spin' : ''}`} />
                                            Re-analyze
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-slate-800 rounded-lg flex flex-col items-center justify-center">
                                        <Play className="h-10 w-10 text-slate-600 mb-2" />
                                        <p className="text-slate-500 text-sm">No video uploaded</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Session meta */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="p-4 space-y-2">
                                {session.description && (
                                    <p className="text-slate-400 text-sm">{session.description}</p>
                                )}
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Session ID</span>
                                    <span className="text-slate-300">#{session.id}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Player ID</span>
                                    <span className="text-slate-300">#{session.player_id}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Type</span>
                                    <span className="text-slate-300 capitalize">{session.session_type}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column — analysis tabs */}
                    <div className="xl:col-span-2">
                        <Tabs defaultValue={session.session_type === 'batting' ? 'batting' : 'bowling'}>
                            <TabsList className="bg-slate-900 border border-slate-800 mb-4">
                                {(session.session_type === 'bowling' || session.session_type === 'both') && (
                                    <TabsTrigger
                                        value="bowling"
                                        className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-400"
                                    >
                                        Bowling
                                    </TabsTrigger>
                                )}
                                {(session.session_type === 'batting' || session.session_type === 'both') && (
                                    <TabsTrigger
                                        value="batting"
                                        className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-400"
                                    >
                                        Batting
                                    </TabsTrigger>
                                )}
                                <TabsTrigger
                                    value="heatmap"
                                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-400"
                                >
                                    Heatmap
                                </TabsTrigger>
                                <TabsTrigger
                                    value="feedback"
                                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-400"
                                >
                                    Feedback {feedback.length > 0 && `(${feedback.length})`}
                                </TabsTrigger>
                            </TabsList>

                            {/* Bowling tab */}
                            <TabsContent value="bowling">
                                {analysisLoading ? (
                                    <div className="flex justify-center py-10">
                                        <LoadingSpinner text="Loading analysis..." />
                                    </div>
                                ) : analysisError || !analysis ? (
                                    <div className="text-center py-10">
                                        <p className="text-slate-400 text-sm mb-4">
                                            {analysisError || 'No analysis found for this session'}
                                        </p>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={handleReanalyze}
                                            disabled={reanalyzing}
                                        >
                                            Run Analysis
                                        </Button>
                                    </div>
                                ) : (
                                    <BowlingMetrics metrics={analysis.bowling_metrics} />
                                )}
                            </TabsContent>

                            {/* Batting tab */}
                            <TabsContent value="batting">
                                {analysisLoading ? (
                                    <div className="flex justify-center py-10">
                                        <LoadingSpinner text="Loading analysis..." />
                                    </div>
                                ) : !analysis ? (
                                    <div className="text-center py-10">
                                        <p className="text-slate-400 text-sm mb-4">No batting analysis found</p>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={handleReanalyze}
                                            disabled={reanalyzing}
                                        >
                                            Run Analysis
                                        </Button>
                                    </div>
                                ) : (
                                    <BattingMetrics metrics={analysis.batting_metrics} />
                                )}
                            </TabsContent>

                            {/* Heatmap tab */}
                            <TabsContent value="heatmap">
                                {analysisLoading ? (
                                    <div className="flex justify-center py-10">
                                        <LoadingSpinner />
                                    </div>
                                ) : (
                                    <PitchHeatmap
                                        heatmapData={analysis?.bowling_metrics?.release_point || null}
                                        mostCommonLine={null}
                                        mostCommonLength={null}
                                    />
                                )}
                            </TabsContent>

                            {/* Feedback tab */}
                            <TabsContent value="feedback">
                                {feedbackLoading ? (
                                    <div className="flex justify-center py-10">
                                        <LoadingSpinner />
                                    </div>
                                ) : (
                                    <FeedbackForm
                                        sessionId={sessionId}
                                        existingFeedback={feedback}
                                        onSuccess={refreshFeedback}
                                    />
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}