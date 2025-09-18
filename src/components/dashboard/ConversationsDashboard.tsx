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
  const [loadingProgress, setLoadingProgress] = useState<string>(""); // AGGIUNGI QUESTA RIGA
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [tags, setTags] = useState<ConversationTag[]>([]);

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

  const getNetworkIcon = (network: string) => {
    switch (network.toLowerCase()) {
      case "whatsapp":
        return "💬";
      case "instagram":
        return "📷";
      case "telegram":
        return "✈️";
      case "beeper":
        return "🔔";
      default:
        return "💬";
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
                      <span>
                        {getNetworkIcon(selectedConversation.network)}{" "}
                        {selectedConversation.network}
                      </span>
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
                  <button className="p-2 hover:bg-gray-200 rounded-md">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Area messaggi */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D70B3] mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">
                      Caricamento messaggi...
                    </p>
                  </div>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender.isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender.isMe
                            ? "bg-[#1D70B3] text-white"
                            : "bg-white text-gray-900 shadow-sm border"
                        }`}
                      >
                        {!message.sender.isMe && (
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            {message.sender.name}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender.isMe
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString(
                            "it-IT",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare
                    size={48}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  <p className="text-lg font-medium mb-2">Nessun messaggio</p>
                  <p>I messaggi di questa conversazione appariranno qui</p>
                </div>
              )}
            </div>

            {/* Barra invio messaggio */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Scrivi un messaggio..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D70B3] focus:border-transparent"
                />
                <button className="bg-[#1D70B3] text-white p-2 rounded-full hover:bg-blue-700">
                  <Plus size={20} />
                </button>
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
