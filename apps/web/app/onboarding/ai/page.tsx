"use client"

import { useState } from "react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE

export default function AIOnboardingPage() {
  const [input, setInput] = useState("")
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSuggest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      if (!API_BASE) throw new Error('API not configured')
      const res = await fetch(`${API_BASE}/profiles/sort`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to get suggestion")
      setResult(data.profile)
    } catch (e: any) {
      setError(e.message)
      // queue error for later diagnostics
      const q = JSON.parse(localStorage.getItem('cb_ai_error_queue') || '[]')
      q.push({ ts: Date.now(), action: 'suggest', error: String(e?.message || e) })
      localStorage.setItem('cb_ai_error_queue', JSON.stringify(q))
    } finally {
      setLoading(false)
    }
  }

  function useSuggested() {
    if (!result) return
    try {
      const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string
      localStorage.setItem('cyclebreaker_profile_id', id)
      localStorage.setItem('cyclebreaker_profile_source', 'local')
      localStorage.setItem('cb_profile_values', JSON.stringify(result))
      // If API exists, persist server-side as well (best-effort)
      if (API_BASE) {
        const values = { ...result }
        fetch(`${API_BASE}/profiles`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(values),
        }).catch((err) => {
          const q = JSON.parse(localStorage.getItem('cb_ai_error_queue') || '[]')
          q.push({ ts: Date.now(), action: 'save', error: String(err?.message || err) })
          localStorage.setItem('cb_ai_error_queue', JSON.stringify(q))
        })
      }
      window.location.href = '/feed'
    } catch (e: any) {
      setError(e.message || 'Failed to proceed')
    }
  }

  return (
    <main>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-[color:var(--foreground)] mb-sm">AI-assisted onboarding</h2>
        <p className="text-[color:var(--foreground)]/80 mb-sm">Paste your situation or goals. We will create a structured profile (no sensitive data needed).</p>
        <form onSubmit={onSuggest}>
          <textarea
            rows={8}
            placeholder="Example: I live in Khayelitsha, Western Cape. I lost my job, can start immediately. I can do cleaning or caregiving, speak English and Xhosa. I need help with grants and short courses to upskill."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div style={{ marginTop: 12 }}>
            <button className="bg-[color:var(--primary)] text-white px-4 py-2 rounded-lg" type="submit" disabled={loading || input.length < 10}>{loading ? 'Thinking…' : 'Suggest profile'}</button>
          </div>
        </form>
        {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
        {result && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mt-md">
            <h3 className="font-semibold text-[color:var(--foreground)] mb-sm">Suggested profile</h3>
            <pre className="text-sm bg-gray-50 p-2 rounded" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
            <button className="mt-sm bg-[color:var(--primary)] text-white px-4 py-2 rounded-lg" onClick={useSuggested}>Use this and continue</button>
          </div>
        )}
      </div>
    </main>
  )
}

