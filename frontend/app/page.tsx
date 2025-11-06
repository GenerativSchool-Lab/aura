'use client'

import { useState } from 'react'

export default function Home() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })
      
      const data = await res.json()
      setResponse(data.response)
    } catch (error) {
      setResponse('Error: Could not connect to API')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Hospital Emergency Assistant</h1>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your emergency query..."
            className="w-full p-4 border rounded-lg mb-4"
            rows={4}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>

        {response && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold mb-2">Response:</h2>
            <p>{response}</p>
          </div>
        )}
      </div>
    </main>
  )
}

