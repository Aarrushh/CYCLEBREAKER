"use client"

import Link from 'next/link'
import { Briefcase, BadgeDollarSign, GraduationCap, PiggyBank, HeartHandshake } from 'lucide-react'

const modules = [
  { id: 'jobs', label: 'Jobs', color: '#1B5E20', path: '/jobs', icon: Briefcase },
  { id: 'grants', label: 'Grants', color: '#F57C00', path: '/grants', icon: BadgeDollarSign },
  { id: 'training', label: 'Training', color: '#00ACC1', path: '/training', icon: GraduationCap },
  { id: 'savings', label: 'Savings', color: '#7CB342', path: '/savings', icon: PiggyBank },
  { id: 'services', label: 'Services', color: '#FF7043', path: '/services', icon: HeartHandshake },
]

export default function ModulesGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-md">
      {modules.map((m) => {
        const Icon = m.icon
        return (
          <Link
            key={m.id}
            href={m.path}
            className="bg-white rounded-lg shadow-md p-md flex flex-col items-center justify-center gap-sm hover:shadow-lg transition-shadow"
            style={{ borderTop: `4px solid ${m.color}` }}
          >
            <Icon className="w-8 h-8" color={m.color} />
            <div className="text-sm text-[color:var(--foreground)] font-medium">{m.label}</div>
          </Link>
        )
      })}
    </div>
  )
}