"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserProfileSchema } from "@cyclebreaker/shared"
import { useState } from "react"

import { getSupabase } from "../../lib/supabase"

// Create a simplified schema for onboarding (without required id/timestamps)
const OnboardingSchema = UserProfileSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [profileId, setProfileId] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<z.infer<typeof OnboardingSchema>>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      location: { 
        country_code: 'ZA' 
      },
      consent: {
        terms_accepted_at: new Date().toISOString(),
        consent_data_processing: true,
      },
    },
  })

  async function onSubmit(values: z.infer<typeof OnboardingSchema>) {
    try {
      const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (hasSupabase) {
        const supabase = getSupabase()
        const { data, error } = await supabase
          .from('user_profiles')
          .insert([
            {
              location: values.location,
              demographics: values.demographics,
              economic: values.economic,
              education_skills: (values as any).education_skills,
              constraints: values.constraints,
              goals: values.goals,
              consent: values.consent,
            },
          ])
          .select('id')
          .single()

        if (error) {
          throw new Error(error.message || 'failed')
        }

        const id = data?.id
        if (id) {
          setProfileId(id)
          localStorage.setItem('cyclebreaker_profile_id', id)
          localStorage.setItem('cyclebreaker_profile_source', 'supabase')
          localStorage.setItem('cb_profile_values', JSON.stringify(values))
          setStep(3)
          return
        }
        throw new Error('No id returned')
      }
      // Fallback: local profile id only
      const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string
      setProfileId(id)
      localStorage.setItem('cyclebreaker_profile_id', id)
      localStorage.setItem('cyclebreaker_profile_source', 'local')
      localStorage.setItem('cb_profile_values', JSON.stringify(values))
      setStep(3)
    } catch (error: any) {
      console.error('Profile creation failed:', error)
      alert('Saved locally. You can still browse matches. Error: ' + (error?.message || 'unknown'))
      const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string
      setProfileId(id)
      localStorage.setItem('cyclebreaker_profile_id', id)
      localStorage.setItem('cyclebreaker_profile_source', 'local')
      setStep(3)
    }
  }

  if (step === 1) {
    return (
      <main className="max-w-md mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h1 className="text-2xl font-bold mb-6 text-center text-[color:var(--foreground)]">Welcome to CycleBreaker SA</h1>
          <p className="mb-4 text-center text-gray-600">
            Find grants, training, and job opportunities matched to your profile and location in South Africa.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
            <a 
              href="/onboarding/ai"
              className="w-full bg-[color:var(--primary)] text-white py-3 px-4 rounded-lg hover:opacity-90 text-center"
            >
              AI-assisted
            </a>
            <button 
              onClick={() => setStep(2)}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:opacity-90"
            >
              Manual (on device)
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (step === 3) {
    return (
      <main className="max-w-md mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4 text-center text-green-600">Profile Created Successfully!</h2>
          <p className="mb-4 text-center">Your profile ID: <span className="font-mono text-sm">{profileId}</span></p>
          <a 
            href={`/feed?profile_id=${profileId}`}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors block text-center"
          >
            View Your Opportunities
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <form className="bg-white border border-gray-200 rounded-lg p-4" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-xl font-bold mb-6 text-[color:var(--foreground)]">Tell us about yourself</h2>

        {/* Location */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Location</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Province *</label>
            <select {...register("location.province_code")} className="w-full border rounded-lg px-3 py-2">
              <option value="">Select Province</option>
              <option value="WC">Western Cape</option>
              <option value="GP">Gauteng</option>
              <option value="KZN">KwaZulu-Natal</option>
              <option value="EC">Eastern Cape</option>
              <option value="FS">Free State</option>
              <option value="NW">North West</option>
              <option value="NC">Northern Cape</option>
              <option value="MP">Mpumalanga</option>
              <option value="LP">Limpopo</option>
            </select>
            {errors.location?.province_code && <p className="text-red-500 text-xs mt-1">Province is required</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Municipality/Area</label>
            <input 
              placeholder="e.g., Cape Town, Johannesburg" 
              {...register("location.municipality")} 
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Postal Code</label>
            <input 
              placeholder="e.g., 8001" 
              {...register("location.postal_code")} 
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Demographics */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">About You</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Age Group</label>
            <select {...register("demographics.age_bracket")} className="w-full border rounded-lg px-3 py-2">
              <option value="">Select Age Group</option>
              <option value="16_17">16-17</option>
              <option value="18_24">18-24</option>
              <option value="25_34">25-34</option>
              <option value="35_49">35-49</option>
              <option value="50_plus">50+</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Citizenship Status</label>
            <select {...register("demographics.citizenship_status")} className="w-full border rounded-lg px-3 py-2">
              <option value="">Select Status</option>
              <option value="citizen">South African Citizen</option>
              <option value="permanent_resident">Permanent Resident</option>
              <option value="refugee">Refugee</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Economic Situation */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Work & Income</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Employment Status</label>
            <select {...register("economic.employment_status")} className="w-full border rounded-lg px-3 py-2">
              <option value="">Select Status</option>
              <option value="unemployed">Unemployed</option>
              <option value="informal_employed">Informal work</option>
              <option value="formal_employed">Formal job</option>
              <option value="self_employed">Self-employed</option>
              <option value="student">Student</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Monthly Income</label>
            <select {...register("economic.income_bracket")} className="w-full border rounded-lg px-3 py-2">
              <option value="">Select Income Range</option>
              <option value="lt_1000_zar">Less than R1,000</option>
              <option value="1000_3000_zar">R1,000 - R3,000</option>
              <option value="3000_5000_zar">R3,000 - R5,000</option>
              <option value="5000_plus_zar">More than R5,000</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Number of Dependents</label>
            <input 
              type="number" 
              min="0" 
              max="10"
              placeholder="0"
              {...register("economic.dependents_count", { valueAsNumber: true })} 
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Transport & Goals */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Transport & Goals</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">How do you usually travel?</label>
            <select {...register("constraints.transport_mode")} className="w-full border rounded-lg px-3 py-2">
              <option value="">Select Transport</option>
              <option value="walk">Walking</option>
              <option value="taxi">Taxi</option>
              <option value="bus">Bus</option>
              <option value="private">Own transport</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Maximum distance you can travel (km)</label>
            <input 
              type="number" 
              min="1" 
              max="50"
              placeholder="5"
              {...register("constraints.max_commute_km", { valueAsNumber: true })} 
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">What's your main goal?</label>
            <select {...register("goals.primary_goal")} className="w-full border rounded-lg px-3 py-2">
              <option value="">Select Goal</option>
              <option value="find_job">Find a job</option>
              <option value="get_grant">Get government grants</option>
              <option value="get_training">Get training/skills</option>
              <option value="reduce_costs">Reduce expenses</option>
            </select>
          </div>
        </div>

        <div className="mt-8">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isSubmitting ? 'Creating Profile...' : 'Create My Profile'}
          </button>
        </div>
        
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">Please review the highlighted fields and try again.</p>
          </div>
        )}
      </form>
    </main>
  )
}

