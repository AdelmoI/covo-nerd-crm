// src/lib/beeper/types.ts
// Tipi TypeScript per l'integrazione Beeper MCP

export interface MCPResponse {
    jsonrpc: string;
    id: number | string;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

export interface BeeperTool {
    name: string;
    description: string;
    inputSchema?: {
        type: string;
        properties: Record<string, any>;
    };
}

export interface BeeperChat {
    id: string;
    name: string;
    platform: 'WhatsApp' | 'Telegram' | 'SMS' | 'Email' | 'Discord' | 'Unknown';
    lastMessage: {
        text: string;
        timestamp: Date;
        sender: string;
    };
    participants: BeeperParticipant[];
    metadata: {
        type: string;
        isGroup: boolean;
        rawData?: any; // Dati originali da Beeper per debug
    };
}

export interface BeeperMessage {
    id: string;
    text: string;
    sender: string;
    timestamp: Date;
    chatId: string;
    attachments?: BeeperAttachment[];
    metadata?: {
        platform?: string;
        messageType?: string;
        rawData?: any;
    };
}

export interface BeeperParticipant {
    id: string;
    name: string;
    avatar?: string;
    isMe: boolean;
}

export interface BeeperAttachment {
    id: string;
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    filename?: string;
    size?: number;
}

export interface BeeperConnectionStatus {
    isConnected: boolean;
    isInitialized: boolean;
    lastSync?: Date;
    error?: string;
    toolsAvailable: number;
    chatsSync: number;
}

// Tipi per il CRM che estendono i dati Beeper
export interface CRMChat extends BeeperChat {
    // Metadati CRM aggiuntivi
    crm: {
        store?: string;
        orderNumber?: string;
        orderPlatform?: 'store' | 'sito' | 'telefono' | 'altro';
        status: 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
        priority: 'low' | 'normal' | 'high' | 'urgent';
        assignedTo?: string;
        tags: string[];
        notesCount: number;
        remindersCount: number;
        isArchived: boolean;
        isStarred: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}

export interface BeeperSyncResult {
    success: boolean;
    totalChats: number;
    newChats: number;
    updatedChats: number;
    errors: string[];
    duration: number; // millisecondi
    timestamp: Date;
}

// Configurazione Beeper
export interface BeeperConfig {
    enabled: boolean;
    apiUrl: string;
    token?: string;
    syncInterval: number; // secondi
    maxChats: number;
    enableMockData: boolean; // Per sviluppo senza Beeper Desktop
}

// Mock data per sviluppo
export interface MockBeeperData {
    chats: BeeperChat[];
    messages: Record<string, BeeperMessage[]>; // chatId -> messages[]
}

// Errori specifici di Beeper
export class BeeperError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: any
    ) {
        super(message);
        this.name = 'BeeperError';
    }
}

export class BeeperConnectionError extends BeeperError {
    constructor(message: string, originalError?: any) {
        super(message, 'CONNECTION_ERROR', originalError);
    }
}

export class BeeperAuthError extends BeeperError {
    constructor(message: string, originalError?: any) {
        super(message, 'AUTH_ERROR', originalError);
    }
}

export class BeeperSyncError extends BeeperError {
    constructor(message: string, originalError?: any) {
        super(message, 'SYNC_ERROR', originalError);
    }
}