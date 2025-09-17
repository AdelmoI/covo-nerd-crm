// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'

// GET - Lista tutti gli utenti (solo admin)
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Accesso non autorizzato' },
                { status: 403 }
            )
        }

        await connectDB()

        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 })

        return NextResponse.json({
            success: true,
            users: users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                stores: user.stores,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }))
        })
    } catch (error) {
        console.error('Errore recupero utenti:', error)
        return NextResponse.json(
            { error: 'Errore server' },
            { status: 500 }
        )
    }
}

// POST - Crea nuovo utente (solo admin)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Accesso non autorizzato' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { name, email, password, role, stores } = body

        // Validazioni
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: 'Tutti i campi sono obbligatori' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'La password deve essere di almeno 6 caratteri' },
                { status: 400 }
            )
        }

        await connectToDatabase()

        // Verifica email non duplicata
        const existingUser = await User.findOne({ email: email.toLowerCase() })
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email già registrata' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Crea utente
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            stores: stores || [],
            isActive: true
        })

        return NextResponse.json({
            success: true,
            message: 'Utente creato con successo',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                stores: user.stores,
                isActive: user.isActive
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Errore creazione utente:', error)
        return NextResponse.json(
            { error: 'Errore server' },
            { status: 500 }
        )
    }
}