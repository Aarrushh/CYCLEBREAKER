"use client"

import { useEffect, useState } from "react"
import type { MatchResult } from "@cyclebreaker/shared"
import OpportunityCard from '@/components/OpportunityCard'
import { getSupabase } from "../../lib/supabase"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE
const HAS_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function FeedPage() {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSample, setIsSample] = useState(false)
  const [source, setSource] = useState<'local' | 'supabase' | null>(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    const profileIdFromUrl = url.searchParams.get('profile_id')
    const profileIdFromStorage = localStorage.getItem("cyclebreaker_profile_id")
    const id = profileIdFromUrl || profileIdFromStorage || 'demo'
    setSource((localStorage.getItem('cyclebreaker_profile_source') as any) || null)

    async function load() {
      try {
        if (API_BASE) {
          const r = await fetch(`${API_BASE}/feed?profile_id=${encodeURIComponent(id)}`)
          const data = await r.json()
          if (!r.ok) throw new Error(data?.error || 'Failed to load feed')
          setMatches(data.matches || [])
          return
        }
        // Fallback: static curated dataset
        setIsSample(true)
        const r2 = await fetch('/data/sa_opportunities.json')
        const list = await r2.json()
        const ms: MatchResult[] = (Array.isArray(list) ? list : []).map((o: any) => ({
          opportunity: o,
          match_score: o?.provenance?.freshness_score || 0.5,
          why: [],
          matched_profile_fields: [],
        }))
        setMatches(ms)
      } catch (e: any) {
        setError(e.message || 'Failed to load feed')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function syncToCloud() {
    try {
      const valsRaw = localStorage.getItem('cb_profile_values')
      if (!valsRaw) throw new Error('No local profile to sync')
      const values = JSON.parse(valsRaw)
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([values])
        .select('id')
        .single()
      if (error) throw error
      const id = data?.id
      if (id) {
        localStorage.setItem('cyclebreaker_profile_id', id)
        localStorage.setItem('cyclebreaker_profile_source', 'supabase')
        alert('Profile synced to cloud. Future results will be synced.')
      }
    } catch (e: any) {
      alert('Sync failed: ' + (e?.message || 'unknown'))
    }
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4 text-red-600">Error Loading Opportunities</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <a href="/onboarding" className="bg-[color:var(--primary)] text-white py-2 px-4 rounded-lg">
            Complete Onboarding
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-[color:var(--foreground)]">Your Opportunities</h1>
        <p className="text-gray-600">
          {loading ? 'Loading your matches...' : `Found ${matches.length} opportunities matched to your profile`}
        </p>
      </div>

      {/* Local-only notice and sample feed notice */}
      {!loading && (
        <div className="space-y-2 mb-4">
          {source === 'local' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-sm flex items-center justify-between">
              <span>Local-only profile: results are stored on this device and may not sync across devices.</span>
              {HAS_SUPABASE && (
                <button onClick={syncToCloud} className="ml-3 bg-amber-700 text-white px-3 py-1 rounded">Sync to cloud</button>
              )}
            </div>
          )}
          {isSample && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-3 text-sm">
              Showing sample opportunities. More tailored matches will appear when connected.
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--primary)]"></div>
          <p className="mt-2 text-gray-600">Loading opportunities...</p>
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
          <p className="text-gray-600 mb-4">We couldn't find any opportunities that match your current profile.</p>
          <a href="/onboarding" className="bg-[color:var(--primary)] text-white py-2 px-4 rounded-lg">
            Update Your Profile
          </a>
        </div>
      )}

      <div className="space-y-4">
        {matches.map((match, idx) => (
          <OpportunityCard
            key={idx}
            title={match.opportunity.title}
            org={match.opportunity.organization || 'Unknown'}
            category={match.opportunity.category as any}
            distance={undefined}
            deadline={match.opportunity.deadline ? new Date(match.opportunity.deadline).toLocaleDateString() : undefined}
            matchScore={Math.round((match.match_score || 0) * 100)}
            description={match.opportunity.title}
            matchedClauses={match.why || []}
            disqualifiers={[]}
            evidenceLinks={(match.opportunity.provenance?.evidence_links || []).map((url: string) => ({ text: 'Evidence', url }))}
            onSave={() => {}}
            onShare={() => {}}
            onApply={() => {}}
          />
        ))}
      </div>
    </main>
  )
}
