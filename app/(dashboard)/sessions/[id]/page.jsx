'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import BowlingAnalysis from '@/components/analysis/BowlingAnalysis'
import BattingAnalysis from '@/components/analysis/BattingAnalysis'
import PitchHeatmap from '@/components/analysis/PitchHeatmap'
import FeedbackForm from '@/components/analysis/FeedbackForm'
import VideoPlayer from '@/components/sessions/VideoPlayer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/hooks/useSessions'
import { analysisApi } from '@/lib/api/analysis'
import { sessionsApi, getAnnotatedVideoUrl } from '@/lib/api/sessions'
import { formatDate, getStatusBadgeVariant } from '@/lib/utils/formatters'
import { API_BASE_URL } from '@/lib/utils/constants'
import { 
  RefreshCw, Video, Play, ChevronLeft, Calendar, 
  User, Activity, Shield, FileText, PlusCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import DeleteSessionDialog from '@/components/sessions/DeleteSessionDialog'
import { useAuth } from '@/lib/hooks/useAuth'

export default function SessionDetailPage({ params }) {
    const { id } = use(params)
    const sessionId = parseInt(id)
    const router = useRouter()
    const { user } = useAuth()

    const { session, loading: sessionLoading, refresh: refreshSession } = useSession(sessionId)
    const [analysis, setAnalysis] = useState(null)
    const [deliveries, setDeliveries] = useState([])
    const [insights, setInsights] = useState(null)
    const [feedback, setFeedback] = useState([])
    const [loading, setLoading] = useState(true)
    const [reanalyzing, setReanalyzing] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [seekToSeconds, setSeekToSeconds] = useState(0)
    const [selectedDeliveryId, setSelectedDeliveryId] = useState(null)
    const [activeVideoTab, setActiveVideoTab] = useState('original')

    const isCoachOrAdmin = user?.role === 'coach' || user?.role === 'admin'

    const playerId = session?.player_id;

    const fetchAnalysisData = useCallback(async () => {
        try {
            const [analysisData, deliveriesData] = await Promise.all([
                analysisApi.getSessionAnalysis(sessionId).catch(() => null),
                analysisApi.getSessionDeliveries(sessionId).catch(() => [])
            ])
            setAnalysis(analysisData)
            setDeliveries(deliveriesData)
            
            if (playerId) {
                const insightsData = await analysisApi.getBowlingInsights(playerId).catch(() => null)
                setInsights(insightsData)
            }
        } catch (error) {
            console.error("Error fetching analysis:", error)
        }
    }, [sessionId, playerId])

    useEffect(() => {
        if (sessionId) {
            setLoading(true)
            Promise.all([
                fetchAnalysisData(),
                analysisApi.getSessionFeedback(sessionId).catch(() => [])
            ]).then(([_, feedbackData]) => {
                setFeedback(feedbackData)
                setLoading(false)
            })
        }
    }, [sessionId, fetchAnalysisData])

    // Polling for analysis
    useEffect(() => {
        let interval;
        if (sessionId && (session?.status === 'processing' || session?.status === 'analyzing' || session?.status === 'uploaded')) {
            interval = setInterval(async () => {
                try {
                    const updatedSession = await sessionsApi.getSession(sessionId)
                    if (updatedSession.status === 'completed' || updatedSession.status === 'failed' || (updatedSession.status === 'uploaded' && updatedSession.annotated_video_path)) {
                        refreshSession()
                        fetchAnalysisData()
                        clearInterval(interval)
                    }
                } catch (e) {
                    console.error("Polling error in useEffect:", e)
                }
            }, 3000)
        }
        return () => clearInterval(interval)
    }, [session?.status, sessionId, refreshSession, fetchAnalysisData])

    const handleReanalyze = async () => {
        setReanalyzing(true)
        try {
            await analysisApi.triggerSessionAllAnalysis(sessionId)
            toast.success('Analysis started!', { 
                description: 'Processing your video. This may take a minute...' 
            })
            
            // Poll every 3 seconds until completed or failed
            const pollInterval = setInterval(async () => {
                if (!sessionId) return
                try {
                    const updated = await sessionsApi.getSession(sessionId)
                    if (refreshSession) refreshSession()
                    if (updated.status === 'completed' || updated.status === 'failed') {
                        clearInterval(pollInterval)
                        setReanalyzing(false)
                        await fetchAnalysisData()
                        if (updated.status === 'completed') {
                            toast.success('Analysis complete!', {
                                description: 'Annotated video and metrics are ready.'
                            })
                        } else {
                            toast.error('Analysis failed. Please try again.')
                        }
                    }
                } catch (e) {
                    console.error('Polling error in handleReanalyze:', e)
                }
            }, 3000)
            
            // Safety timeout after 5 minutes
            setTimeout(() => {
                clearInterval(pollInterval)
                setReanalyzing(false)
            }, 300000)
            
        } catch (err) {
            toast.error('Failed to start analysis')
            setReanalyzing(false)
        }
    }

    const handleDeliveryView = (delivery) => {
        setSelectedDeliveryId(delivery.id)
        setActiveVideoTab('annotated')
        // Use a small delay to ensure tab switch and video player readiness
        setTimeout(() => {
            setSeekToSeconds(delivery.release_timestamp_seconds)
        }, 100)
    }

    if (sessionLoading || (loading && !session)) {
        return (
            <div className="flex flex-col min-h-screen bg-[#0f172a]">
                <Navbar title="Session" />
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner text="Loading session details..." />
                </div>
            </div>
        )
    }

    const firstVideo = session?.videos?.[0]
    const originalUrl = firstVideo 
      ? `${API_BASE_URL}/sessions/${sessionId}/videos/${firstVideo.id}/stream`
      : null
    const annotatedUrl = getAnnotatedVideoUrl(sessionId)

    return (
        <div className="flex flex-col min-h-screen bg-[#0f172a] text-slate-200">
            <Navbar title="Session Analysis" />
            
            <div className="flex-1 w-full p-4 md:p-6 space-y-6 overflow-x-hidden">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 flex-wrap">
                    <div className="space-y-1">
                        <Link href="/sessions" className="text-xs font-bold text-slate-500 hover:text-green-500 flex items-center gap-1 transition-colors group">
                            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                            BACK TO SESSIONS
                        </Link>
                        <h1 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase">
                            {session.title || `Session #${session.id}`}
                        </h1>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                           <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-green-500/50" /> {formatDate(session.created_at)}</span>
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                           <span className="flex items-center gap-1 uppercase tracking-widest text-[10px] bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50 text-slate-400">
                             <Shield className="w-3 h-3" /> {session.session_type}
                           </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Badge variant={getStatusBadgeVariant(session.status)} className="px-4 py-1.5 font-black uppercase tracking-widest text-xs border-2 shadow-lg">
                            {session.status}
                        </Badge>
                        {isCoachOrAdmin && (
                            <Button
                                variant="outline"
                                className="border-red-500/30 text-red-500 hover:bg-red-500/10 font-black px-6 shadow-xl"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                DELETE SESSION
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="bg-green-600/10 border-green-500/30 text-green-500 hover:bg-green-600 hover:text-white font-black px-6 shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all duration-300"
                            onClick={handleReanalyze}
                            disabled={reanalyzing || !analysis}
                        >
                            <RefreshCw className={cn("w-4 h-4 mr-2", reanalyzing && "animate-spin")} />
                            {reanalyzing ? 'ANALYZING...' : 'RE-RUN AI'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left Column (40%) */}
                    <div className="lg:col-span-2 space-y-4">
                        <Tabs value={activeVideoTab} onValueChange={setActiveVideoTab} className="w-full">
                            <div className="flex items-center justify-between mb-4">
                               <TabsList className="bg-slate-900/50 border border-slate-800 p-1 ring-1 ring-slate-800">
                                  <TabsTrigger value="original" className="data-[state=active]:bg-slate-800 text-[10px] font-black uppercase tracking-wider px-4">ORIGINAL</TabsTrigger>
                                  <TabsTrigger value="annotated" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-[10px] font-black uppercase tracking-wider px-4">ANNOTATED</TabsTrigger>
                               </TabsList>
                               <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VIDEO ANALYSIS FEED</span>
                               </div>
                            </div>

                            <TabsContent value="original" className="mt-0 focus-visible:ring-0">
                                <VideoPlayer 
                                  src={originalUrl} 
                                  label="Original Recording" 
                                />
                            </TabsContent>
                            
                            <TabsContent value="annotated" className="mt-0 focus-visible:ring-0">
                                {(session.annotated_video_path || analysis) ? (
                                    <VideoPlayer 
                                      src={annotatedUrl} 
                                      seekToSeconds={seekToSeconds}
                                      label="AI Annotated Result" 
                                    />
                                ) : (
                                    <Card className="aspect-video bg-slate-950/50 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-inner ring-1 ring-slate-900">
                                        <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-700 ring-1 ring-slate-800">
                                           <Video className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                           <p className="font-black text-slate-400 text-sm tracking-tight">ANNOTATION NOT READY</p>
                                           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest max-w-[200px]">Run analysis to generate AI overlays and metrics.</p>
                                        </div>
                                        <Button 
                                            className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] px-8 tracking-widest h-9"
                                            onClick={handleReanalyze}
                                            disabled={reanalyzing}
                                        >
                                            {reanalyzing ? 'PROCESSING...' : 'ANALYZE NOW'}
                                        </Button>
                                    </Card>
                                )}
                            </TabsContent>
                        </Tabs>

                        {/* Session Metadata Card */}
                        <Card className="bg-slate-900/50 border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
                           <CardHeader className="border-b border-slate-800 bg-slate-900/80 px-4 py-3">
                              <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                 <FileText className="w-4 h-4 text-green-500/50" /> SESSION METADATA
                              </CardTitle>
                           </CardHeader>
                           <CardContent className="p-0">
                              <div className="divide-y divide-slate-800/50">
                                 {[
                                   { icon: <Activity className="w-4 h-4 text-blue-500/50" />, label: 'ID', value: `#${session.id}` },
                                   { icon: <User className="w-4 h-4 text-purple-500/50" />, label: 'PLAYER', value: session.player?.full_name || `#${session.player_id}` },
                                   { icon: <Shield className="w-4 h-4 text-green-500/50" />, label: 'DISCIPLINE', value: session.session_type, capitalize: true },
                                   { icon: <Calendar className="w-4 h-4 text-amber-500/50" />, label: 'RECORDED', value: formatDate(session.created_at) }
                                 ].map((item, i) => (
                                   <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-800/30 transition-colors">
                                      <div className="flex items-center gap-3 text-slate-500">
                                         {item.icon}
                                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{item.label}</span>
                                      </div>
                                      <span className={cn("text-sm font-black text-slate-300", item.capitalize && "capitalize tracking-tight")}>{item.value}</span>
                                   </div>
                                 ))}
                              </div>
                              {session.description && (
                                <div className="p-4 bg-slate-950/40 border-t border-slate-800/50">
                                   <p className="text-[9px] font-black text-slate-600 uppercase mb-2 tracking-widest">Coaching Notes</p>
                                   <p className="text-sm text-slate-400 italic font-medium leading-relaxed">"{session.description}"</p>
                                </div>
                              )}
                           </CardContent>
                        </Card>

                        {/* Videos List */}
                        <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-slate-800/50">
                                <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Video className="h-4 w-4 text-green-500/50" /> MEDIA ASSETS
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-[10px] font-black text-green-500 hover:text-green-400 hover:bg-green-500/10 px-3 tracking-widest"
                                    onClick={() => router.push(`/sessions/${sessionId}/upload`)}
                                >
                                    <PlusCircle className="w-3 h-3 mr-1" /> ADD MEDIA
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                {session.videos && session.videos.length > 0 ? (
                                    <div className="space-y-2">
                                        {session.videos.map((vid) => (
                                            <div key={vid.id} className="group p-3 bg-slate-950/50 rounded-lg border border-slate-800/50 flex items-center justify-between hover:border-slate-600 hover:bg-slate-900 transition-all duration-300">
                                                <div className="min-w-0 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-green-500 transition-colors">
                                                       <Play className="w-4 h-4 fill-current" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-white font-black truncate max-w-[150px] tracking-tight">{vid.original_filename}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                           <Badge className={cn(
                                                               "text-[8px] h-4 px-1.5 font-black uppercase tracking-tighter border-none",
                                                               vid.status === 'done' ? "bg-green-500/10 text-green-500" : "bg-slate-800 text-slate-500"
                                                           )}>
                                                               {vid.status}
                                                           </Badge>
                                                           <span className="text-[8px] font-bold text-slate-700">{vid.file_size_mb}MB</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center border-2 border-dashed border-slate-800/50 rounded-xl bg-slate-950/30">
                                        <div className="w-12 h-12 rounded-full bg-slate-900 mx-auto mb-4 flex items-center justify-center text-slate-700 ring-1 ring-slate-800">
                                           <Video className="w-6 h-6 opacity-20" />
                                        </div>
                                        <p className="text-slate-600 text-[10px] font-black mb-4 tracking-widest uppercase">NO MEDIA DETECTED</p>
                                        <Button
                                            size="sm"
                                            className="bg-slate-800 text-white hover:bg-slate-700 font-black text-[10px] tracking-widest h-8 px-6"
                                            onClick={() => router.push(`/sessions/${sessionId}/upload`)}
                                        >
                                            UPLOAD NOW
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (60%) */}
                    <div className="lg:col-span-3">
                        {!analysis ? (
                            <Card className="h-full min-h-[600px] bg-slate-900 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-12 text-center group shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.03),transparent)]" />
                                <div className="w-28 h-28 rounded-full bg-slate-800/30 flex items-center justify-center text-slate-700 mb-8 group-hover:scale-110 transition-all duration-700 ring-1 ring-slate-800/50 relative z-10">
                                   <Activity className="w-14 h-14 opacity-20" />
                                   <RefreshCw className="w-6 h-6 absolute animate-spin-slow text-green-500/20" />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tighter mb-4 relative z-10">NO ANALYSIS DATA</h2>
                                <p className="text-slate-500 max-w-sm mb-10 text-sm font-medium leading-relaxed relative z-10 uppercase tracking-tight">
                                    Our AI engine hasn't processed this session yet. Kick off the analysis to get detailed insights into performance metrics.
                                </p>
                                <Button 
                                    size="lg"
                                    className="bg-green-600 hover:bg-green-700 text-white font-black px-16 shadow-[0_10px_30px_rgba(34,197,94,0.2)] transition-all hover:scale-105 active:scale-95 relative z-10 h-14 text-sm tracking-widest"
                                    onClick={handleReanalyze}
                                    disabled={reanalyzing}
                                >
                                    {reanalyzing ? (
                                        <>
                                           <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                                           ANALYZING SESSION...
                                        </>
                                    ) : 'START AI ANALYSIS'}
                                </Button>
                            </Card>
                        ) : (
                            <Tabs defaultValue={session.session_type === 'batting' ? 'batting' : 'bowling'} className="w-full">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                    <div className="overflow-x-auto">
                                        <TabsList className="bg-slate-900/50 border border-slate-800/50 p-1 ring-1 ring-slate-900 w-max">
                                        {(session.session_type === 'bowling' || session.session_type === 'both') && (
                                            <TabsTrigger
                                                value="bowling"
                                                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-[10px] font-black px-3 tracking-widest"
                                            >
                                                BOWLING
                                            </TabsTrigger>
                                        )}
                                        {(session.session_type === 'batting' || session.session_type === 'both') && (
                                            <TabsTrigger
                                                value="batting"
                                                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-[10px] font-black px-3 tracking-widest"
                                            >
                                                BATTING
                                            </TabsTrigger>
                                        )}
                                        <TabsTrigger
                                            value="heatmap"
                                            className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-[10px] font-black px-3 tracking-widest"
                                        >
                                            HEATMAP
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="feedback"
                                            className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-[10px] font-black px-3 tracking-widest"
                                        >
                                            FEEDBACK {feedback.length > 0 && (
                                                <span className="ml-2 px-1.5 py-0.5 rounded bg-black/30 text-[9px]">{feedback.length}</span>
                                            )}
                                        </TabsTrigger>
                                    </TabsList>
                                    </div>
                                </div>

                                <div className="mt-4 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <TabsContent value="bowling" className="mt-0 focus-visible:ring-0">
                                        <BowlingAnalysis 
                                            analysis={analysis} 
                                            deliveries={deliveries}
                                            onDeliveryClick={handleDeliveryView}
                                            selectedDeliveryId={selectedDeliveryId}
                                            sessionId={sessionId}
                                        />
                                    </TabsContent>

                                    <TabsContent value="batting" className="mt-0 focus-visible:ring-0">
                                        <BattingAnalysis analysis={analysis} />
                                    </TabsContent>

                                    <TabsContent value="heatmap" className="mt-0 focus-visible:ring-0">
                                        <PitchHeatmap insights={insights} />
                                    </TabsContent>

                                    <TabsContent value="feedback" className="mt-0 focus-visible:ring-0">
                                        <FeedbackForm
                                            sessionId={sessionId}
                                            existingFeedback={feedback}
                                            onSuccess={() => analysisApi.getSessionFeedback(sessionId).then(setFeedback)}
                                        />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        )}
                    </div>
                </div>
            </div>

            <DeleteSessionDialog 
                sessionId={sessionId}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onSuccess={() => router.push('/sessions')}
            />
        </div>
    )
}