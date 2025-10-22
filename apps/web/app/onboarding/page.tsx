"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserProfileSchema, SA_PROVINCES } from "@cyclebreaker/shared"
import { useState } from "react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"

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
      const res = await fetch(`${API_BASE}/profiles`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Error: ${data?.error || "failed"}`)
        return
      }
      setProfileId(data.id)
      localStorage.setItem("cyclebreaker_profile_id", data.id)
      setStep(3) // Success step
    } catch (error) {
      console.error('Profile creation failed:', error)
      alert('Failed to create profile. Please try again.')
    }
  }

  if (step === 1) {
    return (
      <main className="max-w-md mx-auto p-6">
        <div className="card">
          <h1 className="text-2xl font-bold mb-6 text-center">Welcome to CycleBreaker SA</h1>
          <p className="mb-4 text-center text-gray-600">
            Find grants, training, and job opportunities matched to your profile and location in South Africa.
          </p>
          <button 
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      </main>
    )
  }

  if (step === 3) {
    return (
      <main className="max-w-md mx-auto p-6">
        <div className="card">
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
      <form className="card" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-xl font-bold mb-6">Tell us about yourself</h2>

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

