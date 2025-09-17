// src/app/api/test/database/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    // Testa connessione database
    await connectDB();
    
    return NextResponse.json({
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      status: 'connected'
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}