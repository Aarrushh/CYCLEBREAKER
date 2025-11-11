'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CircularNavigationWheel from '@/components/CircularNavigationWheel'
import ModulesGrid from '@/components/ModulesGrid'

export default function HomePage() {
  const [hasProfile, setHasProfile] = useState<boolean>(false)
  const [lastModule, setLastModule] = useState<string | null>(null)

  useEffect(() => {
    try {
      const id = localStorage.getItem('cyclebreaker_profile_id')
      if (!id) {
        // First-time visitors are guided to onboarding
        window.location.replace('/onboarding')
        return
      }
      setHasProfile(true)
      setLastModule(localStorage.getItem('cb_last_module'))
    } catch {}
  }, [])

  return (
    <div className="container mx-auto px-md py-lg">
      <section className="text-center mb-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[color:var(--foreground)] mb-sm">CycleBreaker</h1>
        <p className="text-lg text-[color:var(--foreground)]/80 mb-lg">
          Find grants, training, services and jobs aligned to your situation.
        </p>
        <div className="flex items-center justify-center gap-sm">
          <Link href="/onboarding" className="bg-[color:var(--primary)] text-white px-4 py-2 rounded-lg">Start Onboarding</Link>
          {hasProfile && (
            <Link href="/feed" className="bg-gray-900 text-white px-4 py-2 rounded-lg">View My Matches</Link>
          )}
          {lastModule && (
            <Link href={lastModule} className="bg-[color:var(--accent)] text-white px-4 py-2 rounded-lg">Continue {lastModule.replace('/','')}</Link>
          )}
        </div>
      </section>

      <section className="mb-2xl">
        <h2 className="text-2xl font-bold text-center text-[color:var(--foreground)] mb-lg">Explore Modules</h2>
        <ModulesGrid />
      </section>

      <section className="mb-2xl">
        <h2 className="text-2xl font-bold text-center text-[color:var(--foreground)] mb-lg">Quick Navigation</h2>
        <CircularNavigationWheel />
      </section>
    </div>
  )
}
