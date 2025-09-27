// src/components/dashboard/ConversationsDashboard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
  Play,
  Pause,
  Download,
  Image,
  FileText,
  Volume2,
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
  type: "text" | "image" | "audio" | "video" | "document" | "voice";
  status?: string;
  // Campi per media
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  fileSize?: number;
  isVoiceNote?: boolean;
  imageSize?: { width: number; height: number };
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

// Componente per visualizzare immagini
const ImageMessage = ({
  message,
  isFromMe,
}: {
  message: ConversationMessage;
  isFromMe: boolean;
}) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-gray-600">📷 Impossibile caricare l'immagine</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <img
        src={message.mediaUrl}
        alt="Immagine"
        className="rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow max-w-full h-auto"
        onError={() => setImageError(true)}
        onClick={() => window.open(message.mediaUrl, "_blank")}
      />
      {message.content && !message.content.includes("📷") && (
        <p className="mt-2 text-sm">
          {message.content.split("\n").slice(1).join("\n")}
        </p>
      )}
    </div>
  );
};

// Componente per riprodurre audio/vocali
const AudioMessage = ({
  message,
  isFromMe,
}: {
  message: ConversationMessage;
  isFromMe: boolean;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg ${
        isFromMe ? "bg-[#DCF8C6]/50" : "bg-gray-100"
      }`}
    >
      <button
        onClick={togglePlay}
        className={`p-2 rounded-full transition-colors ${
          isFromMe
            ? "bg-[#128C7E] hover:bg-[#075E54] text-white"
            : "bg-[#1D70B3] hover:bg-blue-700 text-white"
        }`}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {message.isVoiceNote ? "🎤 Messaggio vocale" : "🎵 Audio"}
        </p>
        {message.content.includes("(") && (
          <p className="text-xs text-gray-600">
            {message.content.match(/\(([^)]+)\)/)?.[1]}
          </p>
        )}
        <audio
          ref={audioRef}
          src={message.mediaUrl}
          onEnded={() => setIsPlaying(false)}
          onError={(e) => console.error("Errore audio:", e)}
        />
      </div>
    </div>
  );
};

// Componente per documenti
const DocumentMessage = ({
  message,
  isFromMe,
}: {
  message: ConversationMessage;
  isFromMe: boolean;
}) => {
  return (
    <a
      href={message.mediaUrl}
      download={message.fileName}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isFromMe
          ? "bg-[#DCF8C6]/50 hover:bg-[#DCF8C6]/70"
          : "bg-gray-100 hover:bg-gray-200"
      }`}
    >
      <FileText size={24} className="text-gray-600" />
      <div>
        <p className="text-sm font-medium">{message.fileName || "Documento"}</p>
        {message.fileSize && (
          <p className="text-xs text-gray-600">
            {formatFileSize(message.fileSize)}
          </p>
        )}
      </div>
      <Download size={16} className="ml-auto text-gray-500" />
    </a>
  );
};

