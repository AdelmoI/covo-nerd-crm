// src/app/api/conversations/[id]/tags/route.ts
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
    console.log("🏷️ Richiesta tag per conversazione:", conversationId);

    // TODO: Implementare connessione database per tag reali
    const mockTags = getMockTags(conversationId);

    return NextResponse.json({
      success: true,
      tags: mockTags,
    });
  } catch (error) {
    console.error("Errore recupero tag:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { tagName, color } = await request.json();
    const { id } = await params;
    const conversationId = decodeURIComponent(id);

    if (!tagName || tagName.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Nome tag non valido",
        },
        { status: 400 }
      );
    }

    // TODO: Salvare tag nel database
    const newTag = {
      id: Date.now().toString(),
      name: tagName.trim(),
      color: color || "#1D70B3",
      category: "custom",
    };

    console.log("✅ Nuovo tag creato:", newTag);

    return NextResponse.json({
      success: true,
      tag: newTag,
      message: "Tag aggiunto con successo",
    });
  } catch (error) {
    console.error("Errore creazione tag:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno",
      },
      { status: 500 }
    );
  }
}

function getMockTags(conversationId: string) {
  const tags: { [key: string]: any[] } = {
    "!ojt0tXlnDqkk4rewdhXW:beeper.local": [
      {
        id: "tag_1",
        name: "Roma",
        color: "#E74C3C",
        category: "store",
      },
      {
        id: "tag_2",
        name: "Tornei",
        color: "#F39C12",
        category: "categoria",
      },
      {
        id: "tag_3",
        name: "VIP",
        color: "#8E44AD",
        category: "priorita",
      },
    ],
    "@mario_rossi:telegram": [
      {
        id: "tag_4",
        name: "Console",
        color: "#3498DB",
        category: "prodotto",
      },
      {
        id: "tag_5",
        name: "Lista attesa",
        color: "#F1C40F",
        category: "stato",
      },
    ],
    gamer_pro_insta: [
      {
        id: "tag_6",
        name: "Risolto",
        color: "#27AE60",
        category: "stato",
      },
    ],
    "!abc123xyz789:beeper.local": [
      {
        id: "tag_7",
        name: "Viterbo",
        color: "#E67E22",
        category: "store",
      },
      {
        id: "tag_8",
        name: "Staff",
        color: "#9B59B6",
        category: "interno",
      },
    ],
    staff_covo_vendetta: [
      {
        id: "tag_9",
        name: "Interno",
        color: "#34495E",
        category: "staff",
      },
      {
        id: "tag_10",
        name: "Riunione",
        color: "#16A085",
        category: "meeting",
      },
    ],
  };

  return tags[conversationId] || [];
}
