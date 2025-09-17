// src/lib/models/Note.ts
import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  chatMetadataId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ChatMetadata', 
    required: true,
    index: true
  },
  content: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 5000
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Tipologia nota
  type: {
    type: String,
    enum: ['general', 'customer_info', 'order_info', 'technical', 'reminder'],
    default: 'general'
  },
  
  // Visibilità e stato
  isPrivate: { 
    type: Boolean, 
    default: true 
  },
  isPinned: { 
    type: Boolean, 
    default: false 
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // Metadata aggiuntivi
  tags: [{
    type: String,
    trim: true
  }],
  
  // Riferimenti esterni
  relatedOrderId: {
    type: String,
    default: null
  },
  
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

// Indici per performance
NoteSchema.index({ chatMetadataId: 1, createdAt: -1 });
NoteSchema.index({ author: 1, createdAt: -1 });
NoteSchema.index({ isPinned: 1, createdAt: -1 });
NoteSchema.index({ type: 1, createdAt: -1 });
NoteSchema.index({ content: 'text' }); // Per ricerca testuale

// Middleware per aggiornare updatedAt
NoteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Metodi di istanza
NoteSchema.methods.togglePin = function() {
  this.isPinned = !this.isPinned;
  return this.save();
};

NoteSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

// Metodi statici
NoteSchema.statics.findByChatId = function(chatMetadataId: string, options: any = {}) {
  const query = { 
    chatMetadataId: new mongoose.Types.ObjectId(chatMetadataId),
    isArchived: { $ne: true }
  };
  
  return this.find(query)
    .populate('author', 'name email store')
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(options.limit || 50);
};

NoteSchema.statics.findPinned = function(chatMetadataId: string) {
  return this.find({
    chatMetadataId: new mongoose.Types.ObjectId(chatMetadataId),
    isPinned: true,
    isArchived: { $ne: true }
  })
  .populate('author', 'name email store')
  .sort({ createdAt: -1 });
};

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);