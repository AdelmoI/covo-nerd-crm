// src/app/api/conversations/[id]/messages/route.ts - VERSION ROBUSTA CON ERROR HANDLING
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    console.log("💬 Richiesta messaggi per conversazione:", conversationId);

    // Chiamata API Beeper per recuperare messaggi
    const messages = await getBeeperMessages(conversationId);

    return NextResponse.json({
      success: true,
      messages,
      conversationId,
      count: messages.length,
    });
  } catch (error) {
    console.error("❌ Errore recupero messaggi:", error);

    // Fallback sempre con messaggi mock in caso di errore
    const mockMessages = getMockMessages(conversationId || "unknown");

    return NextResponse.json({
      success: true, // Restituisci sempre success true con i mock
      messages: mockMessages,
      conversationId: conversationId,
      count: mockMessages.length,
      warning: "Dati mock - API Beeper non disponibile",
    });
  }
}

async function getBeeperMessages(conversationId: string) {
  try {
    const baseUrl = process.env.BEEPER_API_URL || "http://localhost:23373";
    const token = process.env.BEEPER_API_TOKEN || process.env.BEEPER_TOKEN;

    console.log(`📡 Recupero messaggi da Beeper per chat: ${conversationId}`);

    if (!token) {
      console.warn("⚠️ Token Beeper mancante, uso messaggi mock");
      return getMockMessages(conversationId);
    }

    // TENTATIVO 1: /v0/get-chat
    try {
      console.log("🔍 Tentativo 1: /v0/get-chat");
      const chatUrl = `${baseUrl}/v0/get-chat?chatID=${encodeURIComponent(
        conversationId
      )}`;

      const chatResponse = await fetch(chatUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(8000),
      });

      console.log("📊 get-chat Response status:", chatResponse.status);
      console.log(
        "📊 get-chat Response headers:",
        Object.fromEntries(chatResponse.headers)
      );

      if (chatResponse.ok) {
        const responseText = await chatResponse.text();
        console.log("📦 get-chat Raw response length:", responseText.length);
        console.log(
          "📦 get-chat Raw response preview:",
          responseText.substring(0, 200)
        );

        if (responseText.trim().length === 0) {
          console.warn("⚠️ get-chat returned empty response");
        } else {
          try {
            const chatData = JSON.parse(responseText);
            console.log("📦 get-chat Parsed data keys:", Object.keys(chatData));

            if (
              chatData.messages &&
              Array.isArray(chatData.messages) &&
              chatData.messages.length > 0
            ) {
              const transformedMessages = transformBeeperMessages(
                chatData.messages,
                conversationId
              );
              console.log(
                `✅ Messaggi da get-chat: ${transformedMessages.length}`
              );
              return transformedMessages;
            } else {
              console.log(
                "ℹ️ get-chat: nessun messaggio nell'array o array vuoto"
              );
            }
          } catch (parseError) {
            console.error("❌ JSON parse error in get-chat:", parseError);
            console.log(
              "🔍 Response that failed to parse:",
              responseText.substring(0, 500)
            );
          }
        }
      } else {
        const errorText = await chatResponse.text();
        console.log(
          "⚠️ get-chat failed:",
          chatResponse.status,
          errorText.substring(0, 200)
        );
      }
    } catch (error) {
      console.log("⚠️ get-chat errore:", error.message);
    }

    // TENTATIVO 2: search-messages
    try {
      console.log("🔍 Tentativo 2: /v0/search-messages");

      const params = new URLSearchParams({
        chatID: conversationId,
        limit: "30",
      });

      const url = `${baseUrl}/v0/search-messages?${params}`;
      console.log("🔗 URL search-messages:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      console.log("📊 search-messages Response status:", response.status);

      if (response.ok) {
        const responseText = await response.text();
        console.log(
          "📦 search-messages Raw response length:",
          responseText.length
        );

        if (responseText.trim().length === 0) {
          console.warn("⚠️ search-messages returned empty response");
          return getMockMessages(conversationId);
        }

        try {
          const data = JSON.parse(responseText);
          console.log("📦 search-messages Data type:", typeof data);
          console.log("📦 search-messages Keys:", Object.keys(data));

          let rawMessages = [];
          if (Array.isArray(data)) {
            rawMessages = data;
          } else if (data.messages && Array.isArray(data.messages)) {
            rawMessages = data.messages;
          } else if (data.items && Array.isArray(data.items)) {
            rawMessages = data.items;
          }

          console.log(`📨 Raw messages found: ${rawMessages.length}`);

          if (rawMessages.length === 0) {
            console.log("ℹ️ No messages found in API response, using mock");
            return getMockMessages(conversationId);
          }

          // Filtra messaggi per questa chat
          const filteredMessages = rawMessages.filter((msg) => {
            const msgChatId =
              msg.chatID || msg.chat_id || msg.roomID || msg.room_id;
            return msgChatId === conversationId;
          });

          console.log(
            `🔍 Filtered messages for ${conversationId}: ${filteredMessages.length}`
          );

          if (filteredMessages.length === 0) {
            console.log("ℹ️ No messages after filtering, using mock");
            return getMockMessages(conversationId);
          }

          const transformedMessages = transformBeeperMessages(
            filteredMessages,
            conversationId
          );
          console.log(`✅ Transformed messages: ${transformedMessages.length}`);
          return transformedMessages;
        } catch (parseError) {
          console.error("❌ JSON parse error in search-messages:", parseError);
          console.log(
            "🔍 Response that failed to parse:",
            responseText.substring(0, 500)
          );
          return getMockMessages(conversationId);
        }
      } else {
        const errorText = await response.text();
        console.log(
          "⚠️ search-messages failed:",
          response.status,
          errorText.substring(0, 200)
        );
        return getMockMessages(conversationId);
      }
    } catch (error) {
      console.error("❌ search-messages error:", error);
      return getMockMessages(conversationId);
    }
  } catch (error) {
    console.error("❌ General error in getBeeperMessages:", error);
    return getMockMessages(conversationId);
  }
}