// Funzione helper per formattare dimensioni file
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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

  // Funzione per le icone network
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
      default:
        return (
          <span className="inline-flex items-center gap-1">
            <MessageSquare size={12} className="text-gray-500" />
            <span className="hidden sm:inline">Chat</span>
          </span>
        );
    }
  };

  // Carica le conversazioni
  useEffect(() => {
    loadConversations();
    const refreshInterval = setInterval(() => {
      loadConversations();
    }, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Carica i messaggi quando cambia la conversazione
  useEffect(() => {
    async function loadMessages() {
      if (!selectedConversation) {
        setMessages([]);
        setLoadingMessages(false);
        return;
      }

      setLoadingMessages(true);
      setMessagesError(null);

      try {
        const encodedId = encodeURIComponent(selectedConversation.id);
        const response = await fetch(
          `/api/conversations/${encodedId}/messages`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
          console.log(`✅ Messaggi caricati: ${data.messages.length}`);
        } else {
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
      const response = await fetch("/api/beeper/sync");
      const data = await response.json();

      if (data.success && data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !selectedConversation) {
          setSelectedConversation(data.conversations[0]);
          loadConversationDetails(data.conversations[0].id);
        }
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error("❌ Errore caricamento conversazioni:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetails = async (conversationId: string) => {
    try {
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {conversation.title.charAt(0).toUpperCase()}
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

                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                </div>
              </div>
            </div>

            {/* Area messaggi con stile WhatsApp */}
            <div
              className="flex-1 overflow-y-auto"
              style={{
                backgroundColor: "#E5DDD5",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d5d5d5' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-3 text-gray-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1D70B3]"></div>
                    <span>Caricamento messaggi...</span>
                  </div>
                </div>
              ) : messagesError ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center bg-white p-4 rounded-lg shadow">
                    <AlertCircle
                      className="mx-auto mb-2 text-red-500"
                      size={32}
                    />
                    <div className="text-red-600 font-medium mb-2">
                      Errore caricamento messaggi
                    </div>
                    <button
                      onClick={retryLoadMessages}
                      className="px-3 py-2 bg-[#1D70B3] text-white rounded text-sm hover:bg-blue-700"
                    >
                      <RefreshCw size={14} className="inline mr-1" />
                      Riprova
                    </button>
                  </div>
                </div>
              ) : messages.length > 0 ? (
                <div className="p-4 space-y-2">
                  {messages.map(
                    (message: ConversationMessage, index: number) => {
                      const isFromMe =
                        message.isFromOperator || message.sender === "Tu";
                      const showTimestamp =
                        index === 0 ||
                        new Date(message.timestamp).getTime() -
                          new Date(messages[index - 1].timestamp).getTime() >
                          300000;

                      return (
                        <div key={message.id}>
                          {showTimestamp && (
                            <div className="text-center my-4">
                              <span className="text-xs text-gray-500 bg-white/90 px-3 py-1 rounded-full shadow-sm">
                                {new Date(message.timestamp).toLocaleDateString(
                                  "it-IT",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          )}

                          <div
                            className={`flex ${
                              isFromMe ? "justify-end" : "justify-start"
                            } mb-1`}
                          >
                            <div
                              className={`max-w-[70%] relative ${
                                isFromMe ? "ml-12" : "mr-12"
                              }`}
                            >
                              <div
                                className={`
                                relative px-3 py-2 rounded-lg shadow-sm
                                ${
                                  isFromMe
                                    ? "bg-[#DCF8C6] text-gray-900"
                                    : "bg-white text-gray-900"
                                }
                                ${
                                  isFromMe
                                    ? "rounded-br-none"
                                    : "rounded-bl-none"
                                }
                              `}
                              >
                                {!isFromMe &&
                                  selectedConversation?.type === "group" && (
                                    <div className="text-xs font-semibold text-[#06CF9C] mb-1">
                                      {message.sender}
                                    </div>
                                  )}

                                {/* Renderizza contenuto in base al tipo */}
                                {message.type === "image" ? (
                                  <ImageMessage
                                    message={message}
                                    isFromMe={isFromMe}
                                  />
                                ) : message.type === "voice" ||
                                  message.type === "audio" ? (
                                  <AudioMessage
                                    message={message}
                                    isFromMe={isFromMe}
                                  />
                                ) : message.type === "document" ? (
                                  <DocumentMessage
                                    message={message}
                                    isFromMe={isFromMe}
                                  />
                                ) : (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-16">
                                    {message.content}
                                  </p>
                                )}

                                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                  <span className="text-[10px] text-gray-500">
                                    {new Date(
                                      message.timestamp
                                    ).toLocaleTimeString("it-IT", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>

                                  {isFromMe && (
                                    <span className="text-xs">
                                      <svg
                                        width="16"
                                        height="11"
                                        viewBox="0 0 16 11"
                                        className="fill-[#53BDEB]"
                                      >
                                        <path d="M11.071.653a.5.5 0 0 0-.707 0L5.707 5.31 3.354 2.957a.5.5 0 0 0-.707.707l2.707 2.707a.5.5 0 0 0 .707 0L11.071 1.36a.5.5 0 0 0 0-.707z" />
                                        <path d="M15.071.653a.5.5 0 0 0-.707 0L9.707 5.31 8.354 3.957a.5.5 0 0 0-.707.707l2.707 2.707a.5.5 0 0 0 .707 0L15.071 1.36a.5.5 0 0 0 0-.707z" />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 p-8 bg-white rounded-lg shadow">
                    <MessageSquare
                      size={32}
                      className="mx-auto mb-4 text-gray-400"
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nessun messaggio
                    </h3>
                    <p className="text-sm text-gray-500">
                      I messaggi di questa conversazione appariranno qui
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Barra invio messaggio */}
            <div className="border-t border-gray-200 bg-[#F0F0F0] p-3">
              <div className="flex items-end gap-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full">
                  <Plus size={20} />
                </button>

                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Scrivi un messaggio"
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D70B3] focus:border-transparent text-sm"
                  />
                </div>

                <button className="p-2 bg-[#128C7E] text-white rounded-full hover:bg-[#075E54] transition-colors">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    className="fill-current"
                  >
                    <path d="M1.5 2.5l17 7.5-17 7.5v-5.833L12 10 1.5 8.333V2.5z" />
                  </svg>
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
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User size={18} />
                Informazioni Cliente
              </h3>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {/* Info cliente, tag, note - come prima */}
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>Chat ID: {selectedConversation.id}</p>
                  <p>Network: {selectedConversation.network}</p>
                  <p>Tipo: {selectedConversation.type}</p>
                </div>
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
