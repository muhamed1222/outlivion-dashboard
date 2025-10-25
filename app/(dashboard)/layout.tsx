import { Navbar } from '@/components/layout/Navbar'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="container-dashboard py-6">
        {children}
      </main>
    </div>
  )
}

