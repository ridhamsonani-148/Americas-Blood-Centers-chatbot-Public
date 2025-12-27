import React, { useState } from "react"
import { 
  Box, 
  Typography, 
  IconButton, 
  Button, 
  Drawer
} from "@mui/material"
import { Menu as MenuIcon, Settings as SettingsIcon } from "@mui/icons-material"
import LeftPanel from "./LeftPanel"
import { 
  getCurrentText, 
  PRIMARY_MAIN, 
  WHITE
} from "../utilities/constants"

function ChatHeader({ currentLanguage, toggleLanguage, isMobile }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const TEXT = getCurrentText(currentLanguage)

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.5rem",
          backgroundColor: WHITE,
          borderBottom: "1px solid #E0E0E0",
          minHeight: "70px",
        }}
      >
        {/* Left side - Logo and Menu */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {isMobile && (
            <IconButton
              onClick={handleMobileMenuToggle}
              sx={{ mr: 1, color: PRIMARY_MAIN }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <img 
            src="/logo.png" 
            alt="America's Blood Centers Logo" 
            style={{ 
              width: "32px", 
              height: "32px",
              objectFit: "contain"
            }} 
          />
          <Typography
            variant="h6"
            sx={{
              ml: 1,
              color: PRIMARY_MAIN,
              fontWeight: "bold",
              fontSize: isMobile ? "1rem" : "1.2rem",
            }}
          >
            {TEXT.CHAT_HEADER_TITLE}
          </Typography>
        </Box>

        {/* Right side - Language toggle and settings */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isMobile && (
            <Button
              variant="outlined"
              size="small"
              onClick={toggleLanguage}
              sx={{
                color: PRIMARY_MAIN,
                borderColor: PRIMARY_MAIN,
                minWidth: "40px",
                "&:hover": {
                  borderColor: PRIMARY_MAIN,
                  backgroundColor: "rgba(204, 35, 69, 0.1)",
                },
              }}
            >
              {TEXT.LANGUAGE_TOGGLE}
            </Button>
          )}
          
          <IconButton sx={{ color: PRIMARY_MAIN }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
        sx={{
          "& .MuiDrawer-paper": {
            width: "280px",
          },
        }}
      >
        <LeftPanel
          currentLanguage={currentLanguage}
          toggleLanguage={toggleLanguage}
          onClose={handleMobileMenuToggle}
        />
      </Drawer>
    </>
  )
}

export default ChatHeader