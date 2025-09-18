// src/app/dashboard/page.tsx
'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
    User,
    Mail,
    Shield,
    Globe,
    CheckCircle,
    Clock,
    Database,
    MessageSquare,
    Tag,
    LogOut,
    Settings,
    BarChart3
} from 'lucide-react'
import ConversationsDashboard from '@/components/dashboard/ConversationsDashboard'

type TabType = 'sistema' | 'conversazioni' | 'analytics';

export default function Dashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabType>('conversazioni')

    useEffect(() => {
        if (status === 'loading') return
        if (!session) {
            router.push('/auth/signin')
            return
        }
    }, [session, status, router])

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D70B3] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Caricamento...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    // Componente Sistema Dashboard (il tuo dashboard originale)
    const SystemDashboard = () => (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Stato Sistema</h2>
                <p className="text-gray-600">Monitoraggio e informazioni tecniche del CRM</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card Info Utente */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="text-[#1D70B3]" size={20} />
                        <h3 className="text-lg font-medium text-gray-900">
                            Info Utente
                        </h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">Nome:</span>
                            <span className="text-sm text-gray-700">{session.user.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">Email:</span>
                            <span className="text-sm text-gray-700">{session.user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">Ruolo:</span>
                            <span className="text-sm text-gray-700">{session.user.role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">Accesso:</span>
                            <span className="text-sm text-gray-700">Tutti i canali</span>
                        </div>
                    </div>
                </div>

                {/* Card Stato Sistema */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="text-[#1D70B3]" size={20} />
                        <h3 className="text-lg font-medium text-gray-900">
                            Stato Sistema
                        </h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-sm font-medium text-gray-900">Autenticazione: </span>
                            <span className="text-sm text-green-600">OK</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-yellow-600" />
                            <span className="text-sm font-medium text-gray-900">Beeper API: </span>
                            <span className="text-sm text-yellow-600">In sviluppo</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-sm font-medium text-gray-900">Database: </span>
                            <span className="text-sm text-green-600">Connesso</span>
                        </div>
                    </div>
                </div>

                {/* Card Prossimi Passi */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="text-[#1D70B3]" size={20} />
                        <h3 className="text-lg font-medium text-gray-900">
                            Prossimi Passi
                        </h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-sm text-gray-900">Autenticazione completata</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MessageSquare size={16} className="text-green-600" />
                            <span className="text-sm text-gray-900">Dashboard conversazioni creata</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-yellow-600" />
                            <span className="text-sm text-gray-900">Client Beeper API reale</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Tag size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-900">Sistema note e tag</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Debug Info (solo per sviluppo) */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Debug Sessione
                </h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto text-gray-800">
                    {JSON.stringify(session, null, 2)}
                </pre>
            </div>
        </div>
    );

    // Componente Analytics Dashboard (placeholder per futuro)
    const AnalyticsDashboard = () => (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
                <p className="text-gray-600">Statistiche e report sulle conversazioni</p>
            </div>

            <div className="bg-white rounded-lg shadow p-8 text-center">
                <BarChart3 className="mx-auto mb-4 text-gray-300" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics in arrivo</h3>
                <p className="text-gray-600">
                    Le statistiche e i report dettagliati saranno disponibili nella prossima fase di sviluppo.
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header principale */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Il Covo del Nerd - Dashboard CRM
                            </h1>
                            <p className="text-sm text-gray-600">
                                Benvenuto, {session.user.name}
                            </p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('conversazioni')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'conversazioni'
                                    ? 'border-[#1D70B3] text-[#1D70B3]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <MessageSquare size={16} />
                            Conversazioni
                        </button>
                        <button
                            onClick={() => setActiveTab('sistema')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'sistema'
                                    ? 'border-[#1D70B3] text-[#1D70B3]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Settings size={16} />
                            Sistema
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'analytics'
                                    ? 'border-[#1D70B3] text-[#1D70B3]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <BarChart3 size={16} />
                            Analytics
                        </button>
                    </nav>
                </div>
            </div>

            {/* Content Area */}
            <main>
                {activeTab === 'conversazioni' && <ConversationsDashboard />}
                {activeTab === 'sistema' && <SystemDashboard />}
                {activeTab === 'analytics' && <AnalyticsDashboard />}
            </main>
        </div>
    )
}