// src/app/api/beeper/media/route.ts - NUOVO FILE
// Endpoint per recuperare media da Beeper

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

    // L'URL sarà del tipo: beeper-api://attachments/!chatID:server/messageID/index
    // Dobbiamo convertirlo in una chiamata API Beeper

    const baseUrl = process.env.BEEPER_API_URL || "http://localhost:23373";
    const token = process.env.BEEPER_API_TOKEN || process.env.BEEPER_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "Token Beeper mancante" },
        { status: 500 }
      );
    }

    // Estrai i componenti dall'URL
    // beeper-api://attachments/!AU0ce3Dk8nsHkYiLe3Lo:beeper.local/23044/0
    const urlParts = mediaUrl
      .replace("beeper-api://attachments/", "")
      .split("/");

    if (urlParts.length < 3) {
      return NextResponse.json(
        { error: "Formato URL non valido" },
        { status: 400 }
      );
    }

    const [chatID, messageID, attachmentIndex] = urlParts;

    // Costruisci l'URL per recuperare l'attachment da Beeper
    // NOTA: Questo endpoint potrebbe variare in base alla versione di Beeper
    const attachmentUrl = `${baseUrl}/v0/attachments/${encodeURIComponent(
      chatID
    )}/${messageID}/${attachmentIndex}`;

    console.log("📡 Recupero attachment da:", attachmentUrl);

    // Fai la richiesta a Beeper
    const response = await fetch(attachmentUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("❌ Errore recupero media:", response.status);

      // Se l'endpoint non esiste, prova un formato alternativo
      const altUrl = `${baseUrl}/v0/media?url=${encodeURIComponent(mediaUrl)}`;
      console.log("🔄 Provo URL alternativo:", altUrl);

      const altResponse = await fetch(altUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!altResponse.ok) {
        return NextResponse.json(
          { error: "Impossibile recuperare il media" },
          { status: response.status }
        );
      }

      // Usa la risposta alternativa
      const altData = await altResponse.arrayBuffer();
      const altContentType =
        altResponse.headers.get("content-type") || "application/octet-stream";

      return new NextResponse(altData, {
        headers: {
          "Content-Type": altContentType,
          "Cache-Control": "private, max-age=3600", // Cache per 1 ora
        },
      });
    }

    // Leggi il contenuto del media
    const data = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    console.log(
      "✅ Media recuperato, tipo:",
      contentType,
      "dimensione:",
      data.byteLength
    );

    // Restituisci il media con headers appropriati
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600", // Cache per 1 ora
        "Content-Disposition": "inline", // Per visualizzare inline invece di download
      },
    });
  } catch (error) {
    console.error("❌ Errore media proxy:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
