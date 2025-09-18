// src/app/api/beeper/sync/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Client per Beeper Desktop REST API
class BeeperClient {
  private baseUrl: string;
  private token: string;
  private timeout: number;
  private debug: boolean;

  constructor() {
    this.baseUrl = process.env.BEEPER_API_URL || "http://localhost:23373";
    this.token = process.env.BEEPER_TOKEN || process.env.BEEPER_API_TOKEN || "";
    this.timeout = parseInt(process.env.BEEPER_TIMEOUT || "15000");
    this.debug = process.env.BEEPER_DEBUG === "true";

    if (this.debug) {
      console.log("🔧 BeeperClient configurato per REST API:");
      console.log("  - Base URL:", this.baseUrl);
      console.log("  - Token presente:", !!this.token);
      console.log("  - Timeout:", this.timeout + "ms");
    }
  }

  private async callRestAPI(endpoint: string, options: any = {}) {
    try {
      if (this.debug) console.log(`📡 REST API Call: ${endpoint}`);

      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      // Aggiungi token se disponibile
      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(this.timeout),
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (this.debug)
        console.log(`✅ REST API Response [${endpoint}]:`, Object.keys(data));

      return data;
    } catch (error: any) {
      if (this.debug)
        console.log(`❌ REST API ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log("🚀 Test connessione Beeper Desktop REST API...");

      // Prova prima l'endpoint get-accounts (dovrebbe sempre funzionare)
      try {
        const accounts = await this.callRestAPI("/v0/get-accounts");
        console.log(
          "✅ Beeper connesso - Account trovati:",
          accounts.length || "N/A"
        );
        return { connected: true, accounts };
      } catch (error) {
        console.log("❌ get-accounts fallito:", error.message);
      }

      // Fallback: prova endpoint search-chats senza parametri
      try {
        const chats = await this.callRestAPI("/v0/search-chats?limit=1");
        console.log("✅ Beeper connesso - Endpoint search-chats funziona");
        return { connected: true, method: "search-chats" };
      } catch (error) {
        console.log("❌ search-chats fallito:", error.message);
      }

      // Ultimo tentativo: endpoint base per vedere se risponde
      try {
        const response = await fetch(this.baseUrl, {
          method: "GET",
          headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok || response.status === 404) {
          console.log("✅ Beeper Desktop risponde - Status:", response.status);
          return { connected: true, status: response.status };
        }
      } catch (error) {
        console.log("❌ Beeper Desktop non raggiungibile:", error.message);
      }

      throw new Error("Beeper Desktop non disponibile");
    } catch (error) {
      console.error("Errore test connessione Beeper:", error);
      throw error;
    }
  }

  async getChats() {
    try {
      console.log("📡 Recupero TUTTE le chat da Beeper (senza limiti)...");

      let allChats: any[] = [];
      let hasMore = true;
      let cursor = null;
      let pageCount = 0;

      // Loop per recuperare tutte le pagine
      while (hasMore && pageCount < 50) {
        // Safety limit per evitare loop infiniti
        pageCount++;

        const searchParams = new URLSearchParams({
          limit: "200", // Massimo per pagina
          type: "any",
          inbox: "primary",
        });

        // Aggiungi cursor per pagina successiva
        if (cursor) {
          searchParams.append("cursor", cursor);
        }

        console.log(
          `📄 Caricamento pagina ${pageCount}${
            cursor ? ` (cursor: ${cursor.substring(0, 10)}...)` : ""
          }`
        );

        const response = await this.callRestAPI(
          `/v0/search-chats?${searchParams}`
        );

        if (!response || !response.items) {
          console.log("❌ Nessuna risposta valida da Beeper");
          break;
        }

        // Aggiungi chat di questa pagina
        allChats.push(...response.items);
        console.log(
          `✅ Pagina ${pageCount}: ${response.items.length} chat (Totale: ${allChats.length})`
        );

        // Controlla se ci sono altre pagine
        hasMore = response.hasMore === true;
        cursor = response.oldestCursor || response.nextCursor;

        if (!hasMore) {
          console.log("✅ Raggiunte tutte le conversazioni disponibili");
          break;
        }

        // Pausa tra le richieste per non sovraccaricare Beeper
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(
        `🎯 COMPLETATO: ${allChats.length} conversazioni totali recuperate in ${pageCount} pagine`
      );

      return {
        items: allChats,
        hasMore: false, // Abbiamo tutto
        totalCount: allChats.length,
        pagesLoaded: pageCount,
      };
    } catch (error) {
      console.error("Errore recupero chat complete:", error);

      // Fallback: prova almeno una pagina
      try {
        console.log("🔄 Fallback: recupero singola pagina...");
        const fallback = await this.callRestAPI("/v0/search-chats?limit=200");
        return fallback;
      } catch (fallbackError) {
        console.error("Errore anche nel fallback:", fallbackError);
        throw error;
      }
    }
  }

  // Trasforma i dati Beeper JSON-RPC nel formato per la dashboard
  transformBeeperData(rawData: any) {
    try {
      if (this.debug) console.log("🔄 Trasformazione dati Beeper:", rawData);

      // Gestisce diverse strutture possibili dai metodi JSON-RPC
      let items = [];

      if (Array.isArray(rawData)) {
        items = rawData;
      } else if (rawData.chats) {
        items = rawData.chats;
      } else if (rawData.rooms) {
        items = rawData.rooms;
      } else if (rawData.conversations) {
        items = rawData.conversations;
      } else if (rawData.items) {
        items = rawData.items;
      } else {
        console.warn("Struttura dati Beeper non riconosciuta:", rawData);
        return [];
      }

      if (!Array.isArray(items)) {
        console.warn("Items non è un array:", items);
        return [];
      }

      const transformedChats = items.map((chat: any, index: number) => {
        // Mapping flessibile per JSON-RPC Beeper
        const id =
          chat.id ||
          chat.room_id ||
          chat.chat_id ||
          chat.guid ||
          `chat_${index}`;
        const title =
          chat.title ||
          chat.name ||
          chat.displayName ||
          chat.room_name ||
          chat.topic ||
          `Chat ${index + 1}`;
        const network = this.detectNetwork(chat);
        const lastActivity = chat.last_event_ts
          ? new Date(chat.last_event_ts * 1000).toISOString()
          : chat.lastActivity ||
            chat.last_activity ||
            chat.updated_at ||
            new Date().toISOString();

        return {
          id,
          title,
          network,
          type: this.determineType(chat),
          unreadCount: parseInt(chat.unread_count || chat.unreadCount || "0"),
          participants: this.getParticipantsCount(chat),
          lastActivity,
          lastMessage: this.extractLastMessage(chat),
          avatar: chat.avatar_url || chat.avatar || null,
          rawData: this.debug ? chat : undefined, // Solo per debug
        };
      });

      if (this.debug)
        console.log(`✅ Trasformate ${transformedChats.length} chat`);
      return transformedChats;
    } catch (error) {
      console.error("Errore trasformazione dati Beeper:", error);
      return [];
    }
  }

  private detectNetwork(chat: any): string {
    // Rileva la rete/piattaforma dalla chat
    const service = chat.service || chat.network || chat.bridge_type || "";

    if (service.toLowerCase().includes("whatsapp")) return "WhatsApp";
    if (service.toLowerCase().includes("telegram")) return "Telegram";
    if (service.toLowerCase().includes("instagram")) return "Instagram";
    if (service.toLowerCase().includes("facebook")) return "Facebook";
    if (service.toLowerCase().includes("beeper")) return "Beeper";
    if (service.toLowerCase().includes("matrix")) return "Matrix";

    return "Sconosciuto";
  }

  private determineType(chat: any): "dm" | "group" {
    // Determina se è una chat privata o un gruppo
    if (
      chat.type === "group" ||
      chat.is_group ||
      (chat.participants && chat.participants.length > 2)
    ) {
      return "group";
    }
    return "dm";
  }

  private getParticipantsCount(chat: any): number {
    if (chat.participants) {
      return Array.isArray(chat.participants) ? chat.participants.length : 1;
    }
    if (chat.member_count) return parseInt(chat.member_count);
    return 1;
  }

  private extractLastMessage(chat: any): string {
    // Estrae l'ultimo messaggio dalla chat
    if (chat.lastMessage?.text) return chat.lastMessage.text;
    if (chat.last_message?.body) return chat.last_message.body;
    if (chat.preview) return chat.preview;

    return "Nessun messaggio recente";
  }
}

// Handler per GET /api/beeper/sync
export async function GET() {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    console.log("🔄 Avviando sincronizzazione Beeper...");
    const startTime = Date.now();

    const client = new BeeperClient();

    // Test della connessione
    try {
      const connectionTest = await client.testConnection();
      console.log("✅ Connessione Beeper OK:", connectionTest);

      // Se la connessione funziona, recupera le chat reali
      const rawChats = await client.getChats();
      console.log("📨 Chat grezze ricevute:", rawChats);

      const conversations = client.transformBeeperData(rawChats);
      console.log(`💬 Conversazioni processate: ${conversations.length}`);

      const syncTime = Date.now() - startTime;
      console.log(`⚡ Sincronizzazione completata in ${syncTime}ms`);

      return NextResponse.json({
        success: true,
        conversations,
        message: `${conversations.length} conversazioni sincronizzate con successo`,
        performance: {
          syncTime,
          conversationCount: conversations.length,
          timestamp: new Date().toISOString(),
          source: "beeper_api",
        },
      });
    } catch (error) {
      console.error("❌ Test connessione Beeper fallito:", error);

      // SEMPRE usa dati mock se Beeper non è disponibile
      console.log("📝 Usando dati mock per sviluppo...");
      const mockConversations = getMockConversations();
      const syncTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        conversations: mockConversations,
        message: `Beeper non disponibile - Usando ${mockConversations.length} conversazioni mock per sviluppo`,
        performance: {
          syncTime,
          conversationCount: mockConversations.length,
          timestamp: new Date().toISOString(),
          source: "mock_data",
        },
        warning: "Beeper API non raggiungibile - dati mock in uso",
      });
    }
  } catch (error: any) {
    console.error("❌ Errore sincronizzazione Beeper:", error);

    // SEMPRE restituire dati mock in caso di errore
    const mockConversations = getMockConversations();
    const syncTime = Date.now() - startTime;

    return NextResponse.json({
      success: true, // Manteniamo success: true perché i mock funzionano
      conversations: mockConversations,
      message: `Errore Beeper - Usando ${mockConversations.length} conversazioni mock`,
      performance: {
        syncTime,
        conversationCount: mockConversations.length,
        timestamp: new Date().toISOString(),
        source: "mock_fallback",
      },
      warning: `Beeper API Error: ${error.message}`,
      debug: {
        error: error.toString(),
        // Non includiamo stack in produzione
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      },
    });
  }
}

// Dati mock per sviluppo e testing
function getMockConversations() {
  return [
    {
      id: "!ojt0tXlnDqkk4rewdhXW:beeper.local",
      title: "Organizzazione tornei ed eventi",
      network: "WhatsApp",
      type: "group",
      unreadCount: 3,
      participants: 45,
      lastActivity: "2025-09-18T12:42:27.000Z",
      lastMessage: "Dobbiamo organizzare il torneo di Magic del mese prossimo",
      avatar: null,
    },
    {
      id: "!abc123xyz789:beeper.local",
      title: "Il Covo del Nerd - Viterbo",
      network: "WhatsApp",
      type: "group",
      unreadCount: 1,
      participants: 12,
      lastActivity: "2025-09-18T11:30:15.000Z",
      lastMessage: "Nuovo arrivo: Nintendo Switch OLED disponibili",
      avatar: null,
    },
    {
      id: "@mario_rossi:telegram",
      title: "Mario Rossi",
      network: "Telegram",
      type: "dm",
      unreadCount: 2,
      participants: 1,
      lastActivity: "2025-09-18T10:15:45.000Z",
      lastMessage: "Salve, vorrei info sulla disponibilità PlayStation 5",
      avatar: null,
    },
    {
      id: "gamer_pro_insta",
      title: "GamerPro",
      network: "Instagram",
      type: "dm",
      unreadCount: 0,
      participants: 1,
      lastActivity: "2025-09-18T09:22:33.000Z",
      lastMessage: "Perfetto, grazie per l'assistenza!",
      avatar: null,
    },
    {
      id: "staff_covo_vendetta",
      title: "Staff covo la vendetta",
      network: "Beeper",
      type: "group",
      unreadCount: 0,
      participants: 8,
      lastActivity: "2025-09-18T08:45:12.000Z",
      lastMessage: "Riunione staff oggi pomeriggio alle 15:00",
      avatar: null,
    },
  ];
}
