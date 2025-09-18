// src/lib/beeper/client.ts
// Client Beeper MCP (Model Context Protocol) per CRM Il Covo del Nerd
// Basato sul protocollo JSON-RPC che Beeper Desktop effettivamente usa

import { 
  BeeperConnectionStatus, 
  BeeperListChatsOptions, 
  BeeperSendMessageOptions,
  BeeperError,
  BeeperConnectionError,
  BeeperTimeoutError
} from '@/types/beeper';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id?: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class BeeperClient {
  private baseUrl: string;
  private timeout: number;
  private token: string | null = null;
  private requestId: number = 1;
  private isInitialized: boolean = false;
  private availableTools: string[] = [];
  private sessionId: string | null = null; // Per gestire Session ID MCP

  constructor() {
    this.baseUrl = process.env.BEEPER_API_URL || 'http://localhost:23373';
    this.timeout = parseInt(process.env.BEEPER_TIMEOUT || '15000');
    this.token = process.env.BEEPER_API_TOKEN || null;
    this.sessionId = null; // Aggiunto per gestire Session ID
  }

  /**
   * Inizializza la connessione MCP con Beeper Desktop
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Inizializzando connessione Beeper MCP...');
      
      // Prima chiama initialize per ottenere Session ID
      const initResponse = await this.sendMCPRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: { listChanged: true },
          sampling: {},
        },
        clientInfo: {
          name: 'Il Covo del Nerd CRM',
          version: '1.0.0'
        }
      });

      if (initResponse.result) {
        console.log('✅ MCP initialize risposta:', initResponse.result);
        
        // Estrai sessionId se presente
        if (initResponse.result.sessionId) {
          this.sessionId = initResponse.result.sessionId;
          console.log('🔑 Session ID ottenuto:', this.sessionId);
        }
        
        // Ora ottieni la lista dei tool disponibili
        const tools = await this.listAvailableTools();
        this.availableTools = tools.map(t => t.name || t);
        console.log('🔧 Tool disponibili:', this.availableTools);
        
        if (this.availableTools.length === 0) {
          throw new Error('Nessun tool disponibile da Beeper MCP');
        }
        
        this.isInitialized = true;
        console.log('✅ Beeper MCP inizializzato con', this.availableTools.length, 'tools');
        
      } else if (initResponse.error) {
        throw new Error(`Errore initialize: ${initResponse.error.message}`);
      } else {
        throw new Error('Risposta initialize vuota');
      }
      
    } catch (error) {
      console.error('❌ Errore inizializzazione Beeper MCP:', error);
      throw new BeeperConnectionError('Impossibile inizializzare Beeper MCP', error);
    }
  }

  /**
   * Ottiene la lista dei tool disponibili
   */
  async listAvailableTools(): Promise<any[]> {
    try {
      console.log('📋 Recuperando lista tool MCP...');
      
      const response = await this.sendMCPRequest('tools/list', {});
      
      if (response.result?.tools) {
        return response.result.tools;
      } else if (response.error) {
        throw new Error(`Errore MCP: ${response.error.message}`);
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Errore recupero tool MCP:', error);
      throw new BeeperError('Errore durante il recupero dei tool', 'FETCH_TOOLS_ERROR', error);
    }
  }

  /**
   * Verifica lo stato della connessione
   */
  async getConnectionStatus(): Promise<BeeperConnectionStatus> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return {
        isConnected: true,
        isInitialized: true,
        lastSync: new Date(),
        apiUrl: this.baseUrl,
        version: 'mcp-jsonrpc',
        supportedServices: ['whatsapp', 'telegram', 'instagram', 'facebook', 'email'], // Inferiti
        activeChats: 0
      };
      
    } catch (error) {
      console.error('❌ Errore verifica connessione:', error);
      return {
        isConnected: false,
        isInitialized: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        supportedServices: [],
        activeChats: 0
      };
    }
  }

  /**
   * Lista le conversazioni usando i tool MCP disponibili
   */
  async listChats(options: BeeperListChatsOptions = {}): Promise<any[]> {
    try {
      console.log('📋 Recuperando chat via tool MCP...');

      if (!this.isInitialized) {
        await this.initialize();
      }

      // Prova diversi tool che potrebbero restituire chat
      const possibleChatTools = [
        'get_chats',
        'list_chats', 
        'get_conversations',
        'list_conversations',
        'get_rooms',
        'list_rooms'
      ];

      for (const toolName of possibleChatTools) {
        if (this.availableTools.includes(toolName)) {
          try {
            console.log(`🔧 Provando tool: ${toolName}`);
            
            const response = await this.callTool(toolName, {
              limit: options.limit || 50,
              only_unread: options.onlyUnread || false
            });
            
            if (response && this.isValidChatResponse(response)) {
              const chats = this.extractChatsFromResponse(response);
              console.log(`✅ Recuperate ${chats.length} chat usando tool ${toolName}`);
              return chats;
            }
            
          } catch (toolError) {
            console.warn(`⚠️ Tool ${toolName} fallito:`, toolError.message);
            continue; // Prova il prossimo tool
          }
        }
      }

      console.warn('⚠️ Nessun tool per chat funzionante trovato');
      return [];

    } catch (error) {
      console.error('❌ Errore recupero chat:', error);
      throw new BeeperError('Errore durante il recupero delle chat', 'FETCH_CHATS_ERROR', error);
    }
  }

  /**
   * Chiama un tool MCP specifico
   */
  async callTool(toolName: string, args: any = {}): Promise<any> {
    try {
      const response = await this.sendMCPRequest('tools/call', {
        name: toolName,
        arguments: args
      });

      if (response.result) {
        return response.result;
      } else if (response.error) {
        throw new Error(`Tool ${toolName} errore: ${response.error.message}`);
      }

      return null;

    } catch (error) {
      console.error(`❌ Errore chiamata tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Recupera messaggi di una chat specifica
   */
  async getChatMessages(chatId: string, limit: number = 50): Promise<any[]> {
    try {
      const possibleMessageTools = [
        'get_messages',
        'list_messages',
        'get_chat_messages',
        'fetch_messages'
      ];

      for (const toolName of possibleMessageTools) {
        if (this.availableTools.includes(toolName)) {
          try {
            const response = await this.callTool(toolName, {
              chat_id: chatId,
              room_id: chatId,
              limit: limit
            });

            if (response && this.isValidMessageResponse(response)) {
              const messages = this.extractMessagesFromResponse(response);
              console.log(`✅ Recuperati ${messages.length} messaggi per chat ${chatId}`);
              return messages;
            }

          } catch (toolError) {
            console.warn(`⚠️ Tool messaggi ${toolName} fallito:`, toolError.message);
            continue;
          }
        }
      }

      return [];

    } catch (error) {
      console.error(`❌ Errore recupero messaggi chat ${chatId}:`, error);
      throw new BeeperError('Errore durante il recupero dei messaggi', 'FETCH_MESSAGES_ERROR', error);
    }
  }

  /**
   * Invia un messaggio
   */
  async sendMessage(options: BeeperSendMessageOptions): Promise<boolean> {
    try {
      const possibleSendTools = [
        'send_message',
        'send_text',
        'post_message'
      ];

      for (const toolName of possibleSendTools) {
        if (this.availableTools.includes(toolName)) {
          try {
            const response = await this.callTool(toolName, {
              chat_id: options.chatId,
              room_id: options.chatId,
              text: options.text,
              content: options.text,
              message: options.text,
              reply_to: options.replyTo
            });

            if (response) {
              console.log(`✅ Messaggio inviato usando tool ${toolName}`);
              return true;
            }

          } catch (toolError) {
            console.warn(`⚠️ Tool invio ${toolName} fallito:`, toolError.message);
            continue;
          }
        }
      }

      return false;

    } catch (error) {
      console.error(`❌ Errore invio messaggio:`, error);
      throw new BeeperError('Errore durante l\'invio del messaggio', 'SEND_MESSAGE_ERROR', error);
    }
  }

  /**
   * Invia una richiesta MCP JSON-RPC
   */
  private async sendMCPRequest(method: string, params: any = {}): Promise<MCPResponse> {
    const requestId = this.requestId++;
    
      // Aggiungi sessionId se disponibile (richiesto dopo initialize)
      if (this.sessionId && method !== 'initialize') {
        mcpRequest.params = { ...mcpRequest.params, sessionId: this.sessionId };
      }

    console.log(`🔄 MCP Request [${requestId}]:`, { method, params });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Aggiungi token se disponibile
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseUrl}/v0/mcp`, {
        method: 'POST',
        headers,
        body: JSON.stringify(mcpRequest),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const mcpResponse: MCPResponse = await response.json();
      console.log(`✅ MCP Response [${requestId}]:`, mcpResponse);

      return mcpResponse;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new BeeperTimeoutError(`MCP timeout dopo ${this.timeout}ms`);
      }
      
      console.error(`❌ MCP Request [${requestId}] fallito:`, error);
      throw error;
    }
  }

  /**
   * Verifica se una risposta contiene chat valide
   */
  private isValidChatResponse(response: any): boolean {
    return response && (
      Array.isArray(response) ||
      Array.isArray(response.chats) ||
      Array.isArray(response.conversations) ||
      Array.isArray(response.rooms) ||
      (response.content && (
        Array.isArray(response.content) ||
        Array.isArray(response.content.chats)
      ))
    );
  }

  /**
   * Estrae array di chat da diverse strutture di risposta
   */
  private extractChatsFromResponse(response: any): any[] {
    // Prova diverse strutture possibili
    if (Array.isArray(response)) return response;
    if (response.chats && Array.isArray(response.chats)) return response.chats;
    if (response.conversations && Array.isArray(response.conversations)) return response.conversations;
    if (response.rooms && Array.isArray(response.rooms)) return response.rooms;
    if (response.content) {
      if (Array.isArray(response.content)) return response.content;
      if (response.content.chats && Array.isArray(response.content.chats)) return response.content.chats;
    }
    
    return [];
  }

  /**
   * Verifica se una risposta contiene messaggi validi
   */
  private isValidMessageResponse(response: any): boolean {
    return response && (
      Array.isArray(response) ||
      Array.isArray(response.messages) ||
      (response.content && Array.isArray(response.content))
    );
  }

  /**
   * Estrae array di messaggi da diverse strutture di risposta
   */
  private extractMessagesFromResponse(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (response.messages && Array.isArray(response.messages)) return response.messages;
    if (response.content && Array.isArray(response.content)) return response.content;
    
    return [];
  }
}

export default BeeperClient;