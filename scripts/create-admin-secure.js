// scripts/create-admin-secure.js
// USO: node scripts/create-admin-secure.js

require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Verifica che le variabili d'ambiente esistano
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI non trovata nel .env.local')
  process.exit(1)
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'operator'], default: 'operator' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connesso a MongoDB')

    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      console.log('❌ Esiste già un utente admin:', existingAdmin.email)
      process.exit(1)
    }

    const adminData = {
      name: 'Amministratore CRM',
      email: 'admin@ilcovodelnerd.com',
      password: await bcrypt.hash('admin123456', 12),
      role: 'admin',
      isActive: true
    }

    const admin = await User.create(adminData)
    
    console.log('✅ Utente admin creato con successo!')
    console.log('📧 Email:', admin.email)
    console.log('🔑 Password: admin123456')
    console.log('⚠️  IMPORTANTE: Cambia la password dopo il primo login!')

  } catch (error) {
    console.error('❌ Errore creazione admin:', error)
  } finally {
    await mongoose.connection.close()
  }
}

createAdmin()