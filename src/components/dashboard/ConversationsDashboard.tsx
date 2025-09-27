// src/components/dashboard/ConversationsDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  User,
  Tag,
  Clock,
  MapPin,
  Package,
  Plus,
  Edit3,
  Star,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// Tipi per i dati
interface BeeperConversation {
  id: string;
  title: string;
  network: string;
  type: "dm" | "group";
  unreadCount: number;
  participants: number;
  lastActivity: string;
  lastMessage?: string;
  avatar?: string;
}

interface ConversationMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: string;
  isFromOperator: boolean;
  platform: string;
  type: string;
}

interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  orders?: number;
  lastOrder?: string;
}

interface ConversationNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
}

interface ConversationTag {
  id: string;
  name: string;
  color: string;
  category: string;
}

export default function ConversationsDashboard() {
  const [conversations, setConversations] = useState<BeeperConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<BeeperConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<string>("");

  // Stati per i messaggi
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Altri stati CRM
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [tags, setTags] = useState<ConversationTag[]>([]);

  // Funzione per le icone network migliorate
  const getNetworkIcon = (network: string) => {
    switch (network?.toLowerCase()) {
      case "whatsapp":
        return (
          <span className="inline-flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              className="fill-green-500"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.085" />
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </span>
        );
      case "instagram":
        return (
          <span className="inline-flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              className="fill-pink-500"
            >
              <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
            </svg>
            <span className="hidden sm:inline">Instagram</span>
          </span>
        );
      case "telegram":
        return (
          <span className="inline-flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              className="fill-blue-500"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            <span className="hidden sm:inline">Telegram</span>
          </span>
        );
      case "beeper":
      case "matrix":
        return (
          <span className="inline-flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              className="fill-purple-500"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4m0 14v4m11-11h-4m-14 0H1m17.66-6.34l-2.83 2.83M6.34 17.66l-2.83 2.83M19.07 17.66l-2.83-2.83M6.34 6.34L3.51 3.51" />
            </svg>
            <span className="hidden sm:inline">Beeper</span>
          </span>
        );
      case "email":
        return (
          <span className="inline-flex items-center gap-1">
            <Mail size={12} className="text-gray-500" />
            <span className="hidden sm:inline">Email</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1">
            <MessageSquare size={12} className="text-gray-500" />
            <span className="hidden sm:inline">Chat</span>
          </span>
        );
    }
  };

  // Carica le conversazioni reali da Beeper
  useEffect(() => {
    loadConversations();

    // Auto-refresh ogni 30 secondi
    const refreshInterval = setInterval(() => {
      console.log("🔄 Auto-refresh conversazioni...");
      loadConversations();
    }, 30000); // 30 secondi

    return () => clearInterval(refreshInterval);
  }, []);

  // Carica i messaggi quando cambia la conversazione selezionata
  useEffect(() => {
    async function loadMessages() {
      if (!selectedConversation) {
        setMessages([]);
        setLoadingMessages(false);
        return;
      }

      console.log("📨 Caricamento messaggi per:", selectedConversation.id);
      setLoadingMessages(true);
      setMessagesError(null);

      try {
        const encodedId = encodeURIComponent(selectedConversation.id);
        const response = await fetch(
          `/api/conversations/${encodedId}/messages`
        );

        console.log("📊 Response status messaggi:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("📦 Dati messaggi ricevuti:", {
          success: data.success,
          count: data.messages?.length || 0,
          conversationId: data.conversationId,
        });

        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
          console.log(`✅ Messaggi caricati: ${data.messages.length}`);
        } else {
          console.warn("⚠️ Formato risposta non valido:", data);
          setMessages([]);
          setMessagesError("Formato risposta non valido");
        }
      } catch (error) {
        console.error("❌ Errore caricamento messaggi:", error);
        setMessagesError(
          error instanceof Error ? error.message : "Errore sconosciuto"
        );
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages();
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log("🔄 Caricamento conversazioni...");

      const response = await fetch("/api/beeper/sync");
      const data = await response.json();

      console.log("📊 Risposta API:", data);

      if (data.success && data.conversations) {
        setConversations(data.conversations);
        console.log(`✅ Caricate ${data.conversations.length} conversazioni`);

        // Seleziona automaticamente la prima conversazione
        if (data.conversations.length > 0) {
          setSelectedConversation(data.conversations[0]);
          loadConversationDetails(data.conversations[0].id);
        }

        // Mostra messaggio se sono dati mock
        if (data.warning) {
          console.warn("⚠️ " + data.warning);
        }
      } else {
        console.error("❌ Errore nel formato risposta API");
        setConversations([]);
      }
    } catch (error) {
      console.error("❌ Errore caricamento conversazioni:", error);
      // In caso di errore totale, usa conversazioni vuote
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetails = async (conversationId: string) => {
    try {
      // Carica dettagli conversazione, note, tag
      const [customerRes, notesRes, tagsRes] = await Promise.all([
        fetch(`/api/conversations/${conversationId}/customer`),
        fetch(`/api/conversations/${conversationId}/notes`),
        fetch(`/api/conversations/${conversationId}/tags`),
      ]);

      const customerData = await customerRes.json();
      const notesData = await notesRes.json();
      const tagsData = await tagsRes.json();

      setCustomerInfo(customerData.customer || null);
      setNotes(notesData.notes || []);
      setTags(tagsData.tags || []);
    } catch (error) {
      console.error("Errore caricamento dettagli:", error);
    }
  };

  const handleConversationSelect = (conversation: BeeperConversation) => {
    setSelectedConversation(conversation);
    loadConversationDetails(conversation.id);
  };

  const retryLoadMessages = () => {
    if (selectedConversation) {
      setMessagesError(null);
      // Forza re-trigger del useEffect
      const temp = selectedConversation;
      setSelectedConversation(null);
      setTimeout(() => setSelectedConversation(temp), 100);
    }
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffHours < 1) return "Ora";
    if (diffHours < 24) return `${Math.floor(diffHours)}h fa`;
    if (diffHours < 48) return "Ieri";
    return date.toLocaleDateString("it-IT");
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.network.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D70B3] mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento conversazioni...</p>
          {loadingProgress && (
            <p className="mt-2 text-sm text-gray-500">{loadingProgress}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* COLONNA SINISTRA: Lista Conversazioni */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header con ricerca */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Cerca conversazioni..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1D70B3] focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-sm rounded-md hover:bg-gray-200">
              <Filter size={14} />
              Filtri
            </button>
            <span className="text-sm text-gray-500">
              {filteredConversations.length} conversazioni
            </span>
          </div>
        </div>

        {/* Lista conversazioni */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationSelect(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation?.id === conversation.id
                  ? "bg-blue-50 border-l-4 border-l-[#1D70B3]"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {conversation.title.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 truncate">
                      {conversation.title}
                    </span>
                    <span className="text-xs">
                      {getNetworkIcon(conversation.network)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-2">
                    {conversation.lastMessage || "Nessun messaggio recente"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {formatLastActivity(conversation.lastActivity)}
                    </div>

                    <div className="flex items-center gap-2">
                      {conversation.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                      {conversation.type === "group" && (
                        <span className="text-xs text-gray-500">
                          👥 {conversation.participants}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nessuna conversazione trovata</p>
            </div>
          )}
        </div>
      </div>

      {/* COLONNA CENTRO: Dettagli Conversazione */}
      <div className="flex-1 bg-white flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header conversazione */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedConversation.title.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedConversation.title}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {getNetworkIcon(selectedConversation.network)}
                      <span>•</span>
                      <span>
                        {selectedConversation.type === "group"
                          ? "Gruppo"
                          : "Chat privata"}
                      </span>
                      {selectedConversation.type === "group" && (
                        <>
                          <span>•</span>
                          <span>
                            {selectedConversation.participants} partecipanti
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-200 rounded-md">
                    <Phone size={18} />
                  </button>
                  <button className="p-2 hover:bg-gray-200 rounded-md">
                    <Mail size={18} />
                  </button>
                  <button
                    onClick={retryLoadMessages}
                    className="p-2 hover:bg-gray-200 rounded-md"
                    title="Ricarica messaggi"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button className="p-2 hover:bg-gray-200 rounded-md">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Area messaggi con UI professionale */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-3 text-gray-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D70B3]"></div>
                    <span>Caricamento messaggi...</span>
                  </div>
                </div>
              ) : messagesError ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <AlertCircle
                      className="mx-auto mb-2 text-red-500"
                      size={32}
                    />
                    <div className="text-red-600 font-medium mb-2">
                      ⚠️ Errore caricamento messaggi
                    </div>
                    <div className="text-sm text-gray-500 mb-3">
                      {messagesError}
                    </div>
                    <button
                      onClick={retryLoadMessages}
                      className="px-3 py-2 bg-[#1D70B3] text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw size={14} />
                      Riprova
                    </button>
                  </div>
                </div>
              ) : messages.length > 0 ? (
                <div className="p-4 space-y-4">
                  {/* Header messaggi con info */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 bg-white rounded-lg px-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MessageSquare size={16} />
                      <span>{messages.length} messaggi</span>
                      {selectedConversation && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {getNetworkIcon(selectedConversation.network)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Ultimo aggiornamento:{" "}
                      {new Date().toLocaleTimeString("it-IT")}
                    </div>
                  </div>

                  {/* Lista messaggi */}
                  <div className="space-y-4">
                    {messages.map(
                      (message: ConversationMessage, index: number) => {
                        const isOperator = message.isFromOperator;
                        const showAvatar =
                          !isOperator &&
                          (index === 0 ||
                            !messages[index - 1]?.isFromOperator ===
                              isOperator);

                        return (
                          <div
                            key={message.id}
                            className={`flex items-end gap-3 ${
                              isOperator ? "justify-end" : "justify-start"
                            }`}
                          >
                            {/* Avatar cliente (solo sinistra) */}
                            {!isOperator && (
                              <div className="flex-shrink-0 w-8 h-8">
                                {showAvatar ? (
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                    {message.sender.charAt(0).toUpperCase()}
                                  </div>
                                ) : (
                                  <div className="w-8 h-8"></div>
                                )}
                              </div>
                            )}

                            {/* Bubble messaggio */}
                            <div
                              className={`max-w-[70%] ${
                                isOperator ? "mr-3" : ""
                              }`}
                            >
                              {/* Nome sender (solo per clienti e se è il primo messaggio di una serie) */}
                              {!isOperator && showAvatar && (
                                <div className="mb-1 px-3 text-xs font-medium text-gray-600">
                                  {message.sender}
                                </div>
                              )}

                              <div
                                className={`rounded-2xl px-4 py-3 ${
                                  isOperator
                                    ? "bg-[#1D70B3] text-white shadow-sm rounded-br-md"
                                    : "bg-white text-gray-900 border-2 border-gray-300 rounded-bl-md"
                                }`}
                              >
                                {/* Contenuto messaggio */}
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {message.content}
                                </p>

                                {/* Info messaggio */}
                                <div
                                  className={`flex items-center justify-between gap-2 mt-2 pt-1 ${
                                    isOperator
                                      ? "border-t border-blue-500/30"
                                      : "border-t border-gray-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {/* Indicatore canale */}
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                        isOperator
                                          ? "bg-blue-500/20 text-blue-100 border border-blue-400/30"
                                          : "bg-gray-50 text-gray-600 border border-gray-200"
                                      }`}
                                    >
                                      {getNetworkIcon(message.platform)}
                                    </span>

                                    {/* Stato messaggio (solo operatore) */}
                                    {isOperator && (
                                      <span className="text-xs text-blue-200 flex items-center gap-1">
                                        <svg
                                          width="12"
                                          height="12"
                                          viewBox="0 0 12 12"
                                          className="fill-current"
                                        >
                                          <path d="M10.5 3.5L4.5 9.5L1.5 6.5" />
                                        </svg>
                                        Inviato
                                      </span>
                                    )}
                                  </div>

                                  {/* Timestamp */}
                                  <span
                                    className={`text-xs font-medium ${
                                      isOperator
                                        ? "text-blue-100"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {new Date(
                                      message.timestamp
                                    ).toLocaleTimeString("it-IT", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Avatar operatore (solo destra) */}
                            {isOperator && (
                              <div className="flex-shrink-0 w-8 h-8">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#1D70B3] to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  CRM
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}

                    {/* Indicatore fine conversazione */}
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-200 text-gray-500 text-xs rounded-full">
                        <Clock size={12} />
                        Fine conversazione
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 p-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nessun messaggio
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {selectedConversation
                        ? "I messaggi di questa conversazione appariranno qui"
                        : "Seleziona una conversazione per visualizzare i messaggi"}
                    </p>
                    {selectedConversation && (
                      <div className="space-y-3">
                        <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded font-mono">
                          Chat ID: {selectedConversation.id}
                        </div>
                        <button
                          onClick={retryLoadMessages}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D70B3] text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          <RefreshCw size={14} />
                          Ricarica messaggi
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Barra invio messaggio migliorata */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex items-end gap-3">
                {/* Area input messaggio */}
                <div className="flex-1">
                  <textarea
                    placeholder={`Rispondi a ${
                      selectedConversation?.title || "cliente"
                    }...`}
                    rows={1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1D70B3] focus:border-transparent resize-none text-sm"
                    onInput={(e) => {
                      const textarea = e.target as HTMLTextAreaElement;
                      textarea.style.height = "auto";
                      textarea.style.height =
                        Math.min(textarea.scrollHeight, 120) + "px";
                    }}
                  />
                </div>

                {/* Pulsanti azione */}
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                    <Plus size={20} />
                  </button>
                  <button className="px-4 py-2 bg-[#1D70B3] text-white rounded-2xl hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      className="fill-current"
                    >
                      <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                    </svg>
                    Invia
                  </button>
                </div>
              </div>

              {/* Info typing e stato */}
              <div className="flex items-center justify-between mt-2 px-2">
                <div className="text-xs text-gray-500">
                  {selectedConversation && (
                    <span>
                      {getNetworkIcon(selectedConversation.network)} •
                      {selectedConversation.type === "group"
                        ? " Gruppo"
                        : " Chat privata"}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">Press Enter to send</div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-medium mb-2">
                Seleziona una conversazione
              </p>
              <p>
                Scegli una conversazione dalla lista per visualizzarne i
                dettagli
              </p>
            </div>
          </div>
        )}
      </div>

      {/* COLONNA DESTRA: Panel CRM */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header CRM */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User size={18} />
                Informazioni Cliente
              </h3>
            </div>

            {/* Informazioni cliente */}
            <div className="p-4 border-b border-gray-200">
              {customerInfo ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Nome
                    </label>
                    <p className="text-gray-900">{customerInfo.name}</p>
                  </div>
                  {customerInfo.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <p className="text-gray-900">{customerInfo.email}</p>
                    </div>
                  )}
                  {customerInfo.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Telefono
                      </label>
                      <p className="text-gray-900">{customerInfo.phone}</p>
                    </div>
                  )}
                  {customerInfo.company && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Azienda
                      </label>
                      <p className="text-gray-900">{customerInfo.company}</p>
                    </div>
                  )}
                  {customerInfo.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {customerInfo.location}
                      </span>
                    </div>
                  )}
                  {customerInfo.orders && (
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {customerInfo.orders} ordini • Ultimo:{" "}
                        {customerInfo.lastOrder}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <User size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">
                    Informazioni cliente non disponibili
                  </p>
                  <button className="mt-2 text-[#1D70B3] text-sm hover:underline">
                    Aggiungi informazioni
                  </button>
                </div>
              )}
            </div>

            {/* Sezione Tag */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Tag size={16} />
                  Tag
                </h4>
                <button className="text-[#1D70B3] hover:bg-blue-50 p-1 rounded">
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nessun tag assegnato</p>
                )}
                <button className="text-sm text-[#1D70B3] hover:underline">
                  + Aggiungi tag
                </button>
              </div>
            </div>

            {/* Sezione Note */}
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Edit3 size={16} />
                  Note Private
                </h4>
                <button className="text-[#1D70B3] hover:bg-blue-50 p-1 rounded">
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                    >
                      <p className="text-sm text-gray-800 mb-2">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{note.createdBy}</span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString("it-IT")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    <Edit3 size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm mb-2">Nessuna nota privata</p>
                    <button className="text-[#1D70B3] text-sm hover:underline">
                      Aggiungi la prima nota
                    </button>
                  </div>
                )}
              </div>

              {/* Area nuova nota */}
              <div className="mt-4">
                <textarea
                  placeholder="Aggiungi una nota privata..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1D70B3] focus:border-transparent resize-none"
                />
                <button className="mt-2 w-full bg-[#1D70B3] text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700">
                  Salva Nota
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <User size={48} className="mx-auto mb-4 text-gray-300" />
              <p>
                Seleziona una conversazione per visualizzare le informazioni CRM
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
