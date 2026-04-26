'use client'

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  User,
  Activity,
  Target,
  Calendar,
  ChevronRight,
  BarChart3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { analysisApi } from '@/lib/api/analysis';
import axiosInstance from '@/lib/api/axios';
import PitchHeatmap from '@/components/analysis/PitchHeatmap';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AnalysisHub() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [bowlingHistory, setBowlingHistory] = useState([]);
  const [battingHistory, setBattingHistory] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playersLoading, setPlayersLoading] = useState(true);

  // Fetch players on mount
  useEffect(() => {
    axiosInstance.get('/users/players')
      .then(res => {
        setPlayers(res.data);
        setPlayersLoading(false);
      })
      .catch(err => {
        console.error("Error fetching players:", err);
        setPlayersLoading(false);
      });
  }, []);

  // Fetch analysis when player changes
  useEffect(() => {
    if (selectedPlayerId) {
      setLoading(true);
      const id = parseInt(selectedPlayerId);
      Promise.all([
        analysisApi.getPlayerBowlingAnalysis(id),
        analysisApi.getPlayerBattingAnalysis(id),
        analysisApi.getBowlingInsights(id)
      ]).then(([bowling, batting, insightsData]) => {
        // Sort chronologically for charts (oldest to newest)
        const sortedBowling = [...bowling].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const sortedBatting = [...batting].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        setBowlingHistory(sortedBowling);
        setBattingHistory(sortedBatting);
        setInsights(insightsData);
        setLoading(false);
      }).catch(err => {
        console.error("Error fetching analysis history:", err);
        setLoading(false);
      });
    }
  }, [selectedPlayerId]);

  const selectedPlayer = useMemo(() =>
    players.find(p => p.id === parseInt(selectedPlayerId)),
    [players, selectedPlayerId]
  );

  if (playersLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col">
        <Navbar title="Analysis Hub" />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner text="Initializing Analytics Engine..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col">
      <Navbar title="Performance Hub" />

      <div className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-8 space-y-8">
        {/* Header & Selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/40 p-8 rounded-3xl border border-slate-800/50 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Performance Hub</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <p className="text-slate-500 font-black text-[10px] tracking-[0.2em] uppercase">
                AI-DRIVEN PLAYER ANALYTICS
              </p>
            </div>
          </div>

          <div className="w-full md:w-80 space-y-2 flex flex-col">
            <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] ml-1">
              Select Squad Member
            </label>
            <Select className='w-full' onValueChange={setSelectedPlayerId} value={selectedPlayerId}>
              <SelectTrigger
                style={{ '--placeholder-color': 'rgb(148 163 184)' }}
                className="w-full md:w-80 bg-slate-800/60 border border-slate-600 h-14 font-black text-slate-100 data-[state=open]:border-green-500 data-[state=open]:ring-1 data-[state=open]:ring-green-500/40 transition-all hover:border-slate-400">
                <SelectValue className="text-slate-100" placeholder="CHOOSE A PLAYER..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border border-slate-600 shadow-xl shadow-black/50">
                {players.map(p => (
                  <SelectItem
                    key={p.id}
                    value={p.id.toString()}
                    className="font-bold text-slate-200 focus:bg-green-500/20 focus:text-green-300 cursor-pointer"
                  >
                    {p.full_name.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedPlayerId ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="w-32 h-32 rounded-full bg-slate-900/50 flex items-center justify-center text-slate-800 ring-2 ring-slate-800/50 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-green-500/0 to-green-500/5 group-hover:to-green-500/20 transition-all duration-700" />
              <User className="w-14 h-14 relative z-10" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-500 tracking-tighter italic uppercase">System Idle</h3>
              <p className="text-slate-600 font-bold uppercase text-[10px] tracking-[0.3em] max-w-xs mx-auto leading-relaxed">
                Select a player from the registry to initialize neural performance mapping.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center py-32">
            <LoadingSpinner text={`RECONSTRUCTING PERFORMANCE HISTORY FOR ${selectedPlayer?.full_name?.toUpperCase()}...`} />
          </div>
        ) : (
          <div className="space-y-16 animate-in fade-in duration-1000">

            {/* Section 1: Bowling History */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-800/50 pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-green-500/10 ring-1 ring-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <Activity className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Bowling Trajectory</h2>
                    <p className="text-[10px] font-black text-slate-600 tracking-[0.2em] uppercase">Pace, Extension & Legality Metrics</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
                {/* List - 3 cols */}
                <Card className="xl:col-span-3 bg-slate-900/30 border-slate-800/50 overflow-hidden shadow-2xl backdrop-blur-sm">
                  <CardHeader className="bg-slate-900/80 border-b border-slate-800/50 px-6 py-4">
                    <CardTitle className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Recent Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-800/30 max-h-[500px] overflow-y-auto no-scrollbar">
                      {bowlingHistory.length === 0 ? (
                        <div className="p-12 text-center text-slate-700 text-[10px] font-black tracking-widest uppercase">No bowling data found.</div>
                      ) : (
                        [...bowlingHistory].reverse().map((analysis) => (
                          <Link
                            key={analysis.id}
                            href={`/sessions/${analysis.session_id}`}
                            className="flex items-center justify-between p-5 hover:bg-slate-800/40 transition-all group border-l-4 border-l-transparent hover:border-l-green-500"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-slate-200 tracking-tight">{formatDate(analysis.created_at)}</span>
                                <Badge className={cn(
                                  "text-[8px] font-black uppercase tracking-widest h-4 px-1.5 border-none",
                                  analysis.bowling_metrics?.icc_compliant ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                )}>
                                  {analysis.bowling_metrics?.icc_compliant ? 'LEGAL' : 'ILLEGAL'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-0.5 rounded">
                                  {analysis.bowling_metrics?.release_speed?.toFixed(1)} <span className="text-[8px] opacity-50">KM/H</span>
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-0.5 rounded">
                                  {analysis.bowling_metrics?.elbow_extension?.toFixed(1)}<span className="text-[8px] opacity-50">° EXT</span>
                                </span>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-700 group-hover:text-green-500 group-hover:bg-green-500/10 transition-all">
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Chart - 7 cols */}
                <Card className="xl:col-span-7 bg-slate-900/20 border-slate-800/50 shadow-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />
                  <div className="h-[450px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bowlingHistory.map(a => ({
                        date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        speed: a.bowling_metrics?.release_speed,
                        elbow: a.bowling_metrics?.elbow_extension
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          stroke="#475569"
                          fontSize={10}
                          fontWeight="black"
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          yId="left"
                          stroke="#22c55e"
                          fontSize={10}
                          fontWeight="black"
                          tickLine={false}
                          axisLine={false}
                          unit=" KM/H"
                          domain={['dataMin - 10', 'dataMax + 10']}
                        />
                        <YAxis
                          yId="right"
                          orientation="right"
                          stroke="#ef4444"
                          fontSize={10}
                          fontWeight="black"
                          tickLine={false}
                          axisLine={false}
                          unit="°"
                          domain={[0, 40]}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(30, 41, 59, 0.5)', borderRadius: '12px', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                          labelStyle={{ fontWeight: 'black', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px' }}
                          itemStyle={{ fontWeight: 'black', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                        <ReferenceLine yId="right" y={15} label={{ position: 'right', value: 'ICC ILLEGAL LIMIT', fill: '#ef4444', fontSize: 9, fontWeight: 'black', letterSpacing: '0.1em' }} stroke="#ef4444" strokeDasharray="8 8" strokeWidth={2} />
                        <Line
                          yId="left"
                          type="monotone"
                          dataKey="speed"
                          name="RELEASE SPEED"
                          stroke="#22c55e"
                          strokeWidth={5}
                          dot={{ r: 6, fill: '#22c55e', strokeWidth: 3, stroke: '#0f172a' }}
                          activeDot={{ r: 8, strokeWidth: 0, fill: '#4ade80' }}
                          animationDuration={1500}
                        />
                        <Line
                          yId="right"
                          type="stepAfter"
                          dataKey="elbow"
                          name="ELBOW EXTENSION"
                          stroke="#ef4444"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#0f172a' }}
                          animationDuration={2000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>

            {/* Section 2: Batting History */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-800/50 pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Dynamic Shot Analysis</h2>
                    <p className="text-[10px] font-black text-slate-600 tracking-[0.2em] uppercase">Angle Control & Head Stability Over Time</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
                <Card className="xl:col-span-3 bg-slate-900/30 border-slate-800/50 overflow-hidden shadow-2xl backdrop-blur-sm">
                  <CardHeader className="bg-slate-900/80 border-b border-slate-800/50 px-6 py-4">
                    <CardTitle className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Session History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-800/30 max-h-[500px] overflow-y-auto no-scrollbar">
                      {battingHistory.length === 0 ? (
                        <div className="p-12 text-center text-slate-700 text-[10px] font-black tracking-widest uppercase">No batting data found.</div>
                      ) : (
                        [...battingHistory].reverse().map((analysis) => (
                          <Link
                            key={analysis.id}
                            href={`/sessions/${analysis.session_id}`}
                            className="flex items-center justify-between p-5 hover:bg-slate-800/40 transition-all group border-l-4 border-l-transparent hover:border-l-blue-500"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-slate-200 tracking-tight">{formatDate(analysis.created_at)}</span>
                                <Badge className="bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest h-4 border-none">
                                  {analysis.batting_metrics?.shot_selection?.toUpperCase() || 'GENERAL'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-0.5 rounded">
                                  {analysis.batting_metrics?.bat_angle?.toFixed(1)}° <span className="text-[8px] opacity-50">ANGLE</span>
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-0.5 rounded">
                                  {analysis.batting_metrics?.head_stillness?.toFixed(0)} <span className="text-[8px] opacity-50">STILLNESS</span>
                                </span>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-700 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all">
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="xl:col-span-7 bg-slate-900/20 border-slate-800/50 shadow-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
                  <div className="h-[450px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={battingHistory.map(a => ({
                        date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        angle: a.batting_metrics?.bat_angle,
                        stillness: a.batting_metrics?.head_stillness
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                        <XAxis dataKey="date" stroke="#475569" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} dy={10} />
                        <YAxis yId="left" stroke="#3b82f6" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} unit="°" />
                        <YAxis yId="right" orientation="right" stroke="#8b5cf6" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} unit="/100" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(30, 41, 59, 0.5)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                          labelStyle={{ fontWeight: 'black', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px' }}
                        />
                        <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                        <Line yId="left" type="monotone" dataKey="angle" name="BAT ANGLE" stroke="#3b82f6" strokeWidth={5} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#0f172a' }} animationDuration={1500} />
                        <Line yId="right" type="monotone" dataKey="stillness" name="HEAD STILLNESS" stroke="#8b5cf6" strokeWidth={5} dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 3, stroke: '#0f172a' }} animationDuration={2000} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>

            {/* Section 3: Advanced Bowling Insights */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-800/50 pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <Target className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Neural Pitch Map</h2>
                    <p className="text-[10px] font-black text-slate-600 tracking-[0.2em] uppercase">Aggregated Delivery Distribution & Frequency Analytics</p>
                  </div>
                </div>
              </div>

              <div className="max-w-4xl mx-auto w-full">
                <PitchHeatmap insights={insights} />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
