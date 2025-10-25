import { Navbar } from '@/components/layout/Navbar'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 py-6">
          <div className="container-dashboard">{children}</div>
        </main>
      </div>
    </div>
  )
}
