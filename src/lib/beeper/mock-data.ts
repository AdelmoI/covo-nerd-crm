// src/lib/beeper/mock-data.ts
// Dati mock per sviluppare il CRM senza Beeper Desktop attivo

import { BeeperChat, BeeperMessage, MockBeeperData } from './types';

export const mockBeeperChats: BeeperChat[] = [
    {
        id: 'whatsapp_393401234567',
        name: 'Marco Pellegrini',
        platform: 'WhatsApp',
        lastMessage: {
            text: 'Salve, vorrei informazioni sulla RTX 4090 disponibile nel vostro negozio di Roma',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 ore fa
            sender: 'customer'
        },
        participants: [
            {
                id: 'customer_marco',
                name: 'Marco Pellegrini',
                isMe: false
            },
            {
                id: 'operator_mario',
                name: 'Mario Rossi',
                isMe: true
            }
        ],
        metadata: {
            type: 'whatsapp_dm',
            isGroup: false,
            rawData: {
                phoneNumber: '+39 340 123 4567',
                lastSeen: new Date(Date.now() - 30 * 60 * 1000)
            }
        }
    },

    {
        id: 'telegram_87654321',
        name: 'GamerGirl23 (Laura)',
        platform: 'Telegram',
        lastMessage: {
            text: 'Perfetto, grazie per la disponibilità! Passo a ritirare domani',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min fa
            sender: 'customer'
        },
        participants: [
            {
                id: 'customer_laura',
                name: 'Laura',
                isMe: false
            },
            {
                id: 'operator_giulia',
                name: 'Giulia Bianchi',
                isMe: true
            }
        ],
        metadata: {
            type: 'telegram_dm',
            isGroup: false,
            rawData: {
                username: '@GamerGirl23',
                userId: 87654321
            }
        }
    },

    {
        id: 'whatsapp_393351112222',
        name: 'Tech Solutions SRL',
        platform: 'WhatsApp',
        lastMessage: {
            text: 'Buongiorno, stiamo riscontrando un problema con il laptop acquistato la settimana scorsa. Si spegne improvvisamente.',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 ore fa
            sender: 'customer'
        },
        participants: [
            {
                id: 'customer_techsolutions',
                name: 'Tech Solutions SRL',
                isMe: false
            },
            {
                id: 'operator_luca',
                name: 'Luca Verdi',
                isMe: true
            }
        ],
        metadata: {
            type: 'whatsapp_business',
            isGroup: false,
            rawData: {
                phoneNumber: '+39 335 111 2222',
                businessAccount: true
            }
        }
    },

    {
        id: 'telegram_group_gaming_community',
        name: 'Gaming Community Roma',
        platform: 'Telegram',
        lastMessage: {
            text: '@CovoDeiNerd avete ricevuto le nuove schede grafiche AMD?',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 ora fa
            sender: 'customer'
        },
        participants: [
            {
                id: 'customer_various',
                name: '47 membri',
                isMe: false
            },
            {
                id: 'operator_anna',
                name: 'Anna Neri',
                isMe: true
            }
        ],
        metadata: {
            type: 'telegram_group',
            isGroup: true,
            rawData: {
                groupId: -1001234567890,
                memberCount: 47
            }
        }
    },

    {
        id: 'whatsapp_393209876543',
        name: 'Francesca Milano',
        platform: 'WhatsApp',
        lastMessage: {
            text: 'Grazie mille per l\'assistenza, siete stati fantastici! ⭐⭐⭐⭐⭐',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 giorno fa
            sender: 'customer'
        },
        participants: [
            {
                id: 'customer_francesca',
                name: 'Francesca Milano',
                isMe: false
            },
            {
                id: 'operator_luca',
                name: 'Luca Verdi',
                isMe: true
            }
        ],
        metadata: {
            type: 'whatsapp_dm',
            isGroup: false,
            rawData: {
                phoneNumber: '+39 320 987 6543'
            }
        }
    },

    {
        id: 'email_gaming_master',
        name: 'Gaming Master Community',
        platform: 'Email',
        lastMessage: {
            text: 'Richiesta partnership per evento gaming - necessaria risposta entro fine settimana',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 ore fa
            sender: 'customer'
        },
        participants: [
            {
                id: 'customer_gamingmaster',
                name: 'Gaming Master Community',
                isMe: false
            },
            {
                id: 'operator_mario',
                name: 'Mario Rossi',
                isMe: true
            }
        ],
        metadata: {
            type: 'email',
            isGroup: false,
            rawData: {
                email: 'info@gamingmaster.com',
                subject: 'Proposta Partnership Evento Gaming 2025'
            }
        }
    }
];

