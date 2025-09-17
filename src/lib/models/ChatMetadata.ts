// src/lib/models/ChatMetadata.ts
import mongoose from 'mongoose';

const ChatMetadataSchema = new mongoose.Schema({
  // Identificatori Beeper
  beeperChatId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  beeperRoomId: { 
    type: String, 
    required: true 
  },
  
  // Informazioni cliente
  customerName: { 
    type: String,
    trim: true,
    default: 'Cliente Sconosciuto'
  },
  customerPhone: { 
    type: String,
    trim: true,
    default: null
  },
  customerEmail: { 
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  customerPlatform: {
    type: String,
    enum: ['whatsapp', 'telegram', 'instagram', 'facebook', 'discord', 'other'],
    default: 'other'
  },
  
  // Informazioni ordine
  orderPlatform: { 
    type: String, 
    enum: ['store', 'website'], 
    default: null 
  },
  orderNumber: { 
    type: String,
    trim: true,
    default: null 
  },
  orderValue: { 
    type: Number, 
    min: 0,
    default: null 
  },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], 
    default: null 
  },
  orderDate: {
    type: Date,
    default: null
  },
  
  // Gestione interna CRM
  assignedStore: { 
    type: String, 
    enum: [
      'Roma', 'Foggia', 'Manfredonia', 'Cosenza', 'Viterbo', 
      'Torino', 'Trapani', 'Parma', 'Erba', 'Bari'
    ],
    default: null
  },
  assignedOperator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'], 
    default: 'normal' 
  },
  status: { 
    type: String, 
    enum: ['new', 'in_progress', 'waiting_customer', 'resolved', 'closed'], 
    default: 'new' 
  },
  
  // Metadati conversazione
  firstMessageAt: {
    type: Date,
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: null
  },
  messageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Sync e tracking
  lastBeeperSync: { 
    type: Date, 
    default: Date.now 
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'error'],
    default: 'pending'
  },
  syncErrors: [{
    error: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indici per performance e ricerche
ChatMetadataSchema.index({ beeperChatId: 1 }, { unique: true });
ChatMetadataSchema.index({ assignedStore: 1, status: 1 });
ChatMetadataSchema.index({ lastMessageAt: -1 });
ChatMetadataSchema.index({ status: 1, priority: 1 });
ChatMetadataSchema.index({ customerName: 'text', customerEmail: 'text', customerPhone: 'text' });
ChatMetadataSchema.index({ orderNumber: 1 });
ChatMetadataSchema.index({ createdAt: -1 });

// Middleware per aggiornare updatedAt
ChatMetadataSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Metodi statici utili
ChatMetadataSchema.statics.findByBeeperChatId = function(chatId: string) {
  return this.findOne({ beeperChatId: chatId });
};

ChatMetadataSchema.statics.findByStore = function(store: string) {
  return this.find({ assignedStore: store });
};

ChatMetadataSchema.statics.findUnassigned = function() {
  return this.find({ 
    $or: [
      { assignedStore: null },
      { assignedOperator: null }
    ]
  });
};

export default mongoose.models.ChatMetadata || mongoose.model('ChatMetadata', ChatMetadataSchema);