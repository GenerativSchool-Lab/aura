'use client'

import { useState } from 'react'

interface TriageResult {
  severity_score: number
  severity_level: string
  triage_assessment: string
  recommended_service: string
  urgency: string
  reasoning: string
}

export default function Home() {
  const [formData, setFormData] = useState({
    patient_age: '',
    patient_gender: '',
    chief_complaint: '',
    symptoms: '',
    vital_signs: '',
    medical_history: '',
    current_medications: '',
    allergies: ''
  })
  const [result, setResult] = useState<TriageResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getSeverityColor = (score: number) => {
    if (score <= 2) return 'bg-red-600'
    if (score <= 4) return 'bg-orange-500'
    if (score <= 6) return 'bg-yellow-500'
    if (score <= 8) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getUrgencyColor = (urgency: string) => {
    const urgencyLower = urgency.toLowerCase()
    if (urgencyLower.includes('immediate') || urgencyLower.includes('critical')) return 'text-red-600 font-bold'
    if (urgencyLower.includes('urgent')) return 'text-orange-600 font-semibold'
    if (urgencyLower.includes('moderate')) return 'text-yellow-600'
    return 'text-blue-600'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      // Parse vital signs if provided
      let vitalSigns = null
      if (formData.vital_signs.trim()) {
        try {
          vitalSigns = JSON.parse(formData.vital_signs)
        } catch {
          // If not valid JSON, try to parse as key-value pairs
          const pairs = formData.vital_signs.split(',').map(p => p.trim())
          vitalSigns = {}
          pairs.forEach(pair => {
            const [key, value] = pair.split(':').map(s => s.trim())
            if (key && value) {
              vitalSigns[key] = isNaN(Number(value)) ? value : Number(value)
            }
          })
        }
      }
      
      const payload = {
        patient_age: formData.patient_age ? parseInt(formData.patient_age) : null,
        patient_gender: formData.patient_gender || null,
        chief_complaint: formData.chief_complaint,
        symptoms: formData.symptoms,
        vital_signs: vitalSigns,
        medical_history: formData.medical_history || null,
        current_medications: formData.current_medications || null,
        allergies: formData.allergies || null
      }
      
      const res = await fetch(`${apiUrl}/triage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP ${res.status}`)
      }
      
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform triage assessment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Hospital Emergency Triage Assistant</h1>
          <p className="text-gray-600">AI-powered triage assessment with severity scoring and service routing</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Patient Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.patient_age}
                    onChange={(e) => setFormData({...formData, patient_age: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 45"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.patient_gender}
                    onChange={(e) => setFormData({...formData, patient_gender: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chief Complaint <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.chief_complaint}
                  onChange={(e) => setFormData({...formData, chief_complaint: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Chest pain"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptoms <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe symptoms in detail..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vital Signs (JSON or key:value pairs)
                </label>
                <textarea
                  value={formData.vital_signs}
                  onChange={(e) => setFormData({...formData, vital_signs: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  rows={2}
                  placeholder='{"bp": "120/80", "hr": 72, "temp": 98.6} or bp: 120/80, hr: 72, temp: 98.6'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical History
                </label>
                <textarea
                  value={formData.medical_history}
                  onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Previous conditions, surgeries, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medications
                </label>
                <textarea
                  value={formData.current_medications}
                  onChange={(e) => setFormData({...formData, current_medications: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="List current medications"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Known allergies"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !formData.chief_complaint || !formData.symptoms}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {loading ? 'Assessing...' : 'Perform Triage Assessment'}
              </button>
            </form>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Triage Results</h2>
            
            {!result && !loading && (
              <div className="text-center text-gray-500 py-12">
                <p>Submit patient information to get triage assessment</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Analyzing patient information...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Severity Score */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">Severity Score</h3>
                    <span className={`px-4 py-2 rounded-full text-white font-bold ${getSeverityColor(result.severity_score)}`}>
                      {result.severity_score}/10
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{result.severity_level}</p>
                </div>

                {/* Urgency */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-1">Urgency Level</h3>
                  <p className={`text-lg ${getUrgencyColor(result.urgency)}`}>
                    {result.urgency}
                  </p>
                </div>

                {/* Recommended Service */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Recommended Service</h3>
                  <p className="text-lg font-semibold text-blue-700">{result.recommended_service}</p>
                </div>

                {/* Assessment */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Triage Assessment</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{result.triage_assessment}</p>
                </div>

                {/* Reasoning */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Clinical Reasoning</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{result.reasoning}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
