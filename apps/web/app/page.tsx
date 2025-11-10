'use client'

import dynamic from 'next/dynamic'
import CircularNavigationWheel from '@/components/CircularNavigationWheel'

const CircularGallery = dynamic(() => import('@/components/circular/CircularGallery'), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg" />,
})

export default function HomePage() {
  return (
    <div className="container mx-auto px-md py-lg">
      <section className="text-center mb-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[color:var(--foreground)] mb-sm">Welcome Back!</h1>
        <div className="relative w-32 h-32 mx-auto mb-md">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#E0E0E0" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1B5E20" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset="70" className="transition-all" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-[color:var(--primary)]">75%</div>
              <div className="text-xs text-gray-600">Progress</div>
            </div>
          </div>
        </div>
        <p className="text-lg text-[color:var(--foreground)]/80 mb-lg">You're breaking the cycle. Keep going!</p>
      </section>

      <section className="mb-2xl">
        <div className="h-[400px] rounded-lg overflow-hidden">
          <CircularGallery bend={3} textColor="#FAFAFA" borderRadius={0.08} font="bold 30px Inter" scrollEase={0.02} />
        </div>
      </section>

      <section className="mb-2xl">
        <h2 className="text-2xl font-bold text-center text-[color:var(--foreground)] mb-lg">Explore Opportunities</h2>
        <CircularNavigationWheel />
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-md">
        <div className="bg-white rounded-lg shadow-md p-md text-center">
          <div className="text-3xl font-bold text-[color:var(--primary)] mb-xs">12</div>
          <div className="text-sm text-gray-600">New Jobs</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-md text-center">
          <div className="text-3xl font-bold text-[#F57C00] mb-xs">5</div>
          <div className="text-sm text-gray-600">Grants Available</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-md text-center col-span-2 sm:col-span-1">
          <div className="text-3xl font-bold text-[#00ACC1] mb-xs">3</div>
          <div className="text-sm text-gray-600">Training Programs</div>
        </div>
      </section>
    </div>
  )
}
