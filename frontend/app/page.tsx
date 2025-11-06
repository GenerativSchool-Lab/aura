'use client'

import { useState, useRef, useEffect } from 'react'

interface TriageResult {
  severity_score: number
  severity_level: string
  triage_assessment: string
  recommended_service: string
  urgency: string
  reasoning: string
  model_used: string
}

// Get API URL - use environment variable or fallback
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use the environment variable
    return process.env.NEXT_PUBLIC_API_URL || 'https://aura-production-e01b.up.railway.app'
  }
  return 'https://aura-production-e01b.up.railway.app'
}

export default function Home() {
  const [textInput, setTextInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    patient_age: '',
    patient_gender: '',
    vital_signs: '',
    medical_history: '',
    current_medications: '',
    allergies: ''
  })
  const [result, setResult] = useState<TriageResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Prevent default drag behaviors on the entire page
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = (selectedFile: File) => {
    setFile(selectedFile)
    setError('')
    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setFilePreview(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragging to false if we're leaving the drop zone
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      // Validate file type
      const isValidType = droppedFile.type.startsWith('image/') || 
                         droppedFile.type.startsWith('video/') || 
                         droppedFile.type.startsWith('audio/')
      
      if (isValidType) {
        processFile(droppedFile)
      } else {
        setError('Invalid file type. Please upload an image, video, or audio file.')
      }
    }
  }

  const removeFile = () => {
    setFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getSeverityColor = (score: number) => {
    if (score <= 2) return 'bg-black'
    if (score <= 4) return 'bg-gray-800'
    if (score <= 6) return 'bg-gray-600'
    if (score <= 8) return 'bg-gray-400'
    return 'bg-gray-300'
  }

  const getSeverityTextColor = (score: number) => {
    if (score <= 4) return 'text-white'
    return 'text-black'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    
    // Validate input
    if (!textInput.trim() && !file) {
      setError('Please provide either text input or upload a file (image/video/audio)')
      setLoading(false)
      return
    }
    
    try {
      const apiUrl = getApiUrl()
      console.log('API URL:', apiUrl) // Debug log
      
      const formDataToSend = new FormData()
      
      if (file) {
        formDataToSend.append('file', file)
      }
      
      if (textInput.trim()) {
        formDataToSend.append('text_input', textInput)
      }
      
      if (formData.patient_age) {
        formDataToSend.append('patient_age', formData.patient_age)
      }
      
      if (formData.patient_gender) {
        formDataToSend.append('patient_gender', formData.patient_gender)
      }
      
      if (formData.vital_signs.trim()) {
        formDataToSend.append('vital_signs', formData.vital_signs)
      }
      
      if (formData.medical_history.trim()) {
        formDataToSend.append('medical_history', formData.medical_history)
      }
      
      if (formData.current_medications.trim()) {
        formDataToSend.append('current_medications', formData.current_medications)
      }
      
      if (formData.allergies.trim()) {
        formDataToSend.append('allergies', formData.allergies)
      }
      
      const res = await fetch(`${apiUrl}/triage`, {
        method: 'POST',
        body: formDataToSend,
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP ${res.status}`)
      }
      
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform triage assessment')
      console.error('Triage error:', err) // Debug log
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b-2 border-black pb-4">
          <h1 className="text-4xl font-bold text-black mb-2">EMERGENCY TRIAGE</h1>
          <p className="text-gray-700 text-sm">Multimodal AI Assessment System</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="border-2 border-black p-6 bg-white">
              <h2 className="text-2xl font-bold text-black mb-6 uppercase tracking-wide">Patient Input</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Text Input */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2 uppercase">
                    Text Description <span className="text-gray-600 font-normal">(Symptoms, Complaint, Notes)</span>
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white text-black font-mono text-sm"
                    rows={4}
                    placeholder="Describe symptoms, chief complaint, or any relevant information..."
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2 uppercase">
                    Upload Media <span className="text-gray-600 font-normal">(Image, Video, or Audio)</span>
                  </label>
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed p-4 text-center transition-colors ${
                      isDragging 
                        ? 'border-black bg-black text-white' 
                        : 'border-black bg-white'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,video/*,audio/*"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer block"
                    >
                      <div className={`font-semibold mb-2 ${isDragging ? 'text-white' : 'text-black'}`}>
                        {file ? file.name : (isDragging ? 'Drop file here' : 'Click to upload or drag and drop')}
                      </div>
                      <div className={`text-xs ${isDragging ? 'text-gray-300' : 'text-gray-600'}`}>
                        Supports: Images, Videos, Audio files
                      </div>
                    </label>
                    {file && (
                      <button
                        type="button"
                        onClick={removeFile}
                        className="mt-2 px-3 py-1 bg-black text-white text-xs font-bold hover:bg-gray-800"
                      >
                        REMOVE
                      </button>
                    )}
                  </div>
                  {filePreview && (
                    <div className="mt-3 border-2 border-black p-2 bg-white">
                      <img src={filePreview} alt="Preview" className="max-w-full h-auto max-h-48 mx-auto" />
                    </div>
                  )}
                </div>

                {/* Patient Info - Collapsible */}
                <details className="border-2 border-black">
                  <summary className="p-3 font-bold text-black cursor-pointer uppercase text-sm">
                    Patient Information (Optional)
                  </summary>
                  <div className="p-4 space-y-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-black mb-1 uppercase">Age</label>
                        <input
                          type="number"
                          value={formData.patient_age}
                          onChange={(e) => setFormData({...formData, patient_age: e.target.value})}
                          className="w-full p-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                          placeholder="45"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black mb-1 uppercase">Gender</label>
                        <select
                          value={formData.patient_gender}
                          onChange={(e) => setFormData({...formData, patient_gender: e.target.value})}
                          className="w-full p-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                        >
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-1 uppercase">Vital Signs</label>
                      <input
                        type="text"
                        value={formData.vital_signs}
                        onChange={(e) => setFormData({...formData, vital_signs: e.target.value})}
                        className="w-full p-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                        placeholder="BP: 120/80, HR: 72, Temp: 98.6"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-1 uppercase">Medical History</label>
                      <textarea
                        value={formData.medical_history}
                        onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                        className="w-full p-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white text-black text-sm"
                        rows={2}
                        placeholder="Previous conditions, surgeries..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-1 uppercase">Medications</label>
                      <input
                        type="text"
                        value={formData.current_medications}
                        onChange={(e) => setFormData({...formData, current_medications: e.target.value})}
                        className="w-full p-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                        placeholder="Current medications"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black mb-1 uppercase">Allergies</label>
                      <input
                        type="text"
                        value={formData.allergies}
                        onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                        className="w-full p-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
                        placeholder="Known allergies"
                      />
                    </div>
                  </div>
                </details>

                {error && (
                  <div className="p-3 bg-black text-white border-2 border-black font-bold text-sm">
                    ERROR: {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!textInput.trim() && !file)}
                  className="w-full px-6 py-4 bg-black text-white font-bold text-lg uppercase tracking-wide hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black transition-all"
                >
                  {loading ? 'ANALYZING...' : 'ASSESS TRIAGE'}
                </button>
              </form>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="border-2 border-black p-6 bg-white min-h-[600px]">
              <h2 className="text-2xl font-bold text-black mb-6 uppercase tracking-wide">Triage Results</h2>
              
              {!result && !loading && (
                <div className="text-center text-gray-500 py-20 border-2 border-dashed border-gray-400">
                  <div className="text-6xl mb-4">⚕</div>
                  <p className="font-semibold">Awaiting Assessment</p>
                  <p className="text-sm mt-2">Submit patient information to begin</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-20">
                  <div className="inline-block animate-pulse">
                    <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  </div>
                  <p className="text-black font-bold text-lg mt-4">ANALYZING...</p>
                  <p className="text-gray-600 text-sm mt-2">Processing multimodal input</p>
                </div>
              )}

              {result && (
                <div className="space-y-5">
                  {/* Severity Score - Large Display */}
                  <div className="border-4 border-black p-6 text-center">
                    <div className="text-xs font-bold text-black uppercase tracking-widest mb-2">Severity Score</div>
                    <div className={`inline-block px-8 py-4 ${getSeverityColor(result.severity_score)} ${getSeverityTextColor(result.severity_score)} text-5xl font-bold border-4 border-black`}>
                      {result.severity_score}
                    </div>
                    <div className="text-xs mt-2 text-gray-700">/ 10</div>
                    <div className="mt-3 text-lg font-bold text-black uppercase">{result.severity_level}</div>
                  </div>

                  {/* Urgency Badge */}
                  <div className="border-2 border-black p-4 bg-black text-white">
                    <div className="text-xs font-bold uppercase tracking-widest mb-1">Urgency Level</div>
                    <div className="text-2xl font-bold uppercase">{result.urgency}</div>
                  </div>

                  {/* Recommended Service */}
                  <div className="border-2 border-black p-4 bg-white">
                    <div className="text-xs font-bold text-black uppercase tracking-widest mb-2">Recommended Service</div>
                    <div className="text-xl font-bold text-black uppercase">{result.recommended_service}</div>
                  </div>

                  {/* Assessment */}
                  <div className="border-2 border-black p-4 bg-gray-50">
                    <div className="text-xs font-bold text-black uppercase tracking-widest mb-2">Triage Assessment</div>
                    <p className="text-black leading-relaxed">{result.triage_assessment}</p>
                  </div>

                  {/* Reasoning */}
                  <div className="border-2 border-black p-4 bg-white">
                    <div className="text-xs font-bold text-black uppercase tracking-widest mb-2">Clinical Reasoning</div>
                    <p className="text-gray-700 text-sm leading-relaxed">{result.reasoning}</p>
                  </div>

                  {/* Model Used */}
                  <div className="text-xs text-gray-500 text-right uppercase tracking-widest">
                    Model: {result.model_used}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
