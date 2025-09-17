// src/lib/models/User.ts
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  role: { 
    type: String, 
    enum: ['admin', 'operator'], 
    default: 'operator' 
  },
  store: { 
    type: String, 
    enum: [
      'Roma', 'Foggia', 'Manfredonia', 'Cosenza', 'Viterbo', 
      'Torino', 'Trapani', 'Parma', 'Erba', 'Bari'
    ], 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: {
    type: Date,
    default: null
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
  timestamps: true // Aggiorna automaticamente createdAt e updatedAt
});

// Indici per performance
UserSchema.index({ email: 1 });
UserSchema.index({ store: 1, isActive: 1 });

// Middleware per aggiornare updatedAt
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);