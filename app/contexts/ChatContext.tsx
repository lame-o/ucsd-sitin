'use client'

import { createContext, useContext, useState, ReactNode } from "react"

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

interface ChatContextType {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  setMessages: () => {},
});

export const useChatContext = () => useContext(ChatContext);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])

  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  )
}