import React from "react"
import { Box, Typography, List, ListItem, ListItemText, Button, IconButton } from "@mui/material"
import { Close as CloseIcon } from "@mui/icons-material"
import { 
  getCurrentText, 
  CHAT_LEFT_PANEL_BACKGROUND, 
  WHITE
} from "../utilities/constants"

function LeftPanel({ currentLanguage, toggleLanguage, onClose }) {
  const TEXT = getCurrentText(currentLanguage)

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        backgroundColor: CHAT_LEFT_PANEL_BACKGROUND,
        color: WHITE,
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Close button for mobile */}
      {onClose && (
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: WHITE,
          }}
        >
          <CloseIcon />
        </IconButton>
      )}

      {/* Logo and Title */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <img 
          src="/logo.png" 
          alt="America's Blood Centers Logo" 
          style={{ 
            width: "40px", 
            height: "40px",
            objectFit: "contain"
          }} 
        />
        <Typography
          variant="h6"
          sx={{
            ml: 1,
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          America's Blood Centers
        </Typography>
      </Box>

      {/* Language Toggle */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={toggleLanguage}
          sx={{
            color: WHITE,
            borderColor: WHITE,
            "&:hover": {
              borderColor: WHITE,
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          {TEXT.LANGUAGE_TOGGLE}
        </Button>
      </Box>

      {/* About Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            mb: 2,
            fontSize: "1.1rem",
          }}
        >
          {TEXT.ABOUT_TITLE}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            lineHeight: 1.5,
            fontSize: "0.9rem",
            opacity: 0.9,
          }}
        >
          {TEXT.ABOUT_TEXT}
        </Typography>
      </Box>

      {/* FAQs Section */}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            mb: 2,
            fontSize: "1.1rem",
          }}
        >
          {TEXT.FAQS_TITLE}
        </Typography>
        <List sx={{ p: 0 }}>
          {TEXT.FAQ_QUESTIONS.map((question, index) => (
            <ListItem
              key={index}
              sx={{
                p: 0,
                mb: 1,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "4px",
                },
              }}
            >
              <ListItemText
                primary={question}
                primaryTypographyProps={{
                  fontSize: "0.85rem",
                  lineHeight: 1.4,
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  )
}

export default LeftPanel