// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Proteggi route admin solo per admin
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Proteggi API sensibili
    if (pathname.startsWith('/api/admin') && token?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accesso non autorizzato' },
        { status: 403 }
      )
    }

    // Verifica che l'utente sia attivo
    if (token && !token?.isActive) {
      return NextResponse.redirect(new URL('/auth/signin?error=AccountDisabled', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // ROUTE PUBBLICHE - NON RICHIEDONO AUTENTICAZIONE
        if (
          pathname === '/' ||                          // Homepage
          pathname.startsWith('/auth') ||              // Pagine auth
          pathname.startsWith('/_next') ||             // File Next.js
          pathname.startsWith('/api/auth') ||          // API NextAuth
          pathname.startsWith('/api/test') ||          // API di test
          pathname === '/favicon.ico' ||               // Favicon
          pathname.startsWith('/images/') ||           // Immagini
          pathname.startsWith('/public/')              // File pubblici
        ) {
          return true
        }

        // ROUTE PROTETTE - RICHIEDONO AUTENTICAZIONE
        return !!token
      }
    }
  }
)

// Configura quali path sono protetti dal middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)'
  ]
}