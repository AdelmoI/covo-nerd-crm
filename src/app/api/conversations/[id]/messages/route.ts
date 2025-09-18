// src/app/api/conversations/[id]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;
    const conversationId = decodeURIComponent(id);
    console.log("💬 Richiesta messaggi per conversazione:", conversationId);

    // Chiamata API Beeper per recuperare messaggi
    const messages = await getBeeperMessages(conversationId);

    return NextResponse.json({
      success: true,
      messages,
      conversationId,
    });
  } catch (error) {
    console.error("Errore recupero messaggi:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno",
        messages: [],
      },
      { status: 500 }
    );
  }
}

async function getBeeperMessages(conversationId: string) {
  try {
    const baseUrl = process.env.BEEPER_API_URL || "http://localhost:23373";
    const token = process.env.BEEPER_TOKEN || process.env.BEEPER_API_TOKEN;

    console.log(`📡 Recupero messaggi da Beeper per chat: ${conversationId}`);

    // Endpoint per ottenere i messaggi di una chat specifica
    const url = `${baseUrl}/v0/get-messages?chatID=${encodeURIComponent(
      conversationId
    )}&limit=50`;

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Messaggi recuperati: ${data.messages?.length || 0}`);

    // Trasforma i messaggi nel formato per la UI
    const messages = transformBeeperMessages(data.messages || []);
    return messages;
  } catch (error) {
    console.error("Errore API Beeper per messaggi:", error);
    // Restituisci messaggi mock se Beeper non funziona
    return getMockMessages(conversationId);
  }
}

function transformBeeperMessages(rawMessages: any[]) {
  return rawMessages.map((msg: any, index: number) => ({
    id: msg.id || msg.eventID || `msg_${index}`,
    content: msg.body || msg.text || msg.content || "",
    timestamp: msg.timestamp
      ? new Date(msg.timestamp * 1000).toISOString()
      : new Date().toISOString(),
    sender: {
      name: msg.sender?.displayName || msg.senderName || msg.sender || "Utente",
      id: msg.sender?.id || msg.senderID || "unknown",
      isMe: msg.isFromMe || false,
    },
    type: msg.msgtype || "text",
    edited: msg.edited || false,
    reactions: msg.reactions || [],
  }));
}

function getMockMessages(conversationId: string) {
  const mockMessages: { [key: string]: any[] } = {
    "!yRPZja0BvcY9fjNXiG2J:beeper.local": [
      {
        id: "msg_1",
        content: "Ciao a tutti! Come procede l'organizzazione del Festival?",
        timestamp: "2025-09-18T13:50:07.000Z",
        sender: {
          name: "Marco Rossi",
          id: "marco_rossi",
          isMe: false,
        },
        type: "text",
      },
      {
        id: "msg_2",
        content: "Tutto sotto controllo! Ho confermato i 3 stand principali",
        timestamp: "2025-09-18T13:45:15.000Z",
        sender: {
          name: "Tu",
          id: "me",
          isMe: true,
        },
        type: "text",
      },
      {
        id: "msg_3",
        content: "Perfetto! Domani mandiamo la lista fornitori",
        timestamp: "2025-09-18T13:40:32.000Z",
        sender: {
          name: "Laura Marketing",
          id: "laura_mkt",
          isMe: false,
        },
        type: "text",
      },
    ],
    "!ojt0tXlnDqkk4rewdhXW:beeper.local": [
      {
        id: "msg_4",
        content: "Per il torneo di Magic del weekend prossimo servono 8 tavoli",
        timestamp: "2025-09-18T13:36:41.000Z",
        sender: {
          name: "Giuseppe Organizzatore",
          id: "giuseppe_org",
          isMe: false,
        },
        type: "text",
      },
      {
        id: "msg_5",
        content: "Ok, confermo disponibilità della sala grande",
        timestamp: "2025-09-18T13:30:22.000Z",
        sender: {
          name: "Tu",
          id: "me",
          isMe: true,
        },
        type: "text",
      },
    ],
    "!fiuKRTZi85THu7k7lMCL:beeper.local": [
      {
        id: "msg_6",
        content: "Riunione di team oggi alle 15:00 per fare il punto vendite",
        timestamp: "2025-09-18T12:16:25.000Z",
        sender: {
          name: "Adelmo Manager",
          id: "adelmo_mgr",
          isMe: false,
        },
        type: "text",
      },
      {
        id: "msg_7",
        content: "Perfetto, ci sarò. Ho i dati di settembre pronti",
        timestamp: "2025-09-18T12:10:45.000Z",
        sender: {
          name: "Staff Member",
          id: "staff_1",
          isMe: false,
        },
        type: "text",
      },
    ],
  };

  return (
    mockMessages[conversationId] || [
      {
        id: "msg_default",
        content: "Nessun messaggio trovato per questa conversazione",
        timestamp: new Date().toISOString(),
        sender: {
          name: "Sistema",
          id: "system",
          isMe: false,
        },
        type: "text",
      },
    ]
  );
}
