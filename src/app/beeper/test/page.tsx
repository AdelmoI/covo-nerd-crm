'use client';

// src/app/beeper-test/page.tsx
// Pagina di test per l'integrazione Beeper nel CRM

import { useState } from 'react';

interface BeeperTestResult {
    success: boolean;
    mode: 'real' | 'mock';
    data?: {
        connection: {
            success: boolean;
            initialized: boolean;
            toolsCount: number;
            chatsCount: number;
        };
        tools?: Array<{ name: string; description: string }>;
        chats: Array<{
            id: string;
            name: string;
            platform: string;
            lastMessage: string;
            timestamp: string;
        }>;
        messagesTest?: Array<{
            chatId: string;
            chatName: string;
            messagesCount: number;
        }>;
    };
    error?: string;
    duration: number;
    timestamp: string;
}

export default function BeeperTestPage() {
    const [testResult, setTestResult] = useState<BeeperTestResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [sendMessageLoading, setSendMessageLoading] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState('');
    const [testMessage, setTestMessage] = useState('Test message from CRM');

    const runBeeperTest = async () => {
        setLoading(true);
        setTestResult(null);

        try {
            const response = await fetch('/api/beeper/test');
            const result = await response.json();
            setTestResult(result);

            if (result.data?.chats?.length > 0) {
                setSelectedChatId(result.data.chats[0].id);
            }
        } catch (error) {
            setTestResult({
                success: false,
                mode: 'real',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: 0,
                timestamp: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    const testSendMessage = async () => {
        if (!selectedChatId || !testMessage.trim()) {
            alert('Seleziona una chat e inserisci un messaggio');
            return;
        }

        setSendMessageLoading(true);

        try {
            const response = await fetch('/api/beeper/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chatId: selectedChatId,
                    message: testMessage
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Messaggio inviato con successo!');
            } else {
                alert('Errore nell\'invio: ' + result.error);
            }
        } catch (error) {
            alert('Errore: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setSendMessageLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                🔗 Test Integrazione Beeper
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Test di connessione e funzionalità Beeper MCP per Il Covo del Nerd CRM
                            </p>
                        </div>

                        <button
                            onClick={runBeeperTest}
                            disabled={loading}
                            className="bg-[#1D70B3] hover:bg-blue-700 disabled:bg-gray-400 
                         text-white font-semibold py-3 px-6 rounded-lg
                         transition-colors duration-200 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    Testing...
                                </>
                            ) : (
                                <>
                                    🚀 Esegui Test Completo
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Configurazione */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        ⚙️ Configurazione Attuale
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-700">Modalità</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                <span className="text-orange-600">🔧 Mock Data (Sviluppo)</span>
                                <small className="block text-xs mt-1 text-gray-500">
                                    La modalità viene determinata lato server
                                </small>
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-700">Endpoint MCP</h3>
                            <p className="text-sm text-gray-600 mt-1 font-mono">
                                localhost:23373/v0/mcp
                            </p>
                        </div>
                    </div>
                </div>

                {/* Risultati Test */}
                {testResult && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            📊 Risultati Test
                        </h2>

                        {/* Status */}
                        <div className={`p-4 rounded-lg mb-4 ${testResult.success
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                            }`}>
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl ${testResult.success ? '✅' : '❌'}`} />
                                <div>
                                    <h3 className={`font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                        {testResult.success ? 'Test Superato' : 'Test Fallito'}
                                    </h3>
                                    <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        Modalità: {testResult.mode === 'mock' ? 'Mock Data' : 'Connessione Reale'} |
                                        Durata: {testResult.duration}ms
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Errore */}
                        {testResult.error && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                                <h3 className="font-medium text-red-800">Errore</h3>
                                <p className="text-red-600 text-sm font-mono mt-1">
                                    {testResult.error}
                                </p>
                            </div>
                        )}

                        {/* Dati di successo */}
                        {testResult.success && testResult.data && (
                            <div className="space-y-4">
                                {/* Connessione */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {testResult.data.connection.initialized ? '✅' : '❌'}
                                        </div>
                                        <div className="text-sm font-medium text-blue-800">Inizializzato</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {testResult.data.connection.toolsCount}
                                        </div>
                                        <div className="text-sm font-medium text-green-800">Tools</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {testResult.data.connection.chatsCount}
                                        </div>
                                        <div className="text-sm font-medium text-purple-800">Chat</div>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {testResult.data.chats.length}
                                        </div>
                                        <div className="text-sm font-medium text-orange-800">Caricate</div>
                                    </div>
                                </div>

                                {/* Chat trovate */}
                                {testResult.data.chats.length > 0 && (
                                    <div>
                                        <h3 className="font-medium text-gray-800 mb-3">💬 Chat Trovate</h3>
                                        <div className="space-y-2">
                                            {testResult.data.chats.map((chat) => (
                                                <div key={chat.id} className="bg-gray-50 p-4 rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{chat.name}</h4>
                                                            <p className="text-sm text-gray-600">
                                                                <span className="bg-gray-200 px-2 py-1 rounded text-xs">
                                                                    {chat.platform}
                                                                </span>
                                                            </p>
                                                            <p className="text-sm text-gray-700 mt-1">
                                                                "{chat.lastMessage}"
                                                            </p>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(chat.timestamp).toLocaleString('it-IT')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Test Invio Messaggio */}
                {testResult?.success && testResult.data?.chats && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            💬 Test Invio Messaggio
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Seleziona Chat
                                </label>
                                <select
                                    value={selectedChatId}
                                    onChange={(e) => setSelectedChatId(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D70B3] focus:border-transparent"
                                >
                                    {testResult.data.chats.map((chat) => (
                                        <option key={chat.id} value={chat.id}>
                                            {chat.name} ({chat.platform})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Messaggio di Test
                                </label>
                                <textarea
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    rows={3}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D70B3] focus:border-transparent"
                                    placeholder="Inserisci messaggio di test..."
                                />
                            </div>

                            <button
                                onClick={testSendMessage}
                                disabled={sendMessageLoading || !selectedChatId || !testMessage.trim()}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 
                           text-white font-semibold py-3 px-6 rounded-lg
                           transition-colors duration-200 flex items-center gap-2"
                            >
                                {sendMessageLoading ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        Inviando...
                                    </>
                                ) : (
                                    <>
                                        📤 Invia Messaggio Test
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}