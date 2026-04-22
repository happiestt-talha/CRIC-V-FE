'use client'

import ProtectedRoute from '@/components/shared/ProtectedRoute'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }) {
    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-slate-950">
                <Sidebar />
                <main className="flex-1 ml-64 min-h-screen">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    )
}