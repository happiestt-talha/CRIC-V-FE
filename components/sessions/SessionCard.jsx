import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, getStatusBadgeVariant } from '@/lib/utils/formatters'
import { Video, ArrowRight, Clock } from 'lucide-react'

export default function SessionCard({ session }) {
    return (
        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 shrink-0">
                        <Video className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">
                            {session.title || `Session #${session.id}`}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <p className="text-slate-500 text-xs">
                                {formatDate(session.created_at)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <Badge
                        variant="outline"
                        className="text-xs border-slate-700 text-slate-400 capitalize"
                    >
                        {session.session_type}
                    </Badge>
                    <Badge
                        variant={getStatusBadgeVariant(session.status)}
                        className="text-xs capitalize"
                    >
                        {session.status}
                    </Badge>
                </div>

                {session.description && (
                    <p className="text-slate-500 text-xs mb-4 line-clamp-2">
                        {session.description}
                    </p>
                )}

                <Link href={`/sessions/${session.id}`}>
                    <Button
                        size="sm"
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    >
                        View Details
                        <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}