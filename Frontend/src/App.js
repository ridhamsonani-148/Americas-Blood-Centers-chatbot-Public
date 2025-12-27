import React, { useState } from "react"
import { ThemeProvider } from "@mui/material/styles"
import { CssBaseline, Box, useMediaQuery } from "@mui/material"
import theme from "./theme"
import ChatHeader from "./Components/ChatHeader"
import ChatBody from "./Components/ChatBody"
import LeftPanel from "./Components/LeftPanel"
import { LIGHT_BACKGROUND } from "./utilities/constants"

function App() {
  const [currentLanguage, setCurrentLanguage] = useState("en")
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const toggleLanguage = () => {
    setCurrentLanguage(currentLanguage === "en" ? "es" : "en")
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: LIGHT_BACKGROUND,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {/* Left Panel - Hidden on mobile */}
        {!isMobile && (
          <Box sx={{ width: "300px", flexShrink: 0 }}>
            <LeftPanel 
              currentLanguage={currentLanguage}
              toggleLanguage={toggleLanguage}
            />
          </Box>
        )}

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          {/* Header */}
          <ChatHeader 
            currentLanguage={currentLanguage}
            toggleLanguage={toggleLanguage}
            isMobile={isMobile}
          />

          {/* Chat Body */}
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <ChatBody currentLanguage={currentLanguage} />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App