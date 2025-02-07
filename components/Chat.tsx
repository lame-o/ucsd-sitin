'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

export default function Chat() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      // Add user message
      setMessages(prev => [...prev, { role: 'user', content: input }])
      setInput('')

      // Call our API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add assistant's response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error while processing your request. Please try again."
      }]);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-4xl font-bold text-white">Course Assistant</h1>
          <p className="text-gray-400 mt-2">Ask me anything about UCSD courses!</p>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 min-h-[600px] flex flex-col">
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              Ask me about courses you might be interested in!
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600/20 ml-8'
                    : 'bg-gray-700/50 mr-8'
                }`}
              >
                <p className="text-gray-200">{message.content}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about courses..."
            className="flex-1 bg-gray-700/50 text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`${
              isLoading ? 'bg-blue-500/50' : 'bg-blue-600'
            } text-white rounded-lg px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}