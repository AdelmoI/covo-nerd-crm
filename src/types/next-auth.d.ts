// src/types/next-auth.d.ts
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'admin' | 'operator'
      stores: string[]
      isActive: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: 'admin' | 'operator'
    stores: string[]
    isActive: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'operator'
    stores: string[]
    isActive: boolean
  }
}