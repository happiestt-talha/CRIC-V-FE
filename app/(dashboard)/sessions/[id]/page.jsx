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
import { toast } from 'sonner'
import Cookies from 'js-cookie'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function SessionDetailPage({ params }) {
    const { id } = use(params)
    const sessionId = parseInt(id)
    const router = useRouter()

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
            const token = Cookies.get('access_token')
            setVideoUrl(`${API_BASE_URL}/sessions/${sessionId}/annotated-video?token=${token}`)
        }
    }, [session, sessionId])

    const handleReanalyze = async () => {
        setReanalyzing(true)
        try {
            await analysisApi.triggerAnalysis(sessionId, session?.session_type || 'bowling')
            toast.success('Re-analysis started!', { description: 'Refresh in a moment to see updated results.' })
        } catch (err) {
            toast.error('Failed to start analysis')
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
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-white text-sm flex items-center gap-2">
                                    <Video className="h-4 w-4" />
                                    Videos ({session.videos?.length || 0})
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] text-green-500 hover:text-green-400 p-0"
                                    onClick={() => router.push(`/sessions/${sessionId}/upload`)}
                                >
                                    + Add More
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {session.videos && session.videos.length > 0 ? (
                                    <div className="space-y-2">
                                        {session.videos.map((vid) => (
                                            <div key={vid.id} className="p-3 bg-slate-800/50 rounded border border-slate-700 flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-xs text-white font-medium truncate">{vid.original_filename}</p>
                                                    <Badge className={cn(
                                                        "text-[8px] h-3 px-1 mt-1",
                                                        vid.status === 'done' ? "bg-green-500/10 text-green-500" : "bg-slate-700 text-slate-400"
                                                    )}>
                                                        {vid.status}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-slate-400"
                                                    onClick={() => router.push(`/sessions/${sessionId}/analyze?video=${vid.id}`)}
                                                >
                                                    <Play className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs mt-2"
                                            onClick={() => router.push(`/sessions/${sessionId}/analyze`)}
                                        >
                                            Analyze All Videos
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-lg">
                                        <p className="text-slate-500 text-xs mb-3">No videos uploaded yet</p>
                                        <Button
                                            size="sm"
                                            className="bg-slate-800 text-white hover:bg-slate-700"
                                            onClick={() => router.push(`/sessions/${sessionId}/upload`)}
                                        >
                                            Upload Now
                                        </Button>
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