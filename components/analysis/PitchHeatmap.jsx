import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PITCH_LINES, PITCH_LENGTHS } from '@/lib/utils/constants'

export default function PitchHeatmap({ heatmapData, mostCommonLine, mostCommonLength }) {
    if (!heatmapData) {
        return (
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="py-10 text-center">
                    <p className="text-slate-400 text-sm">No pitch data available</p>
                </CardContent>
            </Card>
        )
    }

    const getMax = () => {
        let max = 1
        PITCH_LINES.forEach((line) => {
            PITCH_LENGTHS.forEach((length) => {
                const val = heatmapData[line]?.[length] || 0
                if (val > max) max = val
            })
        })
        return max
    }

    const max = getMax()

    const getColor = (value) => {
        if (!value || value === 0) return 'bg-slate-800'
        const intensity = value / max
        if (intensity > 0.8) return 'bg-red-500'
        if (intensity > 0.6) return 'bg-orange-500'
        if (intensity > 0.4) return 'bg-amber-500'
        if (intensity > 0.2) return 'bg-green-500'
        return 'bg-green-800'
    }

    const lineLabels = {
        outside_off: 'Out Off',
        off_stump: 'Off',
        middle_stump: 'Middle',
        leg_stump: 'Leg',
        outside_leg: 'Out Leg',
    }

    const lengthLabels = {
        yorker: 'Yorker',
        full: 'Full',
        good_length: 'Good',
        short_of_length: 'Short+',
        short: 'Short',
    }

    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">Pitch Heatmap</CardTitle>
                    <div className="flex gap-2">
                        {mostCommonLine && (
                            <Badge variant="outline" className="text-xs border-green-700 text-green-400">
                                Line: {lineLabels[mostCommonLine] || mostCommonLine}
                            </Badge>
                        )}
                        {mostCommonLength && (
                            <Badge variant="outline" className="text-xs border-blue-700 text-blue-400">
                                Length: {lengthLabels[mostCommonLength] || mostCommonLength}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Wickets representation */}
                <div className="flex justify-center gap-1 mb-2">
                    {['|', '|', '|'].map((w, i) => (
                        <span key={i} className="text-amber-400 font-bold text-lg">{w}</span>
                    ))}
                </div>

                {/* Grid */}
                <div className="overflow-x-auto">
                    <div className="min-w-[300px]">
                        {/* Column headers (lines) */}
                        <div className="grid mb-1" style={{ gridTemplateColumns: `80px repeat(${PITCH_LINES.length}, 1fr)` }}>
                            <div />
                            {PITCH_LINES.map((line) => (
                                <div key={line} className="text-center">
                                    <span className="text-slate-500 text-xs">
                                        {lineLabels[line]}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Rows (lengths) */}
                        {PITCH_LENGTHS.map((length) => (
                            <div
                                key={length}
                                className="grid mb-1 items-center"
                                style={{ gridTemplateColumns: `80px repeat(${PITCH_LINES.length}, 1fr)` }}
                            >
                                <span className="text-slate-500 text-xs pr-2 text-right">
                                    {lengthLabels[length]}
                                </span>
                                {PITCH_LINES.map((line) => {
                                    const value = heatmapData[line]?.[length] || 0
                                    return (
                                        <div
                                            key={line}
                                            className={`h-8 mx-0.5 rounded flex items-center justify-center transition-colors ${getColor(value)}`}
                                            title={`${lineLabels[line]} / ${lengthLabels[length]}: ${value}`}
                                        >
                                            {value > 0 && (
                                                <span className="text-white text-xs font-bold">
                                                    {value}
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 mt-4 justify-end">
                    <span className="text-slate-500 text-xs">Low</span>
                    {['bg-green-800', 'bg-green-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'].map((c) => (
                        <div key={c} className={`w-4 h-4 rounded ${c}`} />
                    ))}
                    <span className="text-slate-500 text-xs">High</span>
                </div>
            </CardContent>
        </Card>
    )
}