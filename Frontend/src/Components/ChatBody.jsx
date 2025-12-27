import React, { useState, useRef, useEffect } from "react"
import { 
  Box, 
  TextField, 
  IconButton, 
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress
} from "@mui/material"
import { Send as SendIcon } from "@mui/icons-material"
import FAQExamples from "./FAQExamples"
import BotReply from "./BotReply"
import UserReply from "./UserReply"
import { 
  getCurrentText, 
  WHITE, 
  PRIMARY_MAIN,
  SECONDARY_MAIN,
  LIGHT_BACKGROUND 
} from "../utilities/constants"

function ChatBody({ currentLanguage }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const TEXT = getCurrentText(currentLanguage)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue("")
    setMessages(prev => [...prev, { type: "user", content: userMessage }])
    setIsLoading(true)

    try {
      // Replace with your actual API endpoint
      const apiUrl = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_CHAT_ENDPOINT
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          language: currentLanguage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      
      setMessages(prev => [...prev, { 
        type: "bot", 
        content: data.message || "I'm sorry, I couldn't process your request.",
        sources: data.sources || []
      }])
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages(prev => [...prev, { 
        type: "bot", 
        content: "I'm sorry, there was an error processing your request. Please try again.",
        sources: []
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleFAQClick = (question) => {
    setInputValue(question)
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: LIGHT_BACKGROUND,
      }}
    >
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Welcome Message and FAQs */}
        {messages.length === 0 && (
          <Box sx={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
            {/* Welcome Section */}
            <Box
              sx={{
                textAlign: "center",
                mb: 4,
                mt: 2,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: PRIMARY_MAIN,
                  fontWeight: "bold",
                  mb: 2,
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                Bloodline
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#666",
                  mb: 4,
                  fontSize: "1.1rem",
                }}
              >
                Learn about the blood supply, eligibility, and how you can save lives.
              </Typography>
            </Box>

            {/* FAQ Examples */}
            <FAQExamples 
              currentLanguage={currentLanguage}
              onFAQClick={handleFAQClick}
            />
          </Box>
        )}

        {/* Chat Messages */}
        {messages.map((message, index) => (
          <Box key={index} sx={{ mb: 2, maxWidth: "800px", margin: "0 auto", width: "100%" }}>
            {message.type === "user" ? (
              <UserReply message={message.content} />
            ) : (
              <BotReply 
                message={message.content} 
                sources={message.sources}
                currentLanguage={currentLanguage}
              />
            )}
          </Box>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress size={24} sx={{ color: PRIMARY_MAIN }} />
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          padding: "1rem",
          backgroundColor: WHITE,
          borderTop: "1px solid #E0E0E0",
        }}
      >
        <Box sx={{ maxWidth: "800px", margin: "0 auto" }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={TEXT.CHAT_PLACEHOLDER}
              variant="outlined"
              disabled={isLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "20px",
                  backgroundColor: LIGHT_BACKGROUND,
                },
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              sx={{
                backgroundColor: PRIMARY_MAIN,
                color: WHITE,
                width: "48px",
                height: "48px",
                "&:hover": {
                  backgroundColor: PRIMARY_MAIN,
                  opacity: 0.8,
                },
                "&:disabled": {
                  backgroundColor: "#ccc",
                  color: "#666",
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default ChatBody