export const mockBeeperMessages: Record<string, BeeperMessage[]> = {
    'whatsapp_393401234567': [
        {
            id: 'msg_1',
            text: 'Salve, vorrei informazioni sulla RTX 4090 disponibile nel vostro negozio di Roma',
            sender: 'customer',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            chatId: 'whatsapp_393401234567'
        },
        {
            id: 'msg_2',
            text: 'Buongiorno Marco! Abbiamo la RTX 4090 disponibile. Il prezzo è €1899. Interested?',
            sender: 'operator',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
            chatId: 'whatsapp_393401234567'
        },
        {
            id: 'msg_3',
            text: 'Perfetto! Posso passare oggi pomeriggio per vederla?',
            sender: 'customer',
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            chatId: 'whatsapp_393401234567'
        }
    ],

    'telegram_87654321': [
        {
            id: 'msg_4',
            text: 'Ciao! Sto cercando un headset gaming buono per streaming',
            sender: 'customer',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            chatId: 'telegram_87654321'
        },
        {
            id: 'msg_5',
            text: 'Ciao Laura! Ti consiglio il SteelSeries Arctis 7P+. Ottima qualità audio e microfono',
            sender: 'operator',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
            chatId: 'telegram_87654321'
        },
        {
            id: 'msg_6',
            text: 'Perfetto, grazie per la disponibilità! Passo a ritirare domani',
            sender: 'customer',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            chatId: 'telegram_87654321'
        }
    ],

    'whatsapp_393351112222': [
        {
            id: 'msg_7',
            text: 'Buongiorno, stiamo riscontrando un problema con il laptop acquistato la settimana scorsa. Si spegne improvvisamente.',
            sender: 'customer',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            chatId: 'whatsapp_393351112222'
        },
        {
            id: 'msg_8',
            text: 'Mi dispiace sentire questo. Può inviarmi il numero d\'ordine così controllo la garanzia?',
            sender: 'operator',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
            chatId: 'whatsapp_393351112222'
        }
    ]
};

export const mockBeeperData: MockBeeperData = {
    chats: mockBeeperChats,
    messages: mockBeeperMessages
};

/**
 * Simula il comportamento del client Beeper per sviluppo
 */
export class MockBeeperClient {
    private static instance: MockBeeperClient;

    public static getInstance(): MockBeeperClient {
        if (!MockBeeperClient.instance) {
            MockBeeperClient.instance = new MockBeeperClient();
        }
        return MockBeeperClient.instance;
    }

    async getChats(limit = 50): Promise<BeeperChat[]> {
        // Simula delay di rete
        await this.delay(500);
        return mockBeeperChats.slice(0, limit);
    }

    async getMessages(chatId: string, limit = 20): Promise<BeeperMessage[]> {
        await this.delay(300);
        return mockBeeperMessages[chatId]?.slice(0, limit) || [];
    }

    async sendMessage(chatId: string, text: string): Promise<boolean> {
        await this.delay(200);

        // Simula invio messaggio aggiungendolo ai mock data
        const newMessage: BeeperMessage = {
            id: `msg_${Date.now()}`,
            text,
            sender: 'operator',
            timestamp: new Date(),
            chatId
        };

        if (!mockBeeperMessages[chatId]) {
            mockBeeperMessages[chatId] = [];
        }
        mockBeeperMessages[chatId].push(newMessage);

        // Aggiorna ultimo messaggio nella chat
        const chat = mockBeeperChats.find(c => c.id === chatId);
        if (chat) {
            chat.lastMessage = {
                text,
                timestamp: new Date(),
                sender: 'operator'
            };
        }

        return true;
    }

    async testConnection() {
        await this.delay(1000);
        return {
            success: true,
            initialized: true,
            toolsCount: 5, // Simula 5 tool disponibili
            chatsCount: mockBeeperChats.length
        };
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export default per facile import
export default mockBeeperData;