// src/app/api/conversations/[id]/messages/route.ts - VERSIONE FINALE CON MEDIA
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function convertMediaUrl(beeperUrl: string): string {
  if (beeperUrl && beeperUrl.startsWith("beeper-api://")) {
    return `/api/beeper/media?url=${encodeURIComponent(beeperUrl)}`;
  }
  return beeperUrl;
}
// Interfacce basate sui dati reali di Beeper
interface BeeperAttachment {
  type: "img" | "audio" | "video" | "file";
  srcURL: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  isVoiceNote?: boolean;
  isGif?: boolean;
  isSticker?: boolean;
  size?: {
    width: number;
    height: number;
  };
  duration?: number;
}

interface BeeperMessage {
  id?: string;
  messageID?: string;
  chatID: string;
  accountID?: string;
  senderID: string;
  senderName?: string;
  timestamp: string | number;
  sortKey?: string;
  text?: string;
  isSender: boolean;
  isUnread?: boolean;
  attachments?: BeeperAttachment[];
}

interface TransformedMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isFromOperator: boolean;
  network: string;
  status: string;
  type: "text" | "image" | "audio" | "video" | "document" | "voice";
  // Campi aggiuntivi per media
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  fileSize?: number;
  isVoiceNote?: boolean;
  imageSize?: { width: number; height: number };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conversationId = "";

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;
    conversationId = decodeURIComponent(id);
    console.log("💬 Richiesta messaggi per:", conversationId);

    const messages = await getBeeperMessages(conversationId);

    return NextResponse.json({
      success: true,
      messages,
      conversationId,
      count: messages.length,
    });
  } catch (error) {
    console.error("❌ Errore:", error);
    const mockMessages = getMockMessages(conversationId);
    return NextResponse.json({
      success: true,
      messages: mockMessages,
      conversationId,
      count: mockMessages.length,
      warning: "Usando dati mock",
    });
  }
}

async function getBeeperMessages(
  conversationId: string
): Promise<TransformedMessage[]> {
  try {
    const baseUrl = process.env.BEEPER_API_URL || "http://localhost:23373";
    const token = process.env.BEEPER_API_TOKEN || process.env.BEEPER_TOKEN;

    if (!token) {
      console.warn("⚠️ Token Beeper mancante");
      return getMockMessages(conversationId);
    }

    const url = `${baseUrl}/v0/search-messages?chatID=${encodeURIComponent(
      conversationId
    )}&limit=200`;
    console.log("🔗 Chiamata API:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error("❌ Errore API:", response.status);
      return getMockMessages(conversationId);
    }

    const data = await response.json();
    const rawMessages: BeeperMessage[] = data.items || [];

    // Filtra solo i messaggi di questa chat
    const chatMessages = rawMessages.filter(
      (msg) => msg.chatID === conversationId
    );

    console.log(`✅ ${chatMessages.length} messaggi per questa chat`);

    // Log media summary
    const mediaCount = chatMessages.filter(
      (m) => m.attachments && m.attachments.length > 0
    ).length;
    if (mediaCount > 0) {
      console.log(`📎 ${mediaCount} messaggi con media trovati`);
    }

    return transformBeeperMessages(chatMessages, conversationId);
  } catch (error) {
    console.error("❌ Errore getBeeperMessages:", error);
    return getMockMessages(conversationId);
  }
}

