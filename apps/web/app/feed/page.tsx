"use client"

import { useEffect, useState } from "react"
import type { MatchResult } from "@cyclebreaker/shared"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"

export default function FeedPage() {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const url = new URL(window.location.href)
    const profileIdFromUrl = url.searchParams.get('profile_id')
    const profileIdFromStorage = localStorage.getItem("cyclebreaker_profile_id")
    const id = profileIdFromUrl || profileIdFromStorage
    
    if (!id) {
      setError("No profile found. Please complete onboarding first.")
      setLoading(false)
      return
    }
    
    fetch(`${API_BASE}/feed?profile_id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error || "Failed to load feed")
        setMatches(data.matches || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (error) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4 text-red-600">Error Loading Opportunities</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <a href="/onboarding" className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Complete Onboarding
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Your Opportunities</h1>
        <p className="text-gray-600">
          {loading ? 'Loading your matches...' : `Found ${matches.length} opportunities matched to your profile`}
        </p>
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading opportunities...</p>
        </div>
      )}
      
      {!loading && matches.length === 0 && (
        <div className="card text-center">
          <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
          <p className="text-gray-600 mb-4">We couldn't find any opportunities that match your current profile.</p>
          <a href="/onboarding" className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Update Your Profile
          </a>
        </div>
      )}
      
      <div className="space-y-4">
        {matches.map((match, idx) => (
          <div key={idx} className="card border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{match.opportunity.title}</h3>
                <p className="text-sm text-gray-600">{match.opportunity.organization}</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  match.opportunity.category === 'grant' ? 'bg-green-100 text-green-800' :
                  match.opportunity.category === 'job' ? 'bg-blue-100 text-blue-800' :
                  match.opportunity.category === 'training' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {match.opportunity.category.charAt(0).toUpperCase() + match.opportunity.category.slice(1)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">
                  {Math.round(match.match_score * 100)}% match
                </div>
                {match.opportunity.value_amount && (
                  <div className="text-sm text-gray-600">
                    R{match.opportunity.value_amount.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            
            {match.opportunity.deadline && (
              <div className="mb-3">
                <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                  Deadline: {new Date(match.opportunity.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {match.why.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Why this matches you:</h4>
                <ul className="space-y-1">
                  {match.why.map((reason, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {match.opportunity.required_documents && match.opportunity.required_documents.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Required documents:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {match.opportunity.required_documents.map((doc, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <a 
                href={match.opportunity.apply_url || match.opportunity.source_url} 
                target="_blank" 
                rel="noreferrer"
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {match.opportunity.apply_url ? 'Apply Now' : 'Learn More'}
              </a>
              <a 
                href={match.opportunity.source_url} 
                target="_blank" 
                rel="noreferrer"
                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                View Source
              </a>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              Last verified: {match.opportunity.provenance.last_verified_at ? 
                new Date(match.opportunity.provenance.last_verified_at).toLocaleDateString() : 'Unknown'
              }
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

