// src/components/dashboard/ConversationsDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Filter, Plus, AlertCircle, RefreshCw } from 'lucide-react';

// Tipi per le conversazioni
interface BeeperConversation {
    id: string;
    guid: string;
    chatIdentifier: string;
    displayName: string;
    service: 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'email' | 'other';
    lastMessage: {
        text: string;
        timestamp: number;
        isFromMe: boolean;
        senderName?: string;
    };
    unreadCount: number;
    participants: string[];
    metadata?: {
        store?: string;
        orderId?: string;
        tags?: string[];
        assignedTo?: string;
        priority?: 'bassa' | 'normale' | 'alta' | 'urgente';
        status?: 'nuovo' | 'in_corso' | 'risolto' | 'chiuso';
    };
}

// Mock data basato sulla struttura attuale del progetto
const MOCK_CONVERSATIONS: BeeperConversation[] = [
    {
        id: 'conv_1',
        guid: 'whatsapp_12345',
        chatIdentifier: '+39123456789',
        displayName: 'Mario Rossi',
        service: 'whatsapp',
        lastMessage: {
            text: 'Salve, vorrei info sulla Switch OLED disponibilità a Roma',
            timestamp: Date.now() - 300000, // 5 minuti fa
            isFromMe: false,
            senderName: 'Mario Rossi'
        },
        unreadCount: 2,
        participants: ['+39123456789'],
        metadata: {
            store: 'Roma',
            tags: ['nintendo', 'console'],
            priority: 'normale',
            status: 'nuovo'
        }
    },
    {
        id: 'conv_2',
        guid: 'telegram_67890',
        chatIdentifier: '@luciabianchi',
        displayName: 'Lucia Bianchi',
        service: 'telegram',
        lastMessage: {
            text: 'Perfetto, grazie per l\'assistenza!',
            timestamp: Date.now() - 900000, // 15 minuti fa
            isFromMe: false,
            senderName: 'Lucia Bianchi'
        },
        unreadCount: 0,
        participants: ['@luciabianchi'],
        metadata: {
            store: 'Bari',
            orderId: 'ORD-2024-0312',
            tags: ['risolto', 'soddisfatto'],
            assignedTo: 'operatore1',
            priority: 'bassa',
            status: 'risolto'
        }
    },
    {
        id: 'conv_3',
        guid: 'instagram_54321',
        chatIdentifier: 'gamer_pro_2024',
        displayName: 'GamerPro',
        service: 'instagram',
        lastMessage: {
            text: 'Il PC gaming che mi avete assemblato ha un problema...',
            timestamp: Date.now() - 1800000, // 30 minuti fa
            isFromMe: false,
            senderName: 'GamerPro'
        },
        unreadCount: 1,
        participants: ['gamer_pro_2024'],
        metadata: {
            store: 'Torino',
            tags: ['pc_gaming', 'assistenza_tecnica'],
            priority: 'alta',
            status: 'in_corso',
            assignedTo: 'tecnico_specialist'
        }
    }
];

const STORES = ['Tutti', 'Roma', 'Foggia', 'Manfredonia', 'Cosenza', 'Viterbo', 'Torino', 'Trapani', 'Parma', 'Erba', 'Bari', 'Online'];
const SERVICES = ['Tutti', 'whatsapp', 'telegram', 'instagram', 'facebook', 'email'];
const STATUSES = ['Tutti', 'nuovo', 'in_corso', 'risolto', 'chiuso'];
const PRIORITIES = ['Tutti', 'urgente', 'alta', 'normale', 'bassa'];

