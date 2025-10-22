export const metadata = {
  title: 'CycleBreaker',
  description: 'Personalized opportunity finder',
}

import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h1>CycleBreaker</h1>
            <nav style={{ display: 'flex', gap: 16 }}>
              <a href="/">Home</a>
              <a href="/onboarding">Onboarding</a>
              <a href="/feed">Feed</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}

