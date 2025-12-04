import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/sidebar'
import Breadcrumbs from '@/components/breadcrumbs'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Outlivion Dashboard',
  description: 'Admin panel для управления Outlivion VPN',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              <div className="p-6">
                <Breadcrumbs />
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

