'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Loader2 } from 'lucide-react'

// Message type with optional metadata
interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      // Add user message with timestamp
      setMessages(prev => [...prev, { 
        role: 'user', 
        content: input,
        timestamp: new Date()
      }])
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

      // Add assistant's response with timestamp
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false)
    }
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
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
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center py-8 space-y-2">
              <p>Ask me about courses you might be interested in!</p>
              <p className="text-sm">Try asking about:</p>
              <ul className="text-sm text-gray-500">
                <li>&quot;Show me computer science classes on Wednesday afternoons&quot;</li>
                <li>&quot;What music classes are available in the morning?&quot;</li>
                <li>&quot;Find large psychology lectures with available seats&quot;</li>
              </ul>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600/20 rounded-br-none'
                      : 'bg-gray-700/50 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs ${
                      message.role === 'user' ? 'text-blue-300' : 'text-green-300'
                    }`}>
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    {message.timestamp && (
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-200 prose prose-invert max-w-none">
                    {message.role === 'assistant' ? (
                      <div>
                        {message.content.split('\n\n').map((block, blockIndex) => {
                          // Check if this block is a course listing (starts with a number and has **)
                          if (block.match(/^\d+\.\s+\*\*/)) {
                            const lines = block.split('\n').map(l => l.trim());
                            const titleMatch = lines[0].match(/\*\*(.*?)\*\*/);
                            const title = titleMatch ? titleMatch[1] : '';
                            
                            // Extract details from the bullet points
                            const details = lines.slice(1)
                              .filter(l => l.startsWith('-'))
                              .map(l => {
                                const [label, ...valueParts] = l.replace(/^-\s+\*\*/, '').split(':');
                                return {
                                  label: label.replace(/\*\*/g, ''),
                                  value: valueParts.join(':').trim()
                                };
                              });
                            
                            return (
                              <div key={blockIndex} className="bg-gray-800/50 rounded-lg p-4 mb-4 shadow-lg border border-gray-700">
                                <h3 className="text-xl font-bold text-blue-400 mb-4">{title}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {details.map((detail, i) => (
                                    <div key={i} className={`${detail.label === 'Description' || detail.label === 'Prerequisites' ? 'col-span-2' : ''}`}>
                                      <span className="block text-blue-300 text-sm mb-1">{detail.label}</span>
                                      <span className="block text-gray-200">{detail.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          // Regular text block (like introductions or summaries)
                          return (
                            <p key={blockIndex} className="mb-4">
                              {block}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      message.content.split('\n').map((line, i) => (
                        <p key={i} className="my-1">
                          {line}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about courses..."
            className="flex-1 bg-gray-700/50 text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${
              isLoading 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}