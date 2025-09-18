// src/app/api/conversations/[id]/customer/route.ts
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
    console.log("🔍 Richiesta info cliente per conversazione:", conversationId);

    // TODO: Implementare logica per estrarre info cliente da conversazione
    // Per ora restituiamo dati mock basati sull'ID
    const mockCustomers = getMockCustomerInfo(conversationId);

    return NextResponse.json({
      success: true,
      customer: mockCustomers,
    });
  } catch (error) {
    console.error("Errore recupero info cliente:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno",
      },
      { status: 500 }
    );
  }
}

function getMockCustomerInfo(conversationId: string) {
  const customers: { [key: string]: any } = {
    "!ojt0tXlnDqkk4rewdhXW:beeper.local": {
      name: "Gruppo Tornei",
      company: "Il Covo del Nerd",
      location: "Roma, Italia",
      orders: 15,
      lastOrder: "12/09/2025",
    },
    "@mario_rossi:telegram": {
      name: "Mario Rossi",
      email: "mario.rossi@email.com",
      phone: "+39 333 123 4567",
      location: "Roma, RM",
      orders: 3,
      lastOrder: "05/09/2025",
    },
    gamer_pro_insta: {
      name: "GamerPro",
      email: "gamer.pro@gmail.com",
      location: "Milano, MI",
      orders: 7,
      lastOrder: "15/09/2025",
    },
    "!abc123xyz789:beeper.local": {
      name: "Staff Viterbo",
      company: "Il Covo del Nerd",
      location: "Viterbo, VT",
      orders: 8,
      lastOrder: "18/09/2025",
    },
    staff_covo_vendetta: {
      name: "Staff Interno",
      company: "Il Covo del Nerd",
      location: "Sede Centrale",
      orders: 0,
      lastOrder: "N/A",
    },
  };

  return (
    customers[conversationId] || {
      name: "Cliente",
      location: "Non specificata",
      orders: 0,
      lastOrder: "N/A",
    }
  );
}
