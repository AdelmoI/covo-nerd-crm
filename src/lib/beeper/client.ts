// src/lib/beeper/client.ts
// Client Beeper MCP per Il Covo del Nerd CRM

import axios, { AxiosInstance } from 'axios';
import { BeeperChat, BeeperMessage, BeeperTool, MCPResponse } from './types';

export class BeeperMCPClient {
    private client: AxiosInstance;
    private sessionId: string | null = null;
    private isInitialized = false;
    private requestId = 1;

    constructor() {
        const baseURL = process.env.BEEPER_MCP_URL || 'http://localhost:23373/v0/mcp';
        const token = process.env.BEEPER_API_TOKEN;

        this.client = axios.create({
            baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });
    }

    /**
     * Inizializza la sessione MCP con Beeper
     */
    async initialize(): Promise<boolean> {
        try {
            console.log('🔄 Initializing Beeper MCP session...');

            const request = {
                jsonrpc: '2.0',
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        roots: { listChanged: true },
                        sampling: {}
                    },
                    clientInfo: {
                        name: 'Il Covo del Nerd CRM',
                        version: '1.0.0'
                    }
                },
                id: this.requestId++
            };

            const response = await this.client.post('', request);
            const data = this.parseSSEResponse(response.data);

            if (data?.result) {
                this.isInitialized = true;
                console.log('✅ Beeper MCP initialized successfully');

                // Estrai session ID se presente
                if (data.result.sessionId) {
                    this.sessionId = data.result.sessionId;
                }

                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Beeper MCP initialization failed:', error);
            return false;
        }
    }

    /**
     * Ottiene la lista dei tool disponibili
     */
    async getAvailableTools(): Promise<BeeperTool[]> {
        if (!this.isInitialized) {
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Cannot initialize Beeper MCP');
            }
        }

        try {
            const request = {
                jsonrpc: '2.0',
                method: 'tools/list',
                params: {},
                id: this.requestId++
            };

            const response = await this.client.post('', request);
            const data = this.parseSSEResponse(response.data);

            return data?.result?.tools || [];
        } catch (error) {
            console.error('❌ Failed to get available tools:', error);
            return [];
        }
    }

    /**
     * Chiama un tool specifico di Beeper
     */
    async callTool(toolName: string, args: any = {}): Promise<any> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const request = {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: args
                },
                id: this.requestId++
            };

            const response = await this.client.post('', request);
            const data = this.parseSSEResponse(response.data);

            return data?.result;
        } catch (error) {
            console.error(`❌ Failed to call tool ${toolName}:`, error);
            throw error;
        }
    }

    /**
     * Ottiene tutte le chat da Beeper
     */
    async getChats(limit = 50): Promise<BeeperChat[]> {
        try {
            // Prima ottieni i tool disponibili per vedere come si chiamano
            const tools = await this.getAvailableTools();
            console.log('Available tools:', tools.map(t => t.name));

            // Cerca il tool per ottenere le chat (potrebbe chiamarsi diversamente)
            const chatTool = tools.find(t =>
                t.name.toLowerCase().includes('chat') ||
                t.name.toLowerCase().includes('conversation')
            );

            if (!chatTool) {
                throw new Error('No chat tool found in available tools');
            }

            // Chiama il tool per ottenere le chat
            const result = await this.callTool(chatTool.name, { limit });

            // Trasforma il risultato nel formato standard BeeperChat
            return this.transformToStandardFormat(result);
        } catch (error) {
            console.error('❌ Failed to get chats:', error);
            return [];
        }
    }

    /**
     * Cerca messaggi in una chat specifica
     */
    async getMessages(chatId: string, limit = 20): Promise<BeeperMessage[]> {
        try {
            const tools = await this.getAvailableTools();
            const messageTool = tools.find(t =>
                t.name.toLowerCase().includes('message') ||
                t.name.toLowerCase().includes('search')
            );

            if (!messageTool) {
                throw new Error('No message tool found');
            }

            const result = await this.callTool(messageTool.name, {
                chat_id: chatId,
                limit
            });

            return this.transformMessagesToStandardFormat(result);
        } catch (error) {
            console.error('❌ Failed to get messages:', error);
            return [];
        }
    }

    /**
     * Invia un messaggio a una chat
     */
    async sendMessage(chatId: string, text: string): Promise<boolean> {
        try {
            const tools = await this.getAvailableTools();
            const sendTool = tools.find(t =>
                t.name.toLowerCase().includes('send') ||
                t.name.toLowerCase().includes('message')
            );

            if (!sendTool) {
                throw new Error('No send message tool found');
            }

            await this.callTool(sendTool.name, {
                chat_id: chatId,
                text
            });

            return true;
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            return false;
        }
    }

    /**
     * Test completo di connessione
     */
    async testConnection(): Promise<{
        success: boolean;
        initialized: boolean;
        toolsCount: number;
        chatsCount: number;
        error?: string;
    }> {
        try {
            // Test 1: Initialize
            const initialized = await this.initialize();
            if (!initialized) {
                return {
                    success: false,
                    initialized: false,
                    toolsCount: 0,
                    chatsCount: 0,
                    error: 'Failed to initialize MCP session'
                };
            }

            // Test 2: Get tools
            const tools = await this.getAvailableTools();

            // Test 3: Get chats (con limite ridotto per test)
            const chats = await this.getChats(5);

            return {
                success: true,
                initialized: true,
                toolsCount: tools.length,
                chatsCount: chats.length
            };
        } catch (error) {
            return {
                success: false,
                initialized: this.isInitialized,
                toolsCount: 0,
                chatsCount: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Utility: Parsa risposte SSE
     */
    private parseSSEResponse(responseData: any): MCPResponse | null {
        if (typeof responseData === 'string' && responseData.includes('data:')) {
            const lines = responseData.split('\n');
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    try {
                        return JSON.parse(line.substring(5).trim());
                    } catch (e) {
                        console.warn('Could not parse SSE line:', line);
                    }
                }
            }
        }
        return responseData;
    }

    /**
     * Trasforma dati Beeper nel formato standard CRM
     */
    private transformToStandardFormat(beeperData: any): BeeperChat[] {
        if (!beeperData || !Array.isArray(beeperData)) {
            return [];
        }

        return beeperData.map(chat => ({
            id: chat.id || chat.chat_id || `unknown_${Date.now()}`,
            name: chat.name || chat.title || 'Unknown Chat',
            platform: this.detectPlatform(chat),
            lastMessage: {
                text: chat.last_message?.text || chat.lastMessage || '',
                timestamp: new Date(chat.last_message?.timestamp || chat.updatedAt || Date.now()),
                sender: chat.last_message?.sender || 'unknown'
            },
            participants: chat.participants || [],
            metadata: {
                type: chat.type || 'unknown',
                isGroup: chat.is_group || false,
                rawData: chat // Mantieni i dati originali per debug
            }
        }));
    }

    /**
     * Trasforma messaggi nel formato standard
     */
    private transformMessagesToStandardFormat(beeperData: any): BeeperMessage[] {
        if (!beeperData || !Array.isArray(beeperData)) {
            return [];
        }

        return beeperData.map(msg => ({
            id: msg.id || `msg_${Date.now()}`,
            text: msg.text || msg.content || '',
            sender: msg.sender || 'unknown',
            timestamp: new Date(msg.timestamp || Date.now()),
            chatId: msg.chat_id || msg.chatId || 'unknown'
        }));
    }

    /**
     * Rileva la piattaforma dal tipo di chat
     */
    private detectPlatform(chat: any): string {
        const type = (chat.type || '').toLowerCase();
        const id = (chat.id || '').toLowerCase();

        if (type.includes('whatsapp') || id.includes('whatsapp')) return 'WhatsApp';
        if (type.includes('telegram') || id.includes('telegram')) return 'Telegram';
        if (type.includes('sms') || id.includes('sms')) return 'SMS';
        if (type.includes('email') || id.includes('email')) return 'Email';
        if (type.includes('discord') || id.includes('discord')) return 'Discord';

        return 'Unknown';
    }

    /**
     * Chiude la connessione
     */
    async disconnect(): Promise<void> {
        this.isInitialized = false;
        this.sessionId = null;
        this.requestId = 1;
    }
}

// Singleton instance per l'app
export const beeperClient = new BeeperMCPClient();