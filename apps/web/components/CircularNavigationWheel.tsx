"use client";

import { useRouter } from 'next/navigation';

const segments = [
  { id: 'jobs', label: 'Jobs', color: '#1B5E20', path: '/jobs' },
  { id: 'grants', label: 'Grants', color: '#F57C00', path: '/grants' },
  { id: 'training', label: 'Training', color: '#00ACC1', path: '/training' },
  { id: 'savings', label: 'Savings', color: '#7CB342', path: '/savings' },
  { id: 'services', label: 'Services', color: '#FF7043', path: '/services' },
];

export default function CircularNavigationWheel() {
  const router = useRouter();
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full transition-transform"
        role="navigation"
        aria-label="Module navigation wheel"
      >
        {segments.map((segment, index) => {
          const angle = (360 / segments.length) * index - 90;
          const nextAngle = (360 / segments.length) * (index + 1) - 90;
          const startX = 100 + 80 * Math.cos((angle * Math.PI) / 180);
          const startY = 100 + 80 * Math.sin((angle * Math.PI) / 180);
          const endX = 100 + 80 * Math.cos((nextAngle * Math.PI) / 180);
          const endY = 100 + 80 * Math.sin((nextAngle * Math.PI) / 180);
          const pathData = `M 100 100 L ${startX} ${startY} A 80 80 0 0 1 ${endX} ${endY} Z`;
          const midAngle = angle + 360 / segments.length / 2;
          const textX = 100 + 60 * Math.cos((midAngle * Math.PI) / 180);
          const textY = 100 + 60 * Math.sin((midAngle * Math.PI) / 180);
          return (
            <g key={segment.id}>
              <path
                d={pathData}
                fill={segment.color}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--accent)]"
                onClick={() => router.push(segment.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(segment.path);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Navigate to ${segment.label}`}
              />
              <text
                x={textX}
                y={textY}
                fill="white"
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="middle"
                pointerEvents="none"
              >
                {segment.label}
              </text>
            </g>
          );
        })}
        <circle cx="100" cy="100" r="30" fill="white" stroke="#1B5E20" strokeWidth="3" />
        <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill="#1B5E20">
          CycleBreaker
        </text>
      </svg>
      <div className="sr-only">
        <nav aria-label="Module navigation">
          <ul>
            {segments.map((segment) => (
              <li key={segment.id}>
                <a href={segment.path}>{segment.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
