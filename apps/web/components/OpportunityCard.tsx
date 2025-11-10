"use client";

import { useState } from 'react';

interface EvidenceLink { text: string; url: string }

interface OpportunityCardProps {
  title: string;
  org: string;
  category: 'job' | 'grant' | 'training' | 'service';
  distance?: string;
  deadline?: string;
  matchScore?: number;
  tags?: string[];
  description: string;
  matchedClauses?: string[];
  disqualifiers?: string[];
  evidenceLinks?: EvidenceLink[];
  onSave?: () => void;
  onShare?: () => void;
  onApply?: () => void;
  isSaved?: boolean;
}

const categoryColors: Record<string, string> = {
  job: '#1B5E20',
  grant: '#F57C00',
  training: '#00ACC1',
  service: '#7CB342',
};

export default function OpportunityCard(props: OpportunityCardProps) {
  const {
    title,
    org,
    category,
    distance,
    deadline,
    matchScore,
    tags = [],
    description,
    matchedClauses = [],
    disqualifiers = [],
    evidenceLinks = [],
    onSave,
    onShare,
    onApply,
    isSaved = false,
  } = props;

  const [saved, setSaved] = useState(isSaved);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative overflow-hidden bg-white shadow-md rounded-lg border border-gray-200">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: categoryColors[category] || '#1B5E20' }} />
      <div className="p-md pl-lg">
        <div className="flex items-start justify-between mb-sm">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[color:var(--foreground)] mb-xs">{title}</h3>
            <p className="text-sm text-gray-600">{org}</p>
          </div>
          {typeof matchScore === 'number' && (
            <div className="text-right text-sm font-medium text-[color:var(--primary)]">{matchScore}% match</div>
          )}
        </div>

        <p className="text-sm text-[color:var(--foreground)] mb-sm line-clamp-2">{description}</p>

        <div className="flex flex-wrap items-center gap-sm mb-md text-xs text-gray-600">
          {distance && <span>📍 {distance}</span>}
          {deadline && <span className="px-sm py-xs bg-[color:var(--warning)]/10 text-[color:var(--warning)] rounded-sm">Deadline: {deadline}</span>}
          {tags.map((tag, idx) => (
            <span key={idx} className="px-sm py-xs bg-gray-100 rounded-sm">{tag}</span>
          ))}
        </div>

        <div className="flex items-center gap-sm">
          <button
            className={`min-h-[44px] min-w-[44px] px-md py-xs rounded ${saved ? 'text-red-600' : 'text-gray-700'} hover:bg-gray-100`}
            aria-label={saved ? 'Unsave opportunity' : 'Save opportunity'}
            onClick={() => { setSaved(!saved); onSave?.(); }}
          >
            ♥
          </button>
          <button
            className="min-h-[44px] min-w-[44px] px-md py-xs rounded text-gray-700 hover:bg-gray-100"
            aria-label="Share opportunity"
            onClick={() => onShare?.()}
          >
            Share
          </button>
          <a
            onClick={(e) => { e.preventDefault(); onApply?.(); }}
            href="#apply"
            className="ml-auto bg-[color:var(--primary)] hover:opacity-90 text-white min-h-[44px] px-lg py-2 rounded-full text-sm font-medium"
          >
            Apply
          </a>
        </div>

        {(matchedClauses.length > 0 || disqualifiers.length > 0 || evidenceLinks.length > 0) && (
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-xs text-sm text-[color:var(--accent)] mt-sm hover:underline focus:outline-none"
            aria-expanded={open}
          >
            Why this?
            <span aria-hidden>{open ? '▲' : '▼'}</span>
          </button>
        )}

        {open && (
          <div className="mt-sm p-sm bg-[color:var(--accent)]/10 rounded-md border border-[color:var(--accent)]/20 text-sm">
            {matchedClauses.length > 0 && (
              <div className="mb-sm">
                <h4 className="font-semibold text-[color:var(--foreground)] mb-xs">Matched Criteria</h4>
                <ul className="space-y-xs">
                  {matchedClauses.map((c, i) => (
                    <li key={i} className="flex items-start gap-xs"><span className="text-green-600">✓</span><span>{c}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {disqualifiers.length > 0 && (
              <div className="mb-sm">
                <h4 className="font-semibold text-gray-700 mb-xs">Potential Limitations</h4>
                <ul className="space-y-xs">
                  {disqualifiers.map((d, i) => (
                    <li key={i} className="flex items-start gap-xs"><span className="text-gray-500">i</span><span>{d}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {evidenceLinks.length > 0 && (
              <div>
                <h4 className="font-semibold text-[color:var(--foreground)] mb-xs">Learn More</h4>
                <ul className="space-y-xs">
                  {evidenceLinks.map((l, i) => (
                    <li key={i}><a className="text-[color:var(--accent)] hover:underline" href={l.url} target="_blank" rel="noreferrer">{l.text}</a></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
