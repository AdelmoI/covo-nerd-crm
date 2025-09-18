// src/app/api/beeper/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔄 Beeper test API called...');
  
  try {
    // Per ora usiamo sempre mock data fino a quando non risolviamo l'integrazione MCP
    const useMockData = true; // Forziamo mock data
    
    console.log('🔄 Using mock Beeper data for testing...');
    return await testWithMockData();
    
  } catch (error) {
    console.error('❌ Beeper test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function testWithMockData() {
  const startTime = Date.now();
  
  try {
    // Simula dati di test mock
    const mockChats = [
      {
        id: 'whatsapp_393401234567',
        name: 'Marco Pellegrini',
        platform: 'WhatsApp',
        lastMessage: 'Salve, vorrei informazioni sulla RTX 4090 disponibile nel vostro negozio di Roma',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'telegram_87654321', 
        name: 'GamerGirl23 (Laura)',
        platform: 'Telegram',
        lastMessage: 'Perfetto, grazie per la disponibilità! Passo a ritirare domani',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'whatsapp_393351112222',
        name: 'Tech Solutions SRL', 
        platform: 'WhatsApp',
        lastMessage: 'Buongiorno, stiamo riscontrando un problema con il laptop acquistato la settimana scorsa',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Simula delay di rete
    await new Promise(resolve => setTimeout(resolve, 500));

    const connectionTest = {
      success: true,
      initialized: true,
      toolsCount: 5,
      chatsCount: mockChats.length
    };

    return NextResponse.json({
      success: true,
      mode: 'mock',
      data: {
        connection: connectionTest,
        chats: mockChats.map(c => ({
          id: c.id,
          name: c.name,
          platform: c.platform,
          lastMessage: c.lastMessage.substring(0, 50) + '...',
          timestamp: c.timestamp
        }))
      },
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      mode: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST per testare l'invio di messaggi (mock)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, message } = body;
    
    if (!chatId || !message) {
      return NextResponse.json({
        success: false,
        error: 'chatId and message are required'
      }, { status: 400 });
    }

    // Simula invio messaggio
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`📤 Mock message sent to ${chatId}: ${message}`);
    
    return NextResponse.json({
      success: true,
      mode: 'mock',
      chatId,
      message,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}