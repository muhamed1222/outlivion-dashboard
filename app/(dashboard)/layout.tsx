import { Navbar } from '@/components/layout/Navbar'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-dashboard py-8">
        {children}
      </main>
    </div>
  )
}

