"use client"

import { useState } from "react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"

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
    } finally {
      setLoading(false)
    }
  }

  function useSuggested() {
    if (!result) return
    localStorage.setItem("cb_profile_id", "") // clear current id
    const values = { ...result }
    // Save the suggested profile immediately
    fetch(`${API_BASE}/profiles`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error || "Save failed")
        localStorage.setItem("cb_profile_id", data.id)
        window.location.href = "/feed"
      })
      .catch((e) => setError(e.message))
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

