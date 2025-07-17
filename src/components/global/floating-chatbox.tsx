"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send } from "lucide-react"

interface Message {
  id: number
  text: string
  sender: "user" | "support"
  timestamp: Date
}

export function FloatingChatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm here to help with your production orders and manufacturing processes. What can I assist you with today?",
      sender: "support",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const sendMessage = () => {
    if (inputValue.trim() === "") return

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")

    // Simulate support response
    setTimeout(() => {
      const supportResponse: Message = {
        id: messages.length + 2,
        text: "Thanks for your message! Our production support team will get back to you shortly. In the meantime, you can check the production orders table below for real-time updates.",
        sender: "support",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, supportResponse])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={toggleChat}
        className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed top-20 right-6 z-40 w-80 h-96 shadow-xl border bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3 bg-blue-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <MessageCircle className="h-5 w-5" />
              Production Support
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-full">
            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
              <div className="space-y-3 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        message.sender === "user" 
                          ? "bg-blue-600 text-white shadow-sm" 
                          : "bg-blue-50 text-blue-900 border border-blue-200"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-blue-50">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about production orders, materials, or processes..."
                  className="flex-1 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button onClick={sendMessage} size="icon" className="shrink-0 bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
