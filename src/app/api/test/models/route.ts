// src/app/api/test/models/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import ChatMetadata from '@/lib/models/ChatMetadata';
import Note from '@/lib/models/Note';
import { Tag, ChatTag } from '@/lib/models/Tag';

export async function POST() {
  try {
    await connectDB();
    
    console.log('🧪 Testing MongoDB models...');
    
    // Test 1: Creare un utente di test
    console.log('📝 Testing User model...');
    const testUser = new User({
      email: 'test@ilcovodelivro.com',
      password: 'password123',
      name: 'Operatore Test',
      role: 'operator',
      store: 'Roma'
    });
    
    // Verifica se l'utente esiste già, altrimenti crealo
    let user = await User.findOne({ email: testUser.email });
    if (!user) {
      user = await testUser.save();
      console.log('✅ User created:', user.name);
    } else {
      console.log('✅ User already exists:', user.name);
    }
    
    // Test 2: Creare un tag di test
    console.log('🏷️ Testing Tag model...');
    let tag = await Tag.findOne({ name: 'cliente-vip' });
    if (!tag) {
      tag = new Tag({
        name: 'cliente-vip',
        displayName: 'Cliente VIP',
        color: '#FFD700',
        description: 'Cliente importante con priorità alta',
        category: 'customer',
        createdBy: user._id
      });
      tag = await tag.save();
      console.log('✅ Tag created:', tag.displayName);
    } else {
      console.log('✅ Tag already exists:', tag.displayName);
    }
    
    // Test 3: Creare metadati chat di test
    console.log('💬 Testing ChatMetadata model...');
    const chatId = 'test-beeper-chat-123';
    let chatMetadata = await ChatMetadata.findOne({ beeperChatId: chatId });
    if (!chatMetadata) {
      chatMetadata = new ChatMetadata({
        beeperChatId: chatId,
        beeperRoomId: 'test-room-123',
        customerName: 'Mario Rossi',
        customerPhone: '+39 123 456 7890',
        customerEmail: 'mario.rossi@email.com',
        customerPlatform: 'whatsapp',
        assignedStore: 'Roma',
        assignedOperator: user._id,
        priority: 'high',
        status: 'new',
        messageCount: 5,
        firstMessageAt: new Date(),
        lastMessageAt: new Date()
      });
      chatMetadata = await chatMetadata.save();
      console.log('✅ ChatMetadata created for:', chatMetadata.customerName);
    } else {
      console.log('✅ ChatMetadata already exists for:', chatMetadata.customerName);
    }
    
    // Test 4: Creare una nota di test
    console.log('📋 Testing Note model...');
    const existingNote = await Note.findOne({ 
      chatMetadataId: chatMetadata._id,
      content: 'Cliente interessato a prodotti gaming per PC' 
    });
    
    if (!existingNote) {
      const note = new Note({
        chatMetadataId: chatMetadata._id,
        content: 'Cliente interessato a prodotti gaming per PC. Ha chiesto info su schede grafiche RTX 4080.',
        author: user._id,
        type: 'customer_info',
        isPinned: true,
        tags: ['gaming', 'schede-grafiche']
      });
      await note.save();
      console.log('✅ Note created');
    } else {
      console.log('✅ Note already exists');
    }
    
    // Test 5: Associare tag alla chat
    console.log('🔗 Testing ChatTag model...');
    const existingChatTag = await ChatTag.findOne({
      chatMetadataId: chatMetadata._id,
      tagId: tag._id
    });
    
    if (!existingChatTag) {
      const chatTag = new ChatTag({
        chatMetadataId: chatMetadata._id,
        tagId: tag._id,
        addedBy: user._id,
        notes: 'Cliente con alto valore, dare priorità massima'
      });
      await chatTag.save();
      console.log('✅ ChatTag created');
    } else {
      console.log('✅ ChatTag already exists');
    }
    
    // Test 6: Query di test per verificare le relazioni
    console.log('🔍 Testing model relationships...');
    
    // Trova chat con populate
    const populatedChat = await ChatMetadata.findById(chatMetadata._id)
      .populate('assignedOperator', 'name email store');
    
    // Trova note della chat
    const chatNotes = await Note.findByChatId(chatMetadata._id.toString());
    
    // Trova tag della chat
    const chatTags = await ChatTag.findByChat(chatMetadata._id.toString());
    
    // Trova tag più usati
    const mostUsedTags = await Tag.getMostUsed(5);
    
    console.log('✅ All model tests passed!');
    
    return NextResponse.json({
      success: true,
      message: 'All MongoDB models tested successfully',
      testResults: {
        user: {
          id: user._id,
          name: user.name,
          store: user.store
        },
        chat: {
          id: chatMetadata._id,
          customerName: populatedChat?.customerName,
          assignedOperator: populatedChat?.assignedOperator?.name,
          status: chatMetadata.status,
          priority: chatMetadata.priority
        },
        notes: {
          count: chatNotes.length,
          hasPinned: chatNotes.some(note => note.isPinned)
        },
        tags: {
          created: tag.displayName,
          chatTagsCount: chatTags.length,
          mostUsedCount: mostUsedTags.length
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Models test failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Models test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    // Statistiche dei modelli
    const userCount = await User.countDocuments();
    const chatCount = await ChatMetadata.countDocuments();
    const noteCount = await Note.countDocuments();
    const tagCount = await Tag.countDocuments();
    const chatTagCount = await ChatTag.countDocuments();
    
    return NextResponse.json({
      success: true,
      statistics: {
        users: userCount,
        chats: chatCount,
        notes: noteCount,
        tags: tagCount,
        chatTags: chatTagCount
      },
      message: 'Database models statistics'
    });
    
  } catch (error) {
    console.error('❌ Statistics query failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Statistics query failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}