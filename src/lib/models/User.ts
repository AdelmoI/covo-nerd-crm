// src/lib/models/User.ts
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true, 
    select: false // Non restituire la password nelle query di default
  },
  role: { 
    type: String, 
    enum: ['admin', 'operator'], 
    default: 'operator' 
  },
  // Rimuoviamo stores - accesso centralizzato per tutti
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  }
}, { 
  timestamps: true 
})

// Indice per ricerca veloce per email
userSchema.index({ email: 1 })

export default mongoose.models.User || mongoose.model('User', userSchema)