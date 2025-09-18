// src/lib/beeper/client.ts
// Client Beeper usando le REST API corrette (NON MCP)
// Basato sulla documentazione ufficiale Beeper Desktop API

import {
  BeeperConnectionStatus,
  BeeperListChatsOptions,
  BeeperSendMessageOptions,
  BeeperError,
  BeeperConnectionError,
  BeeperTimeoutError,
} from "@/types/beeper";

// Tipi per le REST API Beeper
interface BeeperChat {
  chatID: string;
  name: string;
  network: string;
  type: "single" | "group";
  lastMessage?: {
    text: string;
    timestamp: number;
    sender: string;
  };
  unreadCount?: number;
  participants?: string[];
}

interface BeeperMessage {
  messageID: string;
  chatID: string;
  text: string;
  sender: string;
  timestamp: number;
  attachments?: any[];
}

class BeeperClient {
  private baseUrl: string;
  private timeout: number;
  private token: string | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.baseUrl = process.env.BEEPER_API_URL || "http://localhost:23373";
    this.timeout = parseInt(process.env.BEEPER_TIMEOUT || "10000");
    this.token = process.env.BEEPER_API_TOKEN || null;
    this.isInitialized = false;
  }

  /**
   * Test connessione alle REST API Beeper
   */
  private async testRestAPIConnection(): Promise<boolean> {
    try {
      console.log("🔍 Testing Beeper REST API...");

      if (!this.token) {
        console.warn("⚠️ Nessun token Beeper configurato");
        return false;
      }

      // Test con endpoint /v0/get-accounts (più leggero)
      const response = await fetch(`${this.baseUrl}/v0/get-accounts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });

      console.log("🧪 REST API test status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(
          "✅ Beeper REST API disponibile, accounts:",
          data?.length || "N/A"
        );
        return true;
      } else {
        console.warn(
          "⚠️ REST API error:",
          response.status,
          response.statusText
        );
        return false;
      }
    } catch (error) {
      console.warn("⚠️ REST API test fallito:", error.message);
      return false;
    }
  }

  /**
   * Inizializza connessione REST API (NON MCP)
   */
  async initialize(): Promise<void> {
    try {
      console.log("🚀 Inizializzando Beeper REST API...");

      const isConnected = await this.testRestAPIConnection();

      if (isConnected) {
        this.isInitialized = true;
        console.log("✅ Beeper REST API inizializzato");
      } else {
        this.isInitialized = false;
        console.log("❌ Beeper REST API non disponibile");
        throw new BeeperConnectionError(
          "REST API non disponibile",
          new Error("Connection test failed")
        );
      }
    } catch (error) {
      console.error("❌ Errore inizializzazione Beeper:", error);
      this.isInitialized = false;
      throw new BeeperConnectionError(
        "Impossibile inizializzare Beeper REST API",
        error
      );
    }
  }

  /**
   * Recupera chat usando /v0/search-chats
   */
  async listChats(options: BeeperListChatsOptions = {}): Promise<BeeperChat[]> {
    try {
      console.log("📋 Recuperando chat via Beeper REST API...");

      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.token) {
        throw new BeeperError("Token mancante", "NO_TOKEN");
      }

      // Costruisci parametri query
      const params = new URLSearchParams();

      if (options.limit) {
        params.append("limit", Math.min(options.limit, 200).toString()); // Max 200 per API
      } else {
        params.append("limit", "50"); // Default
      }

      if (options.onlyUnread) {
        params.append("unreadOnly", "true");
      }

      // Aggiungi filtro per tipo se specificato
      if (options.chatType) {
        params.append("type", options.chatType);
      }

      const url = `${this.baseUrl}/v0/search-chats?${params}`;
      console.log("🔗 Chiamando:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/json",
          "User-Agent": "Il Covo del Nerd CRM/1.0.0",
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      console.log("📨 Response status:", response.status);
      console.log(
        "📨 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ API Error:",
          response.status,
          response.statusText,
          errorText
        );
        throw new BeeperError(
          `HTTP ${response.status}: ${response.statusText}`,
          "HTTP_ERROR"
        );
      }

      const data = await response.json();
      console.log("📊 Raw API response type:", typeof data);
      console.log("📊 Raw API response keys:", Object.keys(data || {}));

      // La risposta potrebbe essere un array o un oggetto con diverse proprietà
      let chats: BeeperChat[] = [];

      if (Array.isArray(data)) {
        chats = data;
      } else if (data && Array.isArray(data.items)) {
        // CORREZIONE: Beeper usa 'items' per l'array delle chat
        chats = data.items;
      } else if (data && Array.isArray(data.chats)) {
        chats = data.chats;
      } else if (data && Array.isArray(data.results)) {
        chats = data.results;
      } else if (data && typeof data === "object") {
        // Log per debug della struttura
        console.log(
          "📊 Unexpected response structure, keys:",
          Object.keys(data)
        );
        chats = [];
      }

      console.log(`✅ Recuperate ${chats.length} chat da Beeper REST API`);

      // Log del primo elemento per debug
      if (chats.length > 0) {
        console.log(
          "📋 Sample chat structure:",
          JSON.stringify(chats[0], null, 2)
        );
      }

      return chats;
    } catch (error) {
      console.error("❌ Errore listChats:", error);

      if (error.name === "AbortError") {
        throw new BeeperTimeoutError(`Timeout dopo ${this.timeout}ms`);
      }

      throw new BeeperError(
        "Errore durante il recupero delle chat",
        "FETCH_CHATS_ERROR",
        error
      );
    }
  }

  /**
   * Recupera messaggi di una chat usando /v0/search-messages
   */
  async getChatMessages(
    chatId: string,
    limit: number = 50
  ): Promise<BeeperMessage[]> {
    try {
      console.log(`📨 Recuperando messaggi per chat: ${chatId}`);

      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.token) {
        throw new BeeperError("Token mancante", "NO_TOKEN");
      }

      const params = new URLSearchParams({
        chatID: chatId,
        limit: Math.min(limit, 100).toString(), // Limite ragionevole
      });

      const response = await fetch(
        `${this.baseUrl}/v0/search-messages?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(this.timeout),
        }
      );

      if (!response.ok) {
        throw new BeeperError(
          `HTTP ${response.status}: ${response.statusText}`,
          "HTTP_ERROR"
        );
      }

      const data = await response.json();
      const messages: BeeperMessage[] = Array.isArray(data)
        ? data
        : data.messages || [];

      console.log(
        `✅ Recuperati ${messages.length} messaggi per chat ${chatId}`
      );
      return messages;
    } catch (error) {
      console.error(`❌ Errore getChatMessages per ${chatId}:`, error);
      throw new BeeperError(
        "Errore durante il recupero dei messaggi",
        "FETCH_MESSAGES_ERROR",
        error
      );
    }
  }

  /**
   * Invia messaggio usando /v0/send-message
   */
  async sendMessage(options: BeeperSendMessageOptions): Promise<boolean> {
    try {
      console.log(`📤 Inviando messaggio a chat: ${options.chatId}`);

      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.token) {
        throw new BeeperError("Token mancante", "NO_TOKEN");
      }

      const payload = {
        chatID: options.chatId,
        text: options.text,
        ...(options.replyTo && { replyTo: options.replyTo }),
      };

      const response = await fetch(`${this.baseUrl}/v0/send-message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Send message error:", response.status, errorText);
        throw new BeeperError(
          `HTTP ${response.status}: ${response.statusText}`,
          "SEND_ERROR"
        );
      }

      console.log("✅ Messaggio inviato con successo");
      return true;
    } catch (error) {
      console.error("❌ Errore sendMessage:", error);
      throw new BeeperError(
        "Errore durante l'invio del messaggio",
        "SEND_MESSAGE_ERROR",
        error
      );
    }
  }

  /**
   * Recupera tutti gli account connessi
   */
  async getAccounts(): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.token) {
        throw new BeeperError("Token mancante", "NO_TOKEN");
      }

      const response = await fetch(`${this.baseUrl}/v0/get-accounts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new BeeperError(
          `HTTP ${response.status}: ${response.statusText}`,
          "HTTP_ERROR"
        );
      }

      const accounts = await response.json();
      console.log("✅ Account recuperati:", accounts.length);
      return Array.isArray(accounts) ? accounts : [];
    } catch (error) {
      console.error("❌ Errore getAccounts:", error);
      return [];
    }
  }

  /**
   * Stato della connessione
   */
  async getConnectionStatus(): Promise<BeeperConnectionStatus> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Test rapido delle API per verificare lo stato
      const accounts = await this.getAccounts();

      return {
        isConnected: this.isInitialized,
        isInitialized: this.isInitialized,
        lastSync: new Date(),
        apiUrl: this.baseUrl,
        version: "rest-api",
        supportedServices: this.isInitialized
          ? ["whatsapp", "telegram", "instagram", "facebook", "email", "sms"]
          : [],
        activeChats: 0,
        accountsConnected: accounts.length,
      };
    } catch (error) {
      console.error("❌ Errore getConnectionStatus:", error);
      return {
        isConnected: false,
        isInitialized: false,
        error: error.message,
        supportedServices: [],
        activeChats: 0,
        accountsConnected: 0,
      };
    }
  }

  // Metodi di compatibilità (non usati con REST API)
  async listAvailableTools(): Promise<any[]> {
    return []; // REST API non usa "tools"
  }

  async callTool(toolName: string, args: any = {}): Promise<any> {
    return null; // REST API non usa "tools"
  }
}

export default BeeperClient;
