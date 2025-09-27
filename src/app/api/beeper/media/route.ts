// src/app/api/beeper/media/route.ts
// Endpoint per recuperare media da Beeper - VERSIONE CON FIX ERRORI

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Estrai l'URL del media dalla query
    const { searchParams } = new URL(request.url);
    const mediaUrl = searchParams.get("url");

    if (!mediaUrl) {
      return NextResponse.json({ error: "URL mancante" }, { status: 400 });
    }

    console.log("🖼️ Richiesta media:", mediaUrl);

    const baseUrl = process.env.BEEPER_API_URL || "http://localhost:23373";
    const token = process.env.BEEPER_API_TOKEN || process.env.BEEPER_TOKEN;

    if (!token) {
      console.error("❌ Token Beeper non configurato!");
      return returnErrorJson("Token mancante");
    }

    // Parsing dell'URL per estrarre componenti
    // Formato: beeper-api://attachments/!chatID:server/messageID/attachmentIndex
    const matches = mediaUrl.match(
      /beeper-api:\/\/attachments\/([^\/]+)\/(\d+)\/(\d+)/
    );

    if (!matches) {
      console.error("❌ Formato URL non valido:", mediaUrl);
      return returnErrorJson("URL invalido");
    }

    const [_, chatID, messageID, attachmentIndex] = matches;
    console.log("📝 Download media:", { chatID, messageID, attachmentIndex });

    // Usa il formato corretto scoperto dai test
    const downloadResponse = await fetch(`${baseUrl}/v0/download-attachment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatID: chatID,
        messageID: messageID,
        attachmentIndex: parseInt(attachmentIndex),
      }),
    });

    // Leggi la risposta
    const responseData = await downloadResponse.arrayBuffer();

    // Controlla se la risposta è JSON (errore) o binaria (file)
    const responseText = new TextDecoder().decode(responseData.slice(0, 100));
    const isJson = responseText.includes("{") && responseText.includes('"');

    if (isJson) {
      // È un errore JSON
      const errorData = JSON.parse(new TextDecoder().decode(responseData));
      console.error("❌ Errore da Beeper:", errorData);

      // Analizza il tipo di errore
      if (
        errorData.error?.includes("filename") ||
        errorData.error?.includes("syntax")
      ) {
        console.log(
          "⚠️ Problema con il nome file, provo approccio alternativo"
        );

        // APPROCCIO ALTERNATIVO: Prova a recuperare il messaggio completo
        try {
          const messageUrl = `${baseUrl}/v0/get-message`;
          const messageResponse = await fetch(messageUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chatID: chatID,
              messageID: messageID,
            }),
          });

          if (messageResponse.ok) {
            const messageData = await messageResponse.json();
            console.log("📨 Messaggio recuperato:", messageData);

            // Cerca l'attachment nel messaggio
            if (
              messageData.attachments &&
              messageData.attachments[attachmentIndex]
            ) {
              const attachment = messageData.attachments[attachmentIndex];

              // Se c'è un URL diretto, usalo
              if (attachment.url || attachment.downloadUrl) {
                const directUrl = attachment.url || attachment.downloadUrl;
                console.log("🔗 URL diretto trovato:", directUrl);

                // Prova a scaricare dall'URL diretto
                const directResponse = await fetch(directUrl, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });

                if (directResponse.ok) {
                  const fileData = await directResponse.arrayBuffer();
                  const contentType =
                    directResponse.headers.get("content-type") ||
                    attachment.mimeType ||
                    "audio/ogg";

                  return new NextResponse(fileData, {
                    headers: {
                      "Content-Type": contentType,
                      "Cache-Control": "private, max-age=86400",
                      "Content-Disposition": `inline; filename="${
                        attachment.fileName || "audio.ogg"
                      }"`,
                    },
                  });
                }
              }
            }
          }
        } catch (altError) {
          console.error("❌ Approccio alternativo fallito:", altError);
        }
      }

      // Se tutto fallisce, restituisci l'errore come JSON
      return NextResponse.json(errorData, { status: 500 });
    }

    // Se non è JSON, assumiamo sia il file binario
    if (downloadResponse.ok) {
      const contentType =
        downloadResponse.headers.get("content-type") || "audio/ogg";

      console.log(
        `✅ Media scaricato: ${contentType}, ${responseData.byteLength} bytes`
      );

      // Determina il MIME type corretto per i vocali
      let finalContentType = contentType;
      if (mediaUrl.includes("voice") || responseData.byteLength < 500000) {
        // < 500KB probabilmente vocale
        // Controlla se è OGG Opus
        const bytes = new Uint8Array(responseData);
        if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67) {
          finalContentType = "audio/ogg";
          console.log("📱 Rilevato formato OGG");
        }
      }

      return new NextResponse(responseData, {
        headers: {
          "Content-Type": finalContentType,
          "Cache-Control": "private, max-age=86400",
          "Content-Disposition": 'inline; filename="audio.ogg"',
          "Accept-Ranges": "bytes",
        },
      });
    }

    // Se non OK e non JSON, restituisci errore generico
    console.error(`❌ Download fallito: ${downloadResponse.status}`);
    return returnErrorJson("Download fallito");
  } catch (error) {
    console.error("❌ Errore media proxy:", error);
    return returnErrorJson("Errore server: " + (error as Error).message);
  }
}

// Funzione helper per restituire errore JSON
function returnErrorJson(reason: string) {
  console.log(`❌ Errore: ${reason}`);

  return NextResponse.json(
    {
      success: false,
      error: reason,
      fallback: true,
    },
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
