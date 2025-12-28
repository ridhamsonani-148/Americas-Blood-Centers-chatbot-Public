import React from "react"
import { AppBar, Toolbar, Button, Box, Typography, useMediaQuery, IconButton, ButtonGroup } from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import { PRIMARY_MAIN, CHAT_BODY_BACKGROUND, WHITE, DARK_BLUE } from "../utilities/constants"

function AppHeader({ showLeftNav, setLeftNav, currentLanguage, toggleLanguage }) {
  const isSmallScreen = useMediaQuery("(max-width:600px)")

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: WHITE,
        height: isSmallScreen ? "4rem" : "5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        borderBottom: "1px solid #E0E0E0",
      }}
    >
      <Toolbar
        sx={{
          height: "100%",
          padding: {
            xs: "0 1rem",
            sm: "0 2rem",
            md: "0 3rem",
            lg: "0 4rem",
          },
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* Left side with menu button (small screens) and logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isSmallScreen && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setLeftNav(true)}
              sx={{ color: PRIMARY_MAIN }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <img
            src="/logo.png"
            alt="America's Blood Centers"
            width={isSmallScreen ? "100" : "200px"}
            height={isSmallScreen ? "75" : "80"}
            style={{ objectFit: "contain" }}
          />
        </Box>

        {/* Right side - EN|ES Language Toggle */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ButtonGroup
            variant="outlined"
            size="small"
            sx={{
              "& .MuiButton-root": {
                minWidth: "40px",
                padding: "6px 12px",
                fontSize: "0.875rem",
                fontWeight: "bold",
                border: `1px solid ${DARK_BLUE}`,
                color: DARK_BLUE,
                backgroundColor: WHITE,
                "&:hover": {
                  backgroundColor: DARK_BLUE,
                  color: WHITE,
                },
              },
              "& .MuiButton-root.active": {
                backgroundColor: DARK_BLUE,
                color: WHITE,
                "&:hover": {
                  backgroundColor: DARK_BLUE,
                },
              },
            }}
          >
            <Button
              className={currentLanguage === "en" ? "active" : ""}
              onClick={() => currentLanguage !== "en" && toggleLanguage()}
            >
              EN
            </Button>
            <Button
              className={currentLanguage === "es" ? "active" : ""}
              onClick={() => currentLanguage !== "es" && toggleLanguage()}
            >
              ES
            </Button>
          </ButtonGroup>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default AppHeader