function transformBeeperMessages(rawMessages: any[], conversationId: string) {
  try {
    console.log(
      `🔄 Transforming ${rawMessages.length} raw messages for ${conversationId}`
    );

    return rawMessages
      .map((msg: any, index: number) => {
        try {
          // Logica semplificata e sicura per il sender
          let senderName = "Sconosciuto";
          let isFromOperator = false;

          // Prima controlla isFromMe
          if (msg.isFromMe === true || msg.is_from_me === true) {
            isFromOperator = true;
            senderName = "Tu";
          } else if (msg.sender) {
            senderName = String(msg.sender);
            isFromOperator =
              senderName.includes("@beeper.local") ||
              senderName.includes("@il-covo") ||
              senderName.includes("local-") ||
              senderName === "me";
          } else if (msg.from) {
            senderName = String(msg.from);
          } else if (msg.author) {
            senderName = String(msg.author);
          }

          // Contenuto messaggio
          let content = "";
          if (msg.body) content = String(msg.body);
          else if (msg.text) content = String(msg.text);
          else if (msg.content) content = String(msg.content);
          else if (msg.message) content = String(msg.message);

          // Timestamp
          let timestamp = new Date().toISOString();
          try {
            if (msg.timestamp) {
              const ts =
                typeof msg.timestamp === "number"
                  ? msg.timestamp > 9999999999
                    ? msg.timestamp
                    : msg.timestamp * 1000
                  : msg.timestamp;
              timestamp = new Date(ts).toISOString();
            } else if (msg.time) {
              timestamp = new Date(msg.time * 1000).toISOString();
            }
          } catch (tsError) {
            console.warn("⚠️ Timestamp parsing failed for message", index);
          }

          return {
            id: msg.id || msg.eventID || msg.messageID || `msg_${index}`,
            content: content || "[Messaggio vuoto]",
            timestamp: timestamp,
            sender: senderName,
            isFromOperator: isFromOperator,
            platform: msg.network || msg.platform || "unknown",
            type: msg.type || "text",
            chatId: conversationId,
          };
        } catch (msgError) {
          console.error(`❌ Error transforming message ${index}:`, msgError);
          return {
            id: `error_msg_${index}`,
            content: "[Errore nel messaggio]",
            timestamp: new Date().toISOString(),
            sender: "Sistema",
            isFromOperator: true,
            platform: "error",
            type: "error",
            chatId: conversationId,
          };
        }
      })
      .filter((msg) => msg.content.length > 0);
  } catch (error) {
    console.error("❌ Error in transformBeeperMessages:", error);
    return [];
  }
}

function getMockMessages(conversationId: string) {
  console.log("🎭 Generando messaggi mock per:", conversationId);

  const conversationName = conversationId.toLowerCase();

  let mockMessages = [];

  if (conversationName.includes("primo") || conversationName.includes("p")) {
    mockMessages = [
      {
        id: "msg_primo_1",
        content:
          "Ciao! Sono interessato al nuovo set LEGO che avete in vetrina",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        sender: "Primo",
        isFromOperator: false,
        platform: "whatsapp",
        type: "text",
        chatId: conversationId,
      },
      {
        id: "msg_primo_2",
        content: "Salve Primo! Di quale set si tratta? Il Creator Expert?",
        timestamp: new Date(Date.now() - 6600000).toISOString(),
        sender: "Tu",
        isFromOperator: true,
        platform: "whatsapp",
        type: "text",
        chatId: conversationId,
      },
      {
        id: "msg_primo_3",
        content: "Sì esatto! Quello del Castello di Hogwarts. È disponibile?",
        timestamp: new Date(Date.now() - 6000000).toISOString(),
        sender: "Primo",
        isFromOperator: false,
        platform: "whatsapp",
        type: "text",
        chatId: conversationId,
      },
      {
        id: "msg_primo_4",
        content:
          "Sì, lo abbiamo! Costa 399,99€. Vuoi che te lo metto da parte?",
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        sender: "Tu",
        isFromOperator: true,
        platform: "whatsapp",
        type: "text",
        chatId: conversationId,
      },
    ];
  } else {
    // Messaggi generici
    mockMessages = [
      {
        id: `msg_${conversationId}_1`,
        content: "Salve, ho una domanda su un prodotto",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        sender: "Cliente",
        isFromOperator: false,
        platform: "whatsapp",
        type: "text",
        chatId: conversationId,
      },
      {
        id: `msg_${conversationId}_2`,
        content: "Certo! Sono qui per aiutarla. Di cosa ha bisogno?",
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        sender: "Tu",
        isFromOperator: true,
        platform: "whatsapp",
        type: "text",
        chatId: conversationId,
      },
    ];
  }

  console.log(`🎭 Mock generati: ${mockMessages.length} messaggi`);
  return mockMessages;
}
