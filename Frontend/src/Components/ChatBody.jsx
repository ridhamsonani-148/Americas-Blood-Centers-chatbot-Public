"use client"

import { useState, useEffect, useRef } from "react"
import { Box, CircularProgress, Typography } from "@mui/material"
import BotReply from "./BotReply"
import UserReply from "./UserReply"
import ChatInput from "./ChatInput"
import FAQExamples from "./FAQExamples"
import { CHAT_ENDPOINT } from "../utilities/constants"
import { createMessageBlock, createWelcomeMessage, createErrorMessage } from "../utilities/createMessageBlock"

function ChatBody({ language = 'en' }) {
  const [messages, setMessages] = useState([])
  const [processing, setProcessing] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Add welcome message
    setMessages([createWelcomeMessage(language)])
  }, [language])

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || processing) return

    const userMessage = createMessageBlock(messageText, 'user')
    setMessages(prev => [...prev, userMessage])
    setProcessing(true)

    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          language: language,
          conversation_id: `session_${Date.now()}`
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      const botMessage = createMessageBlock(
        data.response || data.message || 'I apologize, but I encountered an error processing your request.',
        'bot',
        data.sources || []
      )

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage = createErrorMessage(language)
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setProcessing(false)
    }
  }

  const handlePromptClick = (prompt) => {
    sendMessage(prompt)
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Messages Area */}
      <Box
        sx={{
          flex: "1 1 auto",
          overflowY: "auto",
          paddingBottom: "1rem",
          minHeight: 0,
        }}
      >
        {/* FAQ Examples - Only show when there's just the welcome message */}
        {messages.length === 1 && (
          <Box sx={{ marginBottom: "2rem" }}>
            <FAQExamples onPromptClick={handlePromptClick} language={language} />
          </Box>
        )}

        {/* Messages */}
        <Box sx={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
          {messages.map((message) => (
            <Box key={message.id} sx={{ marginBottom: "1rem" }}>
              {message.sender === 'user' ? (
                <UserReply message={message.text} />
              ) : (
                <BotReply 
                  message={message.text} 
                  sources={message.sources}
                />
              )}
            </Box>
          ))}

          {processing && (
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                marginTop: "1rem",
                marginBottom: "1rem",
              }}
            >
              <CircularProgress size={20} sx={{ marginRight: "0.5rem" }} />
              <Typography variant="body2" color="textSecondary">
                {language === 'es' ? 'Escribiendo...' : 'Typing...'}
              </Typography>
            </Box>
          )}
        </Box>

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          flexShrink: 0,
          paddingTop: "1rem",
          maxWidth: "1000px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <ChatInput onSendMessage={sendMessage} processing={processing} language={language} />
      </Box>
    </Box>
  )
}

export default ChatBody