function transformBeeperMessages(
  rawMessages: BeeperMessage[],
  conversationId: string
): TransformedMessage[] {
  console.log(`🔄 Trasformazione ${rawMessages.length} messaggi`);

  return rawMessages
    .map((msg, index) => {
      try {
        // 1. Determina se è un messaggio dell'operatore
        const isFromOperator = msg.isSender === true;

        // 2. Determina il nome del mittente
        let senderName = "Sconosciuto";
        if (isFromOperator) {
          senderName = "Tu";
        } else if (msg.senderName) {
          senderName = msg.senderName;
        } else {
          senderName = extractReadableName(msg.senderID);
        }

        // 3. Gestisci contenuto e tipo di messaggio
        let messageType: TransformedMessage["type"] = "text";
        let content = msg.text || "";
        let mediaInfo: Partial<TransformedMessage> = {};

        // Controlla se ci sono allegati
        if (msg.attachments && msg.attachments.length > 0) {
          const attachment = msg.attachments[0]; // Prendi il primo allegato

          // Imposta l'URL del media
          mediaInfo.mediaUrl = convertMediaUrl(attachment.srcURL);
          mediaInfo.fileName = attachment.fileName;
          mediaInfo.fileSize = attachment.fileSize;

          // Determina il tipo in base al tipo di allegato
          switch (attachment.type) {
            case "img":
              messageType = "image";
              content = "📷 Foto";
              if (attachment.size) {
                mediaInfo.imageSize = attachment.size;
              }
              break;

            case "audio":
              if (attachment.isVoiceNote) {
                messageType = "voice";
                content = "🎤 Messaggio vocale";
                mediaInfo.isVoiceNote = true;
              } else {
                messageType = "audio";
                content = "🎵 Audio";
              }
              // Calcola durata approssimativa dal fileSize (molto approssimativo)
              const durationSeconds = Math.round(attachment.fileSize / 1000); // ~1KB/sec per opus
              if (durationSeconds > 0) {
                content += ` (${formatDuration(durationSeconds)})`;
              }
              break;

            case "video":
              messageType = "video";
              content = "📹 Video";
              if (attachment.size) {
                mediaInfo.imageSize = attachment.size;
              }
              break;

            case "file":
              messageType = "document";
              content = `📎 ${attachment.fileName}`;
              break;

            default:
              content = "📎 File allegato";
          }

          // Se c'è anche del testo insieme al media (caption)
          if (msg.text) {
            content = content + "\n" + msg.text;
          }
        } else if (!msg.text || msg.text === "") {
          // Messaggio senza testo e senza allegati
          content = "[Messaggio vuoto]";
        }

        // 4. Gestisci timestamp
        let timestamp = new Date().toISOString();
        if (msg.timestamp) {
          if (typeof msg.timestamp === "string") {
            timestamp = msg.timestamp;
          } else if (typeof msg.timestamp === "number") {
            const ts =
              msg.timestamp > 9999999999 ? msg.timestamp : msg.timestamp * 1000;
            timestamp = new Date(ts).toISOString();
          }
        }

        // Log per debug dei media
        if (messageType !== "text" && index < 5) {
          console.log(
            `Media ${
              index + 1
            }: type=${messageType}, sender=${senderName}, url=${mediaInfo.mediaUrl?.substring(
              0,
              50
            )}...`
          );
        }

        return {
          id: msg.id || msg.messageID || `msg_${index}`,
          sender: senderName,
          content: content,
          timestamp: timestamp,
          isFromOperator: isFromOperator,
          network: extractNetwork(msg.senderID),
          status: "delivered",
          type: messageType,
          ...mediaInfo, // Aggiungi tutte le info media
        };
      } catch (err) {
        console.error(`Errore trasformazione msg ${index}:`, err);
        return null;
      }
    })
    .filter((msg): msg is TransformedMessage => msg !== null)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
}

function extractReadableName(senderID: string): string {
  if (!senderID) return "Cliente";

  if (senderID.startsWith("@")) {
    const parts = senderID.split(":")[0].substring(1);

    if (parts.includes("_")) {
      const [network, identifier] = parts.split("_");

      if (/^\d+$/.test(identifier)) {
        if (identifier.startsWith("39")) {
          const number = identifier.substring(2);
          if (number.length === 10) {
            return number.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
          }
        }
        return "..." + identifier.slice(-8);
      }

      if (identifier.startsWith("lid-")) {
        return "WhatsApp Business";
      }

      return identifier;
    }

    return parts;
  }

  return senderID.split(/[@:]/)[0] || "Cliente";
}

function extractNetwork(senderID: string): string {
  const lower = senderID.toLowerCase();
  if (lower.includes("whatsapp")) return "whatsapp";
  if (lower.includes("telegram")) return "telegram";
  if (lower.includes("instagram")) return "instagram";
  if (lower.includes("signal")) return "signal";
  if (lower.includes("beeper.com")) return "beeper";
  return "unknown";
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `0:${seconds.toString().padStart(2, "0")}`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function getMockMessages(conversationId: string): TransformedMessage[] {
  return [
    {
      id: "mock1",
      sender: "Mario Rossi",
      content: "Ciao, avete la PS5 disponibile?",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isFromOperator: false,
      network: "whatsapp",
      status: "delivered",
      type: "text",
    },
    {
      id: "mock2",
      sender: "Tu",
      content: "Buongiorno! Sì, abbiamo disponibilità. Le invio una foto:",
      timestamp: new Date(Date.now() - 6600000).toISOString(),
      isFromOperator: true,
      network: "whatsapp",
      status: "delivered",
      type: "text",
    },
    {
      id: "mock3",
      sender: "Tu",
      content: "📷 Foto",
      timestamp: new Date(Date.now() - 6500000).toISOString(),
      isFromOperator: true,
      network: "whatsapp",
      status: "delivered",
      type: "image",
      mediaUrl: "beeper-api://attachments/mock/image.jpg",
      fileName: "ps5.jpg",
      fileSize: 250000,
    },
    {
      id: "mock4",
      sender: "Mario Rossi",
      content: "🎤 Messaggio vocale (0:15)",
      timestamp: new Date(Date.now() - 6000000).toISOString(),
      isFromOperator: false,
      network: "whatsapp",
      status: "delivered",
      type: "voice",
      mediaUrl: "beeper-api://attachments/mock/voice.ogg",
      fileName: "Voice message.ogg",
      fileSize: 15000,
      isVoiceNote: true,
    },
  ];
}
