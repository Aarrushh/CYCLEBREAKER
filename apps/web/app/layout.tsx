import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import OfflineIndicatorBanner from '@/components/OfflineIndicatorBanner'
import { Bell, Settings, Home, User, HelpCircle } from 'lucide-react'
import ResponsivePreviewToggle from '@/components/ResponsivePreviewToggle.client'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata = {
  title: 'CycleBreaker',
  description: 'Breaking the cycle of poverty through opportunity',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CycleBreaker',
  },
}

export const viewport = {
  themeColor: '#1B5E20',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <OfflineIndicatorBanner />
        <header className="sticky top-0 z-40 glass px-md py-sm flex items-center justify-between mb-md">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[color:var(--primary)] rounded-full flex items-center justify-center text-white font-bold text-sm">CB</div>
            <span className="font-bold text-lg text-[color:var(--foreground)] hidden sm:inline">CycleBreaker</span>
          </Link>
          <div className="flex items-center gap-sm">
            <ResponsivePreviewToggle />
            <button className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 rounded-full" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </button>
            <button className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 rounded-full" aria-label="Settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
        <main className="min-h-[calc(100vh-120px)]">{children}</main>
        <nav className="fixed bottom-0 left-0 right-0 z-40 glass sm:hidden pb-safe">
          <div className="flex justify-around items-center py-sm">
            <Link href="/" className="flex flex-col items-center gap-1 min-h-[44px] min-w-[44px] justify-center">
              <Home className="w-6 h-6" />
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center gap-1 min-h-[44px] min-w-[44px] justify-center">
              <User className="w-6 h-6" />
              <span className="text-xs">Profile</span>
            </Link>
            <Link href="/help" className="flex flex-col items-center gap-1 min-h-[44px] min-w-[44px] justify-center">
              <HelpCircle className="w-6 h-6" />
              <span className="text-xs">Help</span>
            </Link>
          </div>
        </nav>
      </body>
    </html>
  )
}
