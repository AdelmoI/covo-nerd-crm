// src/app/api/beeper/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import BeeperClient from '@/lib/beeper/client';
import { connectDB } from '@/lib/mongodb';
import ChatMetadata from '@/lib/models/ChatMetadata';
import { BeeperConversation } from '@/types/beeper';

// Configurazione per la sincronizzazione
const SYNC_CONFIG = {
  maxChatsPerSync: 50,
  retryAttempts: 3,
  timeoutMs: 10000,
  // Prova sempre prima i dati reali, fallback su mock solo in caso di errore
  preferReal: true,
  useMockData: process.env.BEEPER_USE_MOCK_DATA === 'true',
};

// Dati mock per sviluppo (basati su quelli già presenti nel progetto)
const MOCK_BEEPER_DATA = [
  {
    id: 'beeper_chat_1',
    guid: 'whatsapp_+39123456789',
    chatIdentifier: '+39123456789',
    displayName: 'Mario Rossi',
    service: 'whatsapp',
    lastMessage: {
      text: 'Ciao, avete disponibilità della Nintendo Switch OLED a Roma?',
      timestamp: Date.now() - 120000, // 2 minuti fa
      isFromMe: false,
      senderName: 'Mario Rossi'
    },
    unreadCount: 1,
    participants: ['+39123456789'],
    isGroup: false,
    lastActivity: new Date()
  },
  {
    id: 'beeper_chat_2',
    guid: 'telegram_@luciab',
    chatIdentifier: '@luciab',
    displayName: 'Lucia Bianchi',
    service: 'telegram',
    lastMessage: {
      text: 'Perfetto! Grazie per avermi aiutata con l\'ordine!',
      timestamp: Date.now() - 900000, // 15 minuti fa
      isFromMe: false,
      senderName: 'Lucia Bianchi'
    },
    unreadCount: 0,
    participants: ['@luciab'],
    isGroup: false,
    lastActivity: new Date()
  },
  {
    id: 'beeper_chat_3',
    guid: 'instagram_gamertech2024',
    chatIdentifier: 'gamertech2024',
    displayName: 'TechGamer',
    service: 'instagram',
    lastMessage: {
      text: 'Il PC che mi avete assemblato a Torino ha problemi di surriscaldamento...',
      timestamp: Date.now() - 1800000, // 30 minuti fa
      isFromMe: false,
      senderName: 'TechGamer'
    },
    unreadCount: 2,
    participants: ['gamertech2024'],
    isGroup: false,
    lastActivity: new Date()
  },
  {
    id: 'beeper_chat_4',
    guid: 'email_cliente@example.com',
    chatIdentifier: 'cliente@example.com',
    displayName: 'Giuseppe Verdi',
    service: 'email',
    lastMessage: {
      text: 'Volevo sapere se avete GPU RTX 4080 disponibili a Bari',
      timestamp: Date.now() - 3600000, // 1 ora fa
      isFromMe: false,
      senderName: 'Giuseppe Verdi'
    },
    unreadCount: 1,
    participants: ['cliente@example.com'],
    isGroup: false,
    lastActivity: new Date()
  },
  {
    id: 'beeper_chat_5',
    guid: 'facebook_gruppo_retrogaming',
    chatIdentifier: 'gruppo_retrogaming_fanpage',
    displayName: 'Gruppo Retro Gaming Fans',
    service: 'facebook',
    lastMessage: {
      text: 'Avete ancora le console vintage che ho visto in vetrina?',
      timestamp: Date.now() - 7200000, // 2 ore fa
      isFromMe: false,
      senderName: 'RetroGamer85'
    },
    unreadCount: 3,
    participants: ['retrogamer85', 'nerd_collector', 'vintage_tech'],
    isGroup: true,
    lastActivity: new Date()
  }
];

/**
 * Trasforma i dati Beeper nel formato richiesto dalla dashboard
 */
function transformBeeperData(beeperChats: any[]): BeeperConversation[] {
  return beeperChats.map(chat => ({
    id: chat.id,
    guid: chat.guid,
    chatIdentifier: chat.chatIdentifier,
    displayName: chat.displayName || chat.name || 'Cliente Sconosciuto',
    service: chat.service as any,
    lastMessage: {
      text: chat.lastMessage?.text || '',
      timestamp: chat.lastMessage?.timestamp || Date.now(),
      isFromMe: chat.lastMessage?.isFromMe || false,
      senderName: chat.lastMessage?.senderName || chat.displayName
    },
    unreadCount: chat.unreadCount || 0,
    participants: Array.isArray(chat.participants) ? chat.participants : [],
    metadata: {
      // Prova a inferire il negozio dal contenuto del messaggio
      store: inferStoreFromMessage(chat.lastMessage?.text || ''),
      tags: [],
      priority: chat.unreadCount > 2 ? 'alta' : 'normale',
      status: chat.unreadCount > 0 ? 'nuovo' : 'in_corso',
    }
  }));
}

/**
 * Inferisce il negozio dal contenuto del messaggio
 */
