'use client'

import { useState, useRef, useEffect } from 'react'

interface TriageResult {
  severity_score: number  // Score 0-100
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
    if (score >= 90) return 'bg-black'
    if (score >= 70) return 'bg-gray-800'
    if (score >= 50) return 'bg-gray-600'
    if (score >= 30) return 'bg-gray-400'
    return 'bg-gray-300'
  }

  const getSeverityTextColor = (score: number) => {
    if (score >= 70) return 'text-white'
    return 'text-black'
  }

  const getUrgencyBadgeColor = (urgency: string) => {
    const urgencyLower = urgency.toLowerCase()
    if (urgencyLower.includes('immediate') || urgencyLower.includes('critical')) {
      return 'bg-black text-white'
    }
    if (urgencyLower.includes('urgent')) {
      return 'bg-gray-800 text-white'
    }
    if (urgencyLower.includes('moderate')) {
      return 'bg-gray-600 text-white'
    }
    return 'bg-gray-300 text-black'
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
    <main className="min-h-screen bg-white">
      {/* Header with gradient effect */}
      <div className="bg-gradient-to-b from-white via-gray-50 to-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-black text-black mb-3 tracking-tight">
              EMERGENCY TRIAGE
            </h1>
            <p className="text-gray-700 text-base md:text-lg font-medium">
              Multimodal AI Assessment System • ERC 2021 • SFAR 2024
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-10">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white transition-shadow hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tighter">
                    Patient Input
                  </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Text Input */}
                  <div>
                    <label className="block text-xs md:text-sm font-black text-black mb-3 uppercase tracking-wider">
                      Text Description
                      <span className="block text-xs font-normal text-gray-600 mt-1 normal-case">
                        Symptoms, Complaint, Notes
                      </span>
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="w-full p-4 border-4 border-black focus:outline-none focus:ring-4 focus:ring-black bg-white text-black font-mono text-sm leading-relaxed resize-none transition-all"
                      rows={5}
                      placeholder="Describe symptoms, chief complaint, or any relevant information..."
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-xs md:text-sm font-black text-black mb-3 uppercase tracking-wider">
                      Upload Media
                      <span className="block text-xs font-normal text-gray-600 mt-1 normal-case">
                        Image, Video, or Audio
                      </span>
                    </label>
                    <div
                      ref={dropZoneRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-4 border-dashed p-6 md:p-8 text-center transition-all ${
                        isDragging 
                          ? 'border-black bg-black text-white shadow-inner' 
                          : 'border-black bg-white hover:bg-gray-50'
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
                        <div className={`text-lg md:text-xl font-black mb-3 ${isDragging ? 'text-white' : 'text-black'}`}>
                          {file ? file.name : (isDragging ? 'DROP FILE HERE' : 'CLICK TO UPLOAD OR DRAG & DROP')}
                        </div>
                        <div className={`text-xs ${isDragging ? 'text-gray-300' : 'text-gray-600'}`}>
                          Supports: Images, Videos, Audio files
                        </div>
                      </label>
                      {file && (
                        <button
                          type="button"
                          onClick={removeFile}
                          className="mt-4 px-4 py-2 bg-black text-white text-xs font-black uppercase hover:bg-gray-800 transition-colors"
                        >
                          REMOVE
                        </button>
                      )}
                    </div>
                    {filePreview && (
                      <div className="mt-4 border-4 border-black p-3 bg-white">
                        <img src={filePreview} alt="Preview" className="max-w-full h-auto max-h-64 mx-auto" />
                      </div>
                    )}
                  </div>

                  {/* Patient Info - Collapsible */}
                  <details className="border-4 border-black bg-gray-50">
                    <summary className="p-4 font-black text-black cursor-pointer uppercase text-sm tracking-wider hover:bg-gray-100 transition-colors">
                      Patient Information (Optional)
                    </summary>
                    <div className="p-4 md:p-6 space-y-5 bg-white border-t-4 border-black">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-black mb-2 uppercase tracking-wider">Age</label>
                          <input
                            type="number"
                            value={formData.patient_age}
                            onChange={(e) => setFormData({...formData, patient_age: e.target.value})}
                            className="w-full p-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-black bg-white text-black font-bold"
                            placeholder="45"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-black mb-2 uppercase tracking-wider">Gender</label>
                          <select
                            value={formData.patient_gender}
                            onChange={(e) => setFormData({...formData, patient_gender: e.target.value})}
                            className="w-full p-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-black bg-white text-black font-bold"
                          >
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-black mb-2 uppercase tracking-wider">Vital Signs</label>
                        <input
                          type="text"
                          value={formData.vital_signs}
                          onChange={(e) => setFormData({...formData, vital_signs: e.target.value})}
                          className="w-full p-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-black bg-white text-black"
                          placeholder="BP: 120/80, HR: 72, Temp: 98.6"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-black mb-2 uppercase tracking-wider">Medical History</label>
                        <textarea
                          value={formData.medical_history}
                          onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                          className="w-full p-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-black bg-white text-black text-sm resize-none"
                          rows={2}
                          placeholder="Previous conditions, surgeries..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-black mb-2 uppercase tracking-wider">Medications</label>
                        <input
                          type="text"
                          value={formData.current_medications}
                          onChange={(e) => setFormData({...formData, current_medications: e.target.value})}
                          className="w-full p-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-black bg-white text-black"
                          placeholder="Current medications"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-black mb-2 uppercase tracking-wider">Allergies</label>
                        <input
                          type="text"
                          value={formData.allergies}
                          onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                          className="w-full p-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-black bg-white text-black"
                          placeholder="Known allergies"
                        />
                      </div>
                    </div>
                  </details>

                  {error && (
                    <div className="p-4 bg-black text-white border-4 border-black font-black text-sm uppercase tracking-wider">
                      ERROR: {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (!textInput.trim() && !file)}
                    className="w-full px-6 py-5 bg-black text-white font-black text-lg md:text-xl uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {loading ? 'ANALYZING...' : 'ASSESS TRIAGE'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white min-h-[600px]">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tighter">
                    Triage Results
                  </h2>
                </div>
                
                {!result && !loading && (
                  <div className="text-center py-20 md:py-24 border-4 border-dashed border-gray-400 bg-gray-50">
                    <div className="text-7xl md:text-8xl mb-6">⚕</div>
                    <p className="font-black text-lg md:text-xl text-black mb-2">AWAITING ASSESSMENT</p>
                    <p className="text-sm md:text-base text-gray-600">Submit patient information to begin</p>
                  </div>
                )}

                {loading && (
                  <div className="text-center py-20 md:py-24">
                    <div className="inline-block">
                      <div className="w-20 h-20 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    </div>
                    <p className="text-black font-black text-xl md:text-2xl mt-6">ANALYZING...</p>
                    <p className="text-gray-600 text-sm md:text-base mt-3">Processing multimodal input</p>
                  </div>
                )}

                {result && (
                  <div className="space-y-6">
                    {/* Severity Score - Large Display */}
                    <div className="border-4 border-black p-6 md:p-8 text-center bg-gradient-to-br from-white to-gray-50">
                      <div className="text-xs font-black text-black uppercase tracking-widest mb-3">Severity Score</div>
                      <div className={`inline-block px-10 md:px-12 py-6 md:py-8 ${getSeverityColor(result.severity_score)} ${getSeverityTextColor(result.severity_score)} text-6xl md:text-7xl font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
                        {Math.round(result.severity_score)}
                      </div>
                      <div className="text-xs md:text-sm mt-3 text-gray-700 font-bold">/ 100</div>
                      <div className="mt-4 text-xl md:text-2xl font-black text-black uppercase tracking-wider">
                        {result.severity_level}
                      </div>
                    </div>

                    {/* Urgency Badge */}
                    <div className={`border-4 border-black p-5 md:p-6 ${getUrgencyBadgeColor(result.urgency)} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                      <div className="text-xs font-black uppercase tracking-widest mb-2 opacity-90">Urgency Level</div>
                      <div className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                        {result.urgency}
                      </div>
                    </div>

                    {/* Recommended Service */}
                    <div className="border-4 border-black p-5 md:p-6 bg-white">
                      <div className="text-xs font-black text-black uppercase tracking-widest mb-3">Recommended Service</div>
                      <div className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight leading-tight">
                        {result.recommended_service}
                      </div>
                    </div>

                    {/* Assessment */}
                    <div className="border-4 border-black p-5 md:p-6 bg-gray-50">
                      <div className="text-xs font-black text-black uppercase tracking-widest mb-3">Triage Assessment</div>
                      <p className="text-black leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                        {result.triage_assessment}
                      </p>
                    </div>

                    {/* Clinical Reasoning - Enhanced Display */}
                    <div className="border-4 border-black p-5 md:p-6 bg-white">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 bg-black"></div>
                        <div className="text-xs font-black text-black uppercase tracking-widest">Clinical Reasoning</div>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-800 leading-relaxed text-sm md:text-base whitespace-pre-wrap font-medium">
                          {result.reasoning}
                        </p>
                      </div>
                    </div>

                    {/* Model Used */}
                    <div className="text-xs text-gray-500 text-right uppercase tracking-widest font-bold">
                      Model: {result.model_used}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
          <div className="flex flex-col gap-8 text-sm">
            {/* Links */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center">
              <a
                href="https://github.com/GenerativSchool-Lab/aura"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:underline font-black uppercase tracking-wider transition-all hover:scale-105"
              >
                GitHub Repository
              </a>
              <span className="hidden md:inline text-gray-400 text-xl">•</span>
              <a
                href="https://generativschool.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:underline font-black uppercase tracking-wider transition-all hover:scale-105"
              >
                GenerativSchool - AI Civic Tech Lab
              </a>
            </div>
            
            {/* Credits */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t-2 border-gray-300 pt-6">
              <div className="text-center md:text-left">
                <p className="text-black font-black text-base uppercase tracking-wider">Lead Architect & Dev</p>
                <p className="text-black font-bold text-lg mt-1">Soufiane Lemqari</p>
              </div>
              <div className="text-center md:text-right text-gray-700">
                <p className="text-xs font-black uppercase tracking-widest mb-2">Open Source Contributors</p>
                <p className="text-sm font-semibold">Laura Sibony (AI Expert)</p>
                <p className="text-sm font-semibold">Camille François, M.D.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
