'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usersApi } from '@/lib/api/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { BATTING_HANDS, BOWLING_STYLES } from '@/lib/utils/constants'

export default function PlayerForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        full_name: '',
        age: '',
        batting_hand: 'right',
        bowling_style: 'right_arm_fast',
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const payload = {
                ...form,
                age: form.age ? parseInt(form.age) : null,
            }
            await usersApi.createPlayer(payload)
            toast.success('Player created successfully!')
            router.push('/players')
        } catch (err) {
            toast.error('Failed to create player', {
                description: err.response?.data?.detail || 'Something went wrong'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="bg-slate-900 border-slate-800 max-w-lg">
            <CardHeader>
                <CardTitle className="text-white">Player Details</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-slate-300">Full Name *</Label>
                        <Input
                            value={form.full_name}
                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            placeholder="Ahmed Khan"
                            required
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Age</Label>
                        <Input
                            type="number"
                            value={form.age}
                            onChange={(e) => setForm({ ...form, age: e.target.value })}
                            placeholder="22"
                            min={5}
                            max={60}
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Batting Hand</Label>
                        <Select
                            value={form.batting_hand}
                            onValueChange={(v) => setForm({ ...form, batting_hand: v })}
                        >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                {BATTING_HANDS.map((h) => (
                                    <SelectItem
                                        key={h.value}
                                        value={h.value}
                                        className="text-white hover:bg-slate-700"
                                    >
                                        {h.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Bowling Style</Label>
                        <Select
                            value={form.bowling_style}
                            onValueChange={(v) => setForm({ ...form, bowling_style: v })}
                        >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                {BOWLING_STYLES.map((s) => (
                                    <SelectItem
                                        key={s.value}
                                        value={s.value}
                                        className="text-white hover:bg-slate-700"
                                    >
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Player'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}