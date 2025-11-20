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
    } catch { }
  }, [])

  return (
    <div className="container mx-auto px-md py-lg">
      <section className="text-center mb-2xl pt-xl">
        <div className="inline-block p-1 rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] mb-md">
          <div className="bg-white rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider">
            Beta v0.1
          </div>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] mb-sm drop-shadow-sm">
          CycleBreaker
        </h1>
        <p className="text-xl text-[color:var(--foreground)]/80 mb-xl max-w-2xl mx-auto leading-relaxed">
          Breaking the cycle of poverty through <span className="font-bold text-[color:var(--primary)]">opportunity</span>.
          Find grants, jobs, and training matched to you.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-md">
          <Link href="/onboarding" className="w-full sm:w-auto bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--success)] text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
            Start Onboarding
          </Link>
          {hasProfile && (
            <Link href="/feed" className="w-full sm:w-auto glass text-[color:var(--foreground)] px-8 py-4 rounded-xl font-bold hover:bg-white/50 transition-all">
              View Matches
            </Link>
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
