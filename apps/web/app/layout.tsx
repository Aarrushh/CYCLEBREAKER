export const metadata = {
  title: 'CycleBreaker',
  description: 'Personalized opportunity finder',
}

import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}

