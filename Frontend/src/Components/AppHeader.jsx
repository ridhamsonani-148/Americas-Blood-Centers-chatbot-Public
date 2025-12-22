"use client"

import { AppBar, Toolbar, Box, Typography, useMediaQuery, IconButton } from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import SettingsIcon from "@mui/icons-material/Settings"
import AmericasBloodCentersLogo from "../Assets/AmericasBloodCentersLogo"
import LanguageSelector from "./LanguageSelector"
import { PRIMARY_MAIN, CHAT_BODY_BACKGROUND, CHAT_LEFT_PANEL_BACKGROUND, primary_50 } from "../utilities/constants"

function AppHeader({ showLeftNav, setLeftNav, language, setLanguage, showAdmin, setShowAdmin }) {
  const isSmallScreen = useMediaQuery("(max-width:600px)")

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: CHAT_LEFT_PANEL_BACKGROUND,
        height: isSmallScreen ? "4rem" : "5rem",
        boxShadow: "none",
        borderBottom: `1.5px solid ${primary_50}`,
      }}
    >
      <Toolbar
        sx={{
          height: "100%",
          padding: {
            xs: "0 0.5rem",
            sm: "0 1rem",
            md: "0 2rem",
            lg: "0 3rem",
          },
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* Left side with menu button (small screens) and logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isSmallScreen && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setLeftNav(true)}
              sx={{ color: CHAT_BODY_BACKGROUND }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <AmericasBloodCentersLogo 
            color={CHAT_BODY_BACKGROUND}
            width={isSmallScreen ? 50 : 100}
            height={isSmallScreen ? 40 : 70}
          />
          <Typography
            variant={isSmallScreen ? "h5" : "h5"}
            sx={{
              fontWeight: "bold",
              color: CHAT_BODY_BACKGROUND,
              fontSize: isSmallScreen ? "1rem" : "1.5rem",
              whiteSpace: "nowrap",
            }}
          >
            America's Blood Centers
          </Typography>
        </Box>

        {/* Right side with language selector and admin button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LanguageSelector language={language} setLanguage={setLanguage} />
          <IconButton
            color="inherit"
            aria-label="admin settings"
            onClick={() => setShowAdmin(!showAdmin)}
            sx={{ 
              color: CHAT_BODY_BACKGROUND,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default AppHeader