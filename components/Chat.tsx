'use client'

import { useRef, useEffect, useState } from 'react'
import { Send, BotMessageSquare } from 'lucide-react'
import { WordRotate } from './WordRotate'
import Loader from './Loader'
import { BuildingOffice2Icon, UserGroupIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useChatContext } from '@/app/contexts/ChatContext'

export default function Chat() {
  const { messages, setMessages } = useChatContext()
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

    // Create user message outside try block so it's accessible in catch block
    const newUserMessage = { 
      role: 'user' as const, 
      content: input,
      timestamp: new Date()
    }

    try {
      setIsLoading(true)
      // Add user message with timestamp
      setMessages([...messages, newUserMessage])
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
      const newAssistantMessage = { 
        role: 'assistant' as const, 
        content: data.response,
        timestamp: new Date()
      }
      setMessages([...messages, newUserMessage, newAssistantMessage]);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        role: 'assistant' as const, 
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        timestamp: new Date()
      }
      setMessages([...messages, newUserMessage, errorMessage]);
    } finally {
      setIsLoading(false)
    }
  }

  const parseCourseBlock = (block: string) => {
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
    
    return { title, details };
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col space-y-4 border-b border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-white">AI Course Assistant</h1>
          <BotMessageSquare className="w-9 h-9 text-white translate-y-0.5" />
        </div>
        <div className="text-gray-400 flex items-center gap-2">
          <p className="text-2xl whitespace-nowrap font-semibold -translate-y-0.25">Type 🦝 </p>
          <WordRotate
            words={[
              '"Show me <span class="text-yellow-300">biology</span> classes that start at <span class="text-yellow-300">1pm</span> on <span class="text-yellow-300">Fridays</span>"',
              '"Find <span class="text-yellow-300">large</span> <span class="text-yellow-300">psychology</span> lectures that start in the <span class="text-yellow-300">afternoon</span>"',
              '"I am interested in <span class="text-yellow-300">AI</span> and <span class="text-yellow-300">machine learning</span>"',
              '"What is the <span class="text-yellow-300">biggest</span> <span class="text-yellow-300">music</span> class?"',
              '"I like <span class="text-yellow-300">True Crime</span>, what courses should I go to?"'
            ]}
            className="text-xl font-medium text-white/90"
          />
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 min-h-[300px] flex flex-col">
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center py-4 flex flex-col items-center gap-4">
              <BotMessageSquare className="w-20 h-20 text-gray-500 opacity-50" />
              <p>Ask me about courses you might be interested in!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                  {message.role === 'user' ? (
                    <div className="text-4xl mt-4 -translate-x-1 -translate-y-0.5">🦝</div>
                  ) : (
                    <BotMessageSquare className="h-8 w-8 text-white" />
                  )}
                </div>
                <div
                  className={`relative rounded-lg px-4 py-2 max-w-[85%] shadow-[0_0px_10px_rgba(0,0,0)] mt-4 ${
                    message.role === 'user'
                      ? 'bg-white text-black text-md font-medium rounded-br-none after:content-[""] after:absolute after:bottom-0 after:right-[-8px] after:border-8 after:border-transparent after:border-b-white after:border-l-white'
                      : 'bg-gray-700/50 text-gray-100 rounded-tl-none'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-invert max-w-none mt-2">
                      {message.content.split('\n\n').map((block, blockIndex) => {
                        // Check if this block is a course listing (starts with a number and has **)
                        if (block.match(/^\d+\.\s+\*\*/)) {
                          const { title, details } = parseCourseBlock(block)
                          return (
                            <div key={blockIndex}>
                              {blockIndex > 0 && <hr className="border-gray-700/50 my-4" />}
                              <div className="bg-gray-800/50 rounded-lg p-3 shadow-lg border border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                  <h3 className="text-lg font-bold text-blue-400">{title}</h3>
                                  <div className="flex items-center gap-3 text-xs font-medium">
                                    <span className="text-gray-400">{details.find(d => d.label === 'Department')?.value}</span>
                                    <span className="text-gray-400">{details.find(d => d.label === 'Units')?.value} Units</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm mb-2 bg-[#32405a] rounded-lg px-3 py-2 shadow-inner">
                                  <span className="text-sm font-medium flex items-center gap-1">
                                    <span className="text-white">Meets on </span>
                                    <ClockIcon className="h-4 w-4 text-white" />
                                    <span className="text-white">{details.find(d => d.label === 'Schedule')?.value?.replace('Meets on ', '')}</span>
                                  </span>
                                  <UserIcon className="h-4 w-4 text-white" />
                                  <span className="text-white text-sm font-medium">{details.find(d => d.label === 'Instructor')?.value}</span>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                      <BuildingOffice2Icon className="h-4 w-4 text-white" />
                                      <span className="text-white text-sm font-medium">{details.find(d => d.label === 'Location')?.value}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <UserGroupIcon className="h-4 w-4 text-white" />
                                      <span className="text-white text-sm font-medium">{details.find(d => d.label === 'Class Size')?.value}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {details
                                    .filter(detail => !['Department', 'Units', 'Schedule', 'Location', 'Instructor', 'Class Size'].includes(detail.label))
                                    .map((detail, i) => (
                                      <div key={i}>
                                        <span className="block text-blue-300/90 text-sm font-medium mb-0.5">{detail.label}</span>
                                        <span className="block text-white text-sm leading-snug">{detail.value}</span>
                                      </div>
                                    ))}
                                </div>
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
                    message.content
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex items-start gap-3">
              <div className="shrink-0 mr-2">
                <BotMessageSquare className="h-8 w-8 text-gray-400 animate-bounce" />
              </div>
              <div className="relative rounded-lg px-4 py-2 bg-gray-700/50 text-gray-400 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                Thinking...
              </div>
            </div>
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
              <div className="scale-[0.23] -m-16">
                <Loader />
              </div>
            ) : (
              <Send className="h-6 w-6 text-white" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}