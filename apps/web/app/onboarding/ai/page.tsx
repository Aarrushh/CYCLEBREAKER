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
      <div className="card">
        <h2>AI-assisted onboarding</h2>
        <p>Paste your situation or goals. We will create a structured profile (no sensitive data needed).</p>
        <form onSubmit={onSuggest}>
          <textarea
            rows={8}
            placeholder="Example: I live in Khayelitsha, Western Cape. I lost my job, can start immediately. I can do cleaning or caregiving, speak English and Xhosa. I need help with grants and short courses to upskill."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={loading || input.length < 10}>{loading ? 'Thinking…' : 'Suggest profile'}</button>
          </div>
        </form>
        {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
        {result && (
          <div className="card">
            <h3>Suggested profile</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
            <button onClick={useSuggested}>Use this and continue</button>
          </div>
        )}
      </div>
    </main>
  )
}

