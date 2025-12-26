"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "@mui/material/styles"
import { CssBaseline, Box, Drawer, Backdrop } from "@mui/material"
import useMediaQuery from "@mui/material/useMediaQuery"
import theme from "./theme"
import AppHeader from "./Components/AppHeader"
import LeftNav from "./Components/LeftNav"
import ChatHeader from "./Components/ChatHeader"
import ChatBody from "./Components/ChatBody"
import AdminDashboard from "./Components/AdminDashboard"
import { CHAT_LEFT_PANEL_BACKGROUND, CHAT_BODY_BACKGROUND } from "./utilities/constants"

function App() {
  const [showLeftNav, setLeftNav] = useState(true)
  const [language, setLanguage] = useState('en')
  const [showAdmin, setShowAdmin] = useState(false)
  const isMobile = useMediaQuery("(max-width:768px)")
  const isSmallScreen = useMediaQuery("(max-width:600px)")

  // Close navbar automatically on small screens
  useEffect(() => {
    if (isMobile) {
      setLeftNav(false)
    } else {
      setLeftNav(true)
    }
  }, [isMobile])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* App Header */}
        <AppHeader 
          showLeftNav={showLeftNav} 
          setLeftNav={setLeftNav}
          language={language}
          setLanguage={setLanguage}
          showAdmin={showAdmin}
          setShowAdmin={setShowAdmin}
        />

        {/* Main Content Area */}
        <Box
          sx={{
            height: isSmallScreen ? "calc(100vh - 4rem)" : "calc(100vh - 5rem)",
            display: "flex",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Left Navigation - Drawer on small screens, permanent sidebar on larger screens */}
          {isSmallScreen ? (
            <Drawer
              variant="temporary"
              open={showLeftNav}
              onClose={() => setLeftNav(false)}
              ModalProps={{ keepMounted: true }}
              sx={{
                "& .MuiDrawer-paper": {
                  width: "280px",
                  backgroundColor: CHAT_LEFT_PANEL_BACKGROUND,
                  boxSizing: "border-box",
                },
              }}
            >
              <LeftNav showLeftNav={true} setLeftNav={setLeftNav} language={language} />
            </Drawer>
          ) : (
            <Box
              sx={{
                width: showLeftNav ? (isMobile ? "250px" : "300px") : "40px",
                flexShrink: 0,
                backgroundColor: CHAT_LEFT_PANEL_BACKGROUND,
                transition: "width 0.3s ease-in-out",
                overflow: "hidden",
              }}
            >
              <LeftNav showLeftNav={showLeftNav} setLeftNav={setLeftNav} language={language} />
            </Box>
          )}

          {/* Chat Content Area - Always visible */}
          <Box
            sx={{
              flexGrow: 1,
              height: "100%",
              backgroundColor: CHAT_BODY_BACKGROUND,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Chat Header */}
            <Box
              sx={{
                flexShrink: 0,
                padding: {
                  xs: "0.5rem 1rem",
                  sm: "0.75rem 2rem",
                  md: "1rem 3rem",
                  lg: "1rem 4rem",
                },
              }}
            >
              <ChatHeader language={language} />
            </Box>

            {/* Chat Body */}
            <Box
              sx={{
                flex: "1 1 auto",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative",
                minHeight: 0,
                padding: {
                  xs: "0 1rem",
                  sm: "0 2rem",
                  md: "0 3rem",
                  lg: "0 4rem",
                },
              }}
            >
              <ChatBody language={language} />
            </Box>
          </Box>
        </Box>

        {/* Admin Dashboard Modal */}
        {showAdmin && (
          <>
            <Backdrop
              open={showAdmin}
              onClick={() => setShowAdmin(false)}
              sx={{ zIndex: 1200 }}
            />
            <AdminDashboard 
              language={language}
              onClose={() => setShowAdmin(false)}
            />
          </>
        )}
      </Box>
    </ThemeProvider>
  )
}

export default App;