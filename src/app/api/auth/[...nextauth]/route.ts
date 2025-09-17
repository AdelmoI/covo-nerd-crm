// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e password sono richiesti')
        }

        try {
          await connectDB()
          
          // Cerca l'utente nel database
          const user = await User.findOne({ 
            email: credentials.email.toLowerCase() 
          }).select('+password')

          if (!user) {
            throw new Error('Credenziali non valide')
          }

          // Verifica se l'utente è attivo
          if (!user.isActive) {
            throw new Error('Account disabilitato. Contatta l\'amministratore.')
          }

          // Verifica password
          const isPasswordValid = await bcrypt.compare(
            credentials.password, 
            user.password
          )

          if (!isPasswordValid) {
            throw new Error('Credenziali non valide')
          }

          // Aggiorna ultimo login
          await User.findByIdAndUpdate(user._id, {
            lastLogin: new Date()
          })

          // Restituisci dati user per la sessione
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            stores: user.stores,
            isActive: user.isActive
          }
        } catch (error) {
          console.error('Errore autenticazione:', error)
          throw new Error(error instanceof Error ? error.message : 'Errore di login')
        }
      }
    })
  ],

  // Configurazione sessione
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 ore
  },

  // Configurazione JWT
  jwt: {
    maxAge: 8 * 60 * 60, // 8 ore
  },

  // Callbacks per gestire sessione e JWT
  callbacks: {
    async jwt({ token, user }) {
      // Persist additional user data in JWT
      if (user) {
        token.role = user.role
        token.stores = user.stores
        token.isActive = user.isActive
      }
      return token
    },
    
    async session({ session, token }) {
      // Include additional data in session
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.stores = token.stores as string[]
        session.user.isActive = token.isActive as boolean
      }
      return session
    }
  },

  // Pagine custom
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Eventi per logging
  events: {
    async signIn({ user }) {
      console.log(`Login effettuato: ${user.email}`)
    },
    async signOut({ token }) {
      console.log(`Logout effettuato: ${token.email}`)
    }
  }
}

// Esporta handlers per GET e POST
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }