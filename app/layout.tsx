import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Franco Tablero de Control',
  description: 'Sistema de gestión personal — Ostara · Hormiblock · Blockera · Granny',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Franco Tablero',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e3a5f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  )
}
