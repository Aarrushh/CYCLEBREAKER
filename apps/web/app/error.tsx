"use client"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <main style={{ padding: 24 }}>
          <div className="card">
            <h2>Something went wrong</h2>
            <p style={{ color: '#bbb' }}>{error?.message || 'Unknown error'}</p>
            <button onClick={() => reset()}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  )
}
