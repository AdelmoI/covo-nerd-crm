// src/app/api/conversations/[id]/notes/route.ts
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
    console.log("📝 Richiesta note per conversazione:", conversationId);

    // TODO: Implementare connessione database per note reali
    const mockNotes = getMockNotes(conversationId);

    return NextResponse.json({
      success: true,
      notes: mockNotes,
    });
  } catch (error) {
    console.error("Errore recupero note:", error);
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

    const { content } = await request.json();
    const { id } = await params;
    const conversationId = decodeURIComponent(id);

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Contenuto nota non valido",
        },
        { status: 400 }
      );
    }

    // TODO: Salvare nota nel database
    const newNote = {
      id: Date.now().toString(),
      content: content.trim(),
      createdBy: session.user?.name || "Operatore",
      createdAt: new Date().toISOString(),
      isPrivate: true,
    };

    console.log("✅ Nuova nota creata:", newNote);

    return NextResponse.json({
      success: true,
      note: newNote,
      message: "Nota salvata con successo",
    });
  } catch (error) {
    console.error("Errore creazione nota:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno",
      },
      { status: 500 }
    );
  }
}

function getMockNotes(conversationId: string) {
  const notes: { [key: string]: any[] } = {
    "!ojt0tXlnDqkk4rewdhXW:beeper.local": [
      {
        id: "note_1",
        content:
          "Gruppo molto attivo per l'organizzazione tornei. Clienti premium del negozio Roma.",
        createdBy: "admin",
        createdAt: "2025-09-17T10:30:00Z",
        isPrivate: true,
      },
      {
        id: "note_2",
        content: "Prenotare sala grande per torneo Magic del 25 ottobre",
        createdBy: "operatore1",
        createdAt: "2025-09-18T08:15:00Z",
        isPrivate: true,
      },
    ],
    "@mario_rossi:telegram": [
      {
        id: "note_3",
        content:
          "Cliente interessato a PlayStation 5. Avvisare quando arriva nuovo stock.",
        createdBy: "operatore2",
        createdAt: "2025-09-18T09:45:00Z",
        isPrivate: true,
      },
    ],
    "!abc123xyz789:beeper.local": [
      {
        id: "note_4",
        content:
          "Staff Viterbo molto attivo nella vendita console. Ottimi risultati Q3.",
        createdBy: "manager",
        createdAt: "2025-09-18T11:20:00Z",
        isPrivate: true,
      },
    ],
  };

  return notes[conversationId] || [];
}