function inferStoreFromMessage(message: string): string | undefined {
  const stores = ['Roma', 'Foggia', 'Manfredonia', 'Cosenza', 'Viterbo', 'Torino', 'Trapani', 'Parma', 'Erba', 'Bari'];
  const lowerMessage = message.toLowerCase();
  
  for (const store of stores) {
    if (lowerMessage.includes(store.toLowerCase())) {
      return store;
    }
  }
  
  return undefined;
}

/**
 * Salva o aggiorna i metadati delle chat nel database
 */
async function saveOrUpdateChatMetadata(conversations: BeeperConversation[]) {
  await connectDB();
  
  const bulkOps = conversations.map(conv => ({
    updateOne: {
      filter: { beeperChatId: conv.id },
      update: {
        $set: {
          beeperChatId: conv.id,
          beeperGuid: conv.guid,
          chatIdentifier: conv.chatIdentifier,
          displayName: conv.displayName,
          service: conv.service,
          lastMessageText: conv.lastMessage.text,
          lastMessageTimestamp: new Date(conv.lastMessage.timestamp),
          unreadCount: conv.unreadCount,
          participants: conv.participants,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          notes: [],
          tags: conv.metadata?.tags || [],
          assignedTo: null,
          priority: conv.metadata?.priority || 'normale',
          status: conv.metadata?.status || 'nuovo',
          store: conv.metadata?.store || null,
        }
      },
      upsert: true
    }
  }));

  if (bulkOps.length > 0) {
    await ChatMetadata.bulkWrite(bulkOps);
  }
}

/**
 * Funzione condivisa per eseguire la sincronizzazione
 */
async function performBeeperSync(options: { forceReal?: boolean; maxChats?: number } = {}) {
  const { forceReal = false, maxChats = SYNC_CONFIG.maxChatsPerSync } = options;
  
  const startTime = Date.now();
  let conversations: BeeperConversation[] = [];
  let syncSource = 'unknown';
  let syncError = null;

  // Prova SEMPRE prima con la connessione reale a Beeper
  try {
    console.log('🔗 Tentativo connessione a Beeper Desktop MCP...');
    const beeperClient = new BeeperClient();
    
    // Inizializza la connessione MCP
    await beeperClient.initialize();
    
    // Verifica stato connessione
    const status = await beeperClient.getConnectionStatus();
    console.log('📊 Stato Beeper:', status);
    
    if (status.isConnected) {
      // Recupera conversazioni reali
      console.log('✅ Beeper connesso! Recuperando conversazioni reali...');
      const beeperChats = await beeperClient.listChats({
        limit: maxChats,
        onlyUnread: false
      });
      
      if (beeperChats && beeperChats.length > 0) {
        conversations = transformBeeperData(beeperChats);
        syncSource = 'beeper_api';
        console.log(`✅ Sincronizzate ${conversations.length} conversazioni REALI da Beeper`);
      } else {
        throw new Error('Nessuna conversazione recuperata da Beeper');
      }
    } else {
      throw new Error(`Beeper non connesso: ${status.error || 'Errore sconosciuto'}`);
    }
    
  } catch (beeperError: any) {
    console.error('❌ Errore connessione Beeper MCP:', beeperError);
    syncError = beeperError.message;
    
    // Fallback su dati mock SOLO se abilitato o in sviluppo
    if (SYNC_CONFIG.useMockData || process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Fallback su dati mock per sviluppo');
      conversations = transformBeeperData(MOCK_BEEPER_DATA);
      syncSource = 'mock_fallback';
    } else {
      // In produzione, restituisci l'errore
      throw new Error(`Impossibile connettersi a Beeper: ${beeperError.message}`);
    }
  }

  // Salva metadati nel database
  try {
    await saveOrUpdateChatMetadata(conversations);
    console.log(`💾 Salvati metadati per ${conversations.length} conversazioni`);
  } catch (dbError) {
    console.error('❌ Errore salvataggio database:', dbError);
    // Non bloccare la risposta per errori di database
  }

  const syncDuration = Date.now() - startTime;

  return {
    success: true,
    data: {
      conversations,
      sync: {
        source: syncSource,
        timestamp: new Date().toISOString(),
        duration: syncDuration,
        totalChats: conversations.length,
        newChats: conversations.filter(c => c.unreadCount > 0).length,
        error: syncError, // Includi eventuali errori per debugging
      }
    }
  };
}

/**
 * GET /api/beeper/sync - Sincronizza conversazioni da Beeper
 */
export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const syncResult = await performBeeperSync();
    return NextResponse.json(syncResult);

  } catch (error: any) {
    console.error('❌ Errore sincronizzazione Beeper:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Errore durante la sincronizzazione',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * POST /api/beeper/sync - Sincronizzazione forzata con opzioni
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { 
      forceReal = false, 
      maxChats = SYNC_CONFIG.maxChatsPerSync,
      timeout = SYNC_CONFIG.timeoutMs 
    } = body;

    console.log('🔄 Sincronizzazione forzata richiesta', { forceReal, maxChats });

    const syncResult = await performBeeperSync({ forceReal, maxChats });
    syncResult.data.sync.forced = true;

    return NextResponse.json(syncResult);

  } catch (error: any) {
    console.error('Errore POST sync:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Errore durante la sincronizzazione forzata',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}