import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'Vows & Co — Digital Wedding Invitations',
  description: 'Beautiful digital wedding invitation templates. Customize, share, and collect RSVPs instantly.',
  openGraph: {
    title: 'Vows & Co — Digital Wedding Invitations',
    description: 'Beautiful digital wedding invitation templates.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
