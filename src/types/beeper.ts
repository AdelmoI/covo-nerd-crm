// src/types/beeper.ts
// Tipi TypeScript per l'integrazione Beeper nel CRM Il Covo del Nerd

export interface BeeperConversation {
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
        orderPlatform?: 'store' | 'sito' | 'telefono' | 'altro';
        tags?: string[];
        assignedTo?: string;
        priority?: 'bassa' | 'normale' | 'alta' | 'urgente';
        status?: 'nuovo' | 'in_corso' | 'risolto' | 'chiuso';
        isArchived?: boolean;
        isStarred?: boolean;
        lastSync?: Date;
    };
}

export interface BeeperMessage {
    id: string;
    chatId: string;
    text: string;
    sender: string;
    senderName?: string;
    timestamp: number;
    isFromMe: boolean;
    messageType?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location';
    attachments?: BeeperAttachment[];
    reactions?: BeeperReaction[];
    replyTo?: string; // ID del messaggio a cui risponde
    isEdited?: boolean;
    isDeleted?: boolean;
}

export interface BeeperAttachment {
    id: string;
    type: 'image' | 'video' | 'audio' | 'file' | 'sticker';
    url: string;
    filename?: string;
    size?: number;
    mimeType?: string;
    thumbnail?: string;
    duration?: number; // Per video/audio in secondi
}

export interface BeeperReaction {
    emoji: string;
    sender: string;
    timestamp: number;
}

export interface BeeperParticipant {
    id: string;
    name: string;
    displayName?: string;
    avatar?: string;
    isMe: boolean;
    role?: 'admin' | 'member';
    phoneNumber?: string;
    email?: string;
}

export interface BeeperSyncResult {
    success: boolean;
    data?: {
        conversations: BeeperConversation[];
        sync: {
            source: 'beeper_api' | 'mock' | 'mock_fallback';
            timestamp: string;
            duration: number;
            totalChats: number;
            newChats?: number;
            updatedChats?: number;
            forced?: boolean;
        };
    };
    error?: string;
    details?: string;
}

export interface BeeperConnectionStatus {
    isConnected: boolean;
    isInitialized: boolean;
    lastSync?: Date;
    error?: string;
    apiUrl?: string;
    version?: string;
    supportedServices: string[];
    activeChats: number;
}

// Tipi per il client Beeper
export interface BeeperClientConfig {
    apiUrl: string;
    timeout: number;
    retryAttempts: number;
    useMockData: boolean;
}

export interface BeeperListChatsOptions {
    limit?: number;
    offset?: number;
    onlyUnread?: boolean;
    service?: string;
    modifiedSince?: Date;
}

export interface BeeperSearchOptions {
    query: string;
    chatId?: string;
    limit?: number;
    beforeDate?: Date;
    afterDate?: Date;
}

export interface BeeperSendMessageOptions {
    chatId: string;
    text: string;
    replyTo?: string;
    attachments?: File[];
}

// Tipi per i metadati CRM che estendiamo sui dati Beeper
export interface ConversationMetadata {
    beeperChatId: string;
    beeperGuid: string;
    chatIdentifier: string;
    displayName: string;
    service: string;

    // Informazioni dal CRM
    store?: string;
    orderId?: string;
    orderPlatform?: 'store' | 'sito' | 'telefono' | 'altro';
    assignedTo?: string; // ID operatore
    priority: 'bassa' | 'normale' | 'alta' | 'urgente';
    status: 'nuovo' | 'in_corso' | 'in_attesa' | 'risolto' | 'chiuso' | 'archiviato';

    // Metadati aggiuntivi
    tags: string[];
    isStarred: boolean;
    isArchived: boolean;

    // Info ultimo messaggio (cache per performance)
    lastMessageText: string;
    lastMessageTimestamp: Date;
    unreadCount: number;
    participants: string[];

    // Timestamp
    createdAt: Date;
    updatedAt: Date;
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
        this.name = 'BeeperConnectionError';
    }
}

export class BeeperTimeoutError extends BeeperError {
    constructor(message: string = 'Timeout durante la connessione a Beeper') {
        super(message, 'TIMEOUT_ERROR');
        this.name = 'BeeperTimeoutError';
    }
}

// Costanti
export const BEEPER_SERVICES = [
    'whatsapp',
    'telegram',
    'instagram',
    'facebook',
    'email',
    'sms',
    'discord',
    'slack',
    'other'
] as const;

export const CRM_STORES = [
    'Roma',
    'Foggia',
    'Manfredonia',
    'Cosenza',
    'Viterbo',
    'Torino',
    'Trapani',
    'Parma',
    'Erba',
    'Bari',
    'Online'
] as const;

export const CRM_PRIORITIES = ['bassa', 'normale', 'alta', 'urgente'] as const;
export const CRM_STATUSES = ['nuovo', 'in_corso', 'in_attesa', 'risolto', 'chiuso', 'archiviato'] as const;

export type BeeperService = typeof BEEPER_SERVICES[number];
export type CRMStore = typeof CRM_STORES[number];
export type CRMPriority = typeof CRM_PRIORITIES[number];
export type CRMStatus = typeof CRM_STATUSES[number];