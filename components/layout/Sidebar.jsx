'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Video,
    BarChart3,
    Shield,
    ChevronRight,
} from 'lucide-react'

const navItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'Players',
        href: '/players',
        icon: Users,
    },
    {
        label: 'Sessions',
        href: '/sessions',
        icon: Video,
    },
    {
        label: 'Analysis',
        href: '/sessions',
        icon: BarChart3,
    },
]

const adminItems = [
    {
        label: 'Admin Panel',
        href: '/admin',
        icon: Shield,
    },
]

export default function Sidebar() {
    const pathname = usePathname()
    const { user, isAdmin } = useAuth()

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-40 flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-600">
                    <span className="text-lg">🏏</span>
                </div>
                <div>
                    <h1 className="text-white font-bold text-lg leading-none">CRIC-V</h1>
                    <p className="text-slate-500 text-xs mt-0.5">Coaching Assistant</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href + item.label}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                                isActive
                                    ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {isActive && (
                                <ChevronRight className="h-3 w-3 text-green-400" />
                            )}
                        </Link>
                    )
                })}

                {isAdmin && (
                    <>
                        <div className="pt-4 pb-2 px-3">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Administration
                            </p>
                        </div>
                        {adminItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    )}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </>
                )}
            </nav>

            {/* User info at bottom */}
            <div className="px-3 py-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600/30 text-green-400 text-sm font-bold">
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                            {user?.username || 'User'}
                        </p>
                        <p className="text-slate-500 text-xs capitalize">{user?.role}</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}