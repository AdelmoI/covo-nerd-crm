// src/lib/models/Tag.ts
import mongoose from 'mongoose';

// Schema per i Tag globali
const TagSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 1,
    maxlength: 50
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  color: { 
    type: String, 
    default: '#1D70B3',
    match: /^#[0-9A-F]{6}$/i // Valida formato colore hex
  },
  description: { 
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  category: {
    type: String,
    enum: ['customer', 'order', 'technical', 'priority', 'status', 'general'],
    default: 'general'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isSystemTag: {
    type: Boolean,
    default: false // I tag di sistema non possono essere eliminati
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
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

// Schema per l'associazione Chat-Tag
const ChatTagSchema = new mongoose.Schema({
  chatMetadataId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ChatMetadata', 
    required: true 
  },
  tagId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tag', 
    required: true 
  },
  addedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  addedAt: { 
    type: Date, 
    default: Date.now 
  },
  // Metadati aggiuntivi per il tag applicato a questa chat specifica
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  }
});

// Indici per Tag
TagSchema.index({ name: 1 }, { unique: true });
TagSchema.index({ category: 1, isActive: 1 });
TagSchema.index({ createdBy: 1, createdAt: -1 });
TagSchema.index({ usageCount: -1 });

// Indici per ChatTag
ChatTagSchema.index({ chatMetadataId: 1, tagId: 1 }, { unique: true }); // Evita duplicati
ChatTagSchema.index({ chatMetadataId: 1, addedAt: -1 });
ChatTagSchema.index({ tagId: 1, addedAt: -1 });
ChatTagSchema.index({ addedBy: 1, addedAt: -1 });

// Middleware per Tag
TagSchema.pre('save', function(next) {
  // Assicurati che displayName sia impostato se non fornito
  if (!this.displayName && this.name) {
    this.displayName = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }
  this.updatedAt = new Date();
  next();
});

// Middleware per ChatTag - incrementa usageCount quando viene aggiunto un tag
ChatTagSchema.post('save', async function(doc) {
  try {
    await Tag.findByIdAndUpdate(doc.tagId, { $inc: { usageCount: 1 } });
  } catch (error) {
    console.error('Error updating tag usage count:', error);
  }
});

// Middleware per ChatTag - decrementa usageCount quando viene rimosso un tag
ChatTagSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  try {
    await Tag.findByIdAndUpdate(doc.tagId, { $inc: { usageCount: -1 } });
  } catch (error) {
    console.error('Error updating tag usage count:', error);
  }
});

// Metodi statici per Tag
TagSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

TagSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isActive: true }).sort({ name: 1 });
};

TagSchema.statics.getMostUsed = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ usageCount: -1, name: 1 })
    .limit(limit);
};

// Metodi statici per ChatTag
ChatTagSchema.statics.findByChat = function(chatMetadataId: string) {
  return this.find({ chatMetadataId })
    .populate('tagId', 'name displayName color category')
    .populate('addedBy', 'name email')
    .sort({ addedAt: -1 });
};

ChatTagSchema.statics.findByTag = function(tagId: string) {
  return this.find({ tagId })
    .populate('chatMetadataId')
    .populate('addedBy', 'name email')
    .sort({ addedAt: -1 });
};

// Esporta entrambi i modelli
export const Tag = mongoose.models.Tag || mongoose.model('Tag', TagSchema);
export const ChatTag = mongoose.models.ChatTag || mongoose.model('ChatTag', ChatTagSchema);