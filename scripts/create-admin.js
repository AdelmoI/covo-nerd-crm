// scripts/create-admin-fixed.js
// Versione senza dotenv - inserisci la stringa MongoDB direttamente

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// La tua stringa MongoDB
const MONGODB_URI = "mongodb+srv://ilcovodelnerdfg_db_user:iFibNOF9wHyRCR9Y@covo-nerd-cluster.wqhmfzj.mongodb.net/covo-nerd-crm?retryWrites=true&w=majority&appName=covo-nerd-cluster"

// Schema User (copia del modello)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'operator'], default: 'operator' },
  stores: [{ type: String }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

async function createAdmin() {
  try {
    // Connetti al database
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connesso a MongoDB')

    // Verifica se esiste già un admin
    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      console.log('❌ Esiste già un utente admin:', existingAdmin.email)
      process.exit(1)
    }

    // Dati admin di default
    const adminData = {
      name: 'Amministratore CRM',
      email: 'admin@ilcovodelnerd.com',
      password: 'admin123456', // CAMBIA QUESTA PASSWORD!
      role: 'admin',
      stores: [
        'Roma', 'Foggia', 'Manfredonia', 'Cosenza', 'Viterbo',
        'Torino', 'Trapani', 'Parma', 'Erba', 'Bari'
      ], // Accesso a tutti i negozi
      isActive: true
    }

    // Hash password
    adminData.password = await bcrypt.hash(adminData.password, 12)

    // Crea admin
    const admin = await User.create(adminData)
    
    console.log('✅ Utente admin creato con successo!')
    console.log('📧 Email:', admin.email)
    console.log('🔑 Password:', 'admin123456')
    console.log('⚠️  IMPORTANTE: Cambia la password dopo il primo login!')
    console.log('🏪 Negozi:', admin.stores.join(', '))

  } catch (error) {
    console.error('❌ Errore creazione admin:', error)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Connessione MongoDB chiusa')
  }
}

createAdmin()