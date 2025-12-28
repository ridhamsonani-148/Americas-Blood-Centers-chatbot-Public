import React, { useState, useEffect } from "react"
import { ThemeProvider } from "@mui/material/styles"
import { CssBaseline, Box, useMediaQuery, Drawer, IconButton } from "@mui/material"
import { Menu as MenuIcon } from "@mui/icons-material"
import theme from "./theme"
import LeftNav from "./Components/LeftNav"
import ChatBody from "./Components/ChatBody"
import { WHITE, LIGHT_BACKGROUND, PRIMARY_MAIN } from "./utilities/constants"

function App() {
  const [currentLanguage, setCurrentLanguage] = useState("en")
  const [showLeftNav, setLeftNav] = useState(true)
  const isMobile = useMediaQuery("(max-width:768px)")
  const isSmallScreen = useMediaQuery("(max-width:600px)")

  const toggleLanguage = () => {
    setCurrentLanguage(currentLanguage === "en" ? "es" : "en")
  }

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
        {/* Main Content Area - No AppHeader */}
        <Box
          sx={{
            height: "100vh", // Full viewport height
            display: "flex",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Mobile Drawer */}
          {isSmallScreen && (
            <Drawer
              variant="temporary"
              open={showLeftNav}
              onClose={() => setLeftNav(false)}
              ModalProps={{ keepMounted: true }}
              sx={{
                "& .MuiDrawer-paper": {
                  width: "280px",
                  backgroundColor: WHITE,
                  boxSizing: "border-box",
                },
              }}
            >
              <LeftNav 
                showLeftNav={true} 
                setLeftNav={setLeftNav}
                currentLanguage={currentLanguage}
              />
            </Drawer>
          )}

          {/* Desktop Overlay Drawer */}
          {!isSmallScreen && (
            <Drawer
              variant="temporary"
              open={showLeftNav}
              onClose={() => setLeftNav(false)}
              sx={{
                "& .MuiDrawer-paper": {
                  width: "300px",
                  backgroundColor: WHITE,
                  boxSizing: "border-box",
                },
              }}
            >
              <LeftNav 
                showLeftNav={true} 
                setLeftNav={setLeftNav}
                currentLanguage={currentLanguage}
              />
            </Drawer>
          )}

          {/* Floating Menu Button - Show when left nav is closed */}
          {!showLeftNav && (
            <IconButton
              onClick={() => setLeftNav(true)}
              sx={{
                position: "fixed",
                top: "20px",
                left: "20px",
                zIndex: 1000,
                backgroundColor: PRIMARY_MAIN,
                color: WHITE,
                width: "48px",
                height: "48px",
                boxShadow: "0 4px 12px rgba(0, 97, 164, 0.3)",
                "&:hover": {
                  backgroundColor: "#004d85",
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Chat Content Area - Always visible */}
          <Box
            sx={{
              flexGrow: 1,
              height: "100%",
              backgroundColor: LIGHT_BACKGROUND,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                flex: "1 1 auto",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative",
                minHeight: 0,
              }}
            >
              <ChatBody 
                currentLanguage={currentLanguage}
                toggleLanguage={toggleLanguage}
                showLeftNav={showLeftNav}
                setLeftNav={setLeftNav}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App