export default function ConversationsDashboard() {
    const [conversations, setConversations] = useState<BeeperConversation[]>(MOCK_CONVERSATIONS);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStore, setSelectedStore] = useState('Tutti');
    const [selectedService, setSelectedService] = useState('Tutti');
    const [selectedStatus, setSelectedStatus] = useState('Tutti');
    const [selectedPriority, setSelectedPriority] = useState('Tutti');
    const [lastSync, setLastSync] = useState<Date | null>(null);

    // Funzione per sincronizzare con Beeper API
    const syncWithBeeper = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/beeper/sync');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setConversations(data.conversations || MOCK_CONVERSATIONS);
                    setLastSync(new Date());
                }
            }
        } catch (error) {
            console.error('Errore sincronizzazione Beeper:', error);
            // Mantieni mock data in caso di errore
        }
        setLoading(false);
    };

    // Sincronizzazione automatica ogni 30 secondi
    useEffect(() => {
        const interval = setInterval(syncWithBeeper, 30000);
        syncWithBeeper(); // Sync iniziale
        return () => clearInterval(interval);
    }, []);

    // Filtro conversazioni
    const filteredConversations = conversations.filter(conv => {
        const matchesSearch = conv.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.chatIdentifier.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStore = selectedStore === 'Tutti' || conv.metadata?.store === selectedStore;
        const matchesService = selectedService === 'Tutti' || conv.service === selectedService;
        const matchesStatus = selectedStatus === 'Tutti' || conv.metadata?.status === selectedStatus;
        const matchesPriority = selectedPriority === 'Tutti' || conv.metadata?.priority === selectedPriority;

        return matchesSearch && matchesStore && matchesService && matchesStatus && matchesPriority;
    });

    // Funzioni helper
    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'ora';
        if (minutes < 60) return `${minutes}m fa`;
        if (hours < 24) return `${hours}h fa`;
        return `${days}g fa`;
    };

    const getServiceIcon = (service: string) => {
        const icons = {
            whatsapp: '📱',
            telegram: '✈️',
            instagram: '📷',
            facebook: '👥',
            email: '✉️',
            other: '💬'
        };
        return icons[service as keyof typeof icons] || icons.other;
    };

    const getPriorityColor = (priority?: string) => {
        const colors = {
            urgente: 'bg-red-100 text-red-800 border-red-200',
            alta: 'bg-orange-100 text-orange-800 border-orange-200',
            normale: 'bg-blue-100 text-blue-800 border-blue-200',
            bassa: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[priority as keyof typeof colors] || colors.normale;
    };

    const getStatusColor = (status?: string) => {
        const colors = {
            nuovo: 'bg-green-100 text-green-800 border-green-200',
            in_corso: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            risolto: 'bg-blue-100 text-blue-800 border-blue-200',
            chiuso: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[status as keyof typeof colors] || colors.nuovo;
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <MessageSquare className="text-[#1D70B3]" size={32} />
                            Conversazioni Clienti
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Gestisci tutte le conversazioni dei 10 negozi Il Covo del Nerd
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={syncWithBeeper}
                            disabled={loading}
                            className="bg-[#1D70B3] text-white px-4 py-2 rounded-lg hover:bg-[#155a94] transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Sincronizzando...' : 'Sincronizza'}
                        </button>
                    </div>
                </div>

                {/* Info sincronizzazione */}
                {lastSync && (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <AlertCircle size={14} />
                        Ultima sincronizzazione: {lastSync.toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Filtri */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Ricerca */}
                    <div className="lg:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Cerca conversazioni..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D70B3] focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filtro Negozio */}
                    <div>
                        <select
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D70B3]"
                        >
                            {STORES.map(store => (
                                <option key={store} value={store}>{store}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Servizio */}
                    <div>
                        <select
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D70B3]"
                        >
                            {SERVICES.map(service => (
                                <option key={service} value={service}>
                                    {service === 'Tutti' ? 'Tutti' : service.charAt(0).toUpperCase() + service.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Stato */}
                    <div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D70B3]"
                        >
                            {STATUSES.map(status => (
                                <option key={status} value={status}>
                                    {status === 'Tutti' ? 'Tutti' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Priorità */}
                    <div>
                        <select
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D70B3]"
                        >
                            {PRIORITIES.map(priority => (
                                <option key={priority} value={priority}>
                                    {priority === 'Tutti' ? 'Tutti' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista Conversazioni */}
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {filteredConversations.length} Conversazioni
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Non lette: {filteredConversations.filter(c => c.unreadCount > 0).length}</span>
                            <span>In corso: {filteredConversations.filter(c => c.metadata?.status === 'in_corso').length}</span>
                        </div>
                    </div>
                </div>

                <div className="divide-y">
                    {filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <MessageSquare className="mx-auto mb-4 text-gray-300" size={48} />
                            <p>Nessuna conversazione trovata</p>
                        </div>
                    ) : (
                        filteredConversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${conversation.unreadCount > 0 ? 'bg-blue-50 border-l-4 border-l-[#1D70B3]' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Avatar/Service Icon */}
                                        <div className="text-2xl">{getServiceIcon(conversation.service)}</div>

                                        {/* Dettagli conversazione */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {conversation.displayName}
                                                </h3>
                                                {conversation.metadata?.store && (
                                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                        {conversation.metadata.store}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                                {conversation.lastMessage.text}
                                            </p>

                                            {/* Tags */}
                                            {conversation.metadata?.tags && conversation.metadata.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {conversation.metadata.tags.map((tag, index) => (
                                                        <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info laterali */}
                                    <div className="flex flex-col items-end gap-2 ml-4">
                                        <span className="text-xs text-gray-500">
                                            {formatTimestamp(conversation.lastMessage.timestamp)}
                                        </span>

                                        {/* Contatori e stati */}
                                        <div className="flex items-center gap-2">
                                            {conversation.unreadCount > 0 && (
                                                <span className="bg-[#1D70B3] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                                    {conversation.unreadCount}
                                                </span>
                                            )}

                                            {conversation.metadata?.priority && conversation.metadata.priority !== 'normale' && (
                                                <span className={`text-xs border rounded px-2 py-1 ${getPriorityColor(conversation.metadata.priority)}`}>
                                                    {conversation.metadata.priority}
                                                </span>
                                            )}

                                            {conversation.metadata?.status && (
                                                <span className={`text-xs border rounded px-2 py-1 ${getStatusColor(conversation.metadata.status)}`}>
                                                    {conversation.metadata.status.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}