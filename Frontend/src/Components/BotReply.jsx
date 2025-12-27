import React from "react"
import { 
  Box, 
  Typography, 
  Avatar, 
  Link,
  Chip,
  Paper
} from "@mui/material"
import { OpenInNew as OpenInNewIcon } from "@mui/icons-material"
import { 
  BOTMESSAGE_BACKGROUND, 
  PRIMARY_MAIN,
  SECONDARY_MAIN
} from "../utilities/constants"

function BotReply({ message, sources = [], currentLanguage }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 2 }}>
      {/* Bot Avatar */}
      <Avatar
        sx={{
          width: 40,
          height: 40,
          backgroundColor: PRIMARY_MAIN,
          flexShrink: 0,
        }}
      >
        <img 
          src="/logo.png" 
          alt="America's Blood Centers Logo" 
          style={{ 
            width: "24px", 
            height: "24px",
            objectFit: "contain"
          }} 
        />
      </Avatar>

      {/* Message Content */}
      <Box sx={{ flex: 1, maxWidth: "calc(100% - 50px)" }}>
        {/* Message Text */}
        <Paper
          elevation={1}
          sx={{
            padding: "1rem",
            backgroundColor: BOTMESSAGE_BACKGROUND,
            borderRadius: "1rem 1rem 1rem 0.25rem",
            mb: sources.length > 0 ? 1 : 0,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {message}
          </Typography>
        </Paper>

        {/* Sources */}
        {sources && sources.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#666",
                mb: 1,
                display: "block",
                fontWeight: "medium",
              }}
            >
              {currentLanguage === "es" ? "Fuentes:" : "Sources:"}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {sources.slice(0, 5).map((source, index) => (
                <Chip
                  key={index}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                        {source.title || `Source ${index + 1}`}
                      </Typography>
                      <OpenInNewIcon sx={{ fontSize: "0.7rem" }} />
                    </Box>
                  }
                  component={Link}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: SECONDARY_MAIN,
                    color: SECONDARY_MAIN,
                    fontSize: "0.7rem",
                    height: "24px",
                    textDecoration: "none",
                    "&:hover": {
                      borderColor: PRIMARY_MAIN,
                      color: PRIMARY_MAIN,
                      backgroundColor: "rgba(204, 35, 69, 0.05)",
                      textDecoration: "none",
                    },
                  }}
                />
              ))}
            </Box>
            {sources.length > 5 && (
              <Typography
                variant="caption"
                sx={{
                  color: "#666",
                  mt: 0.5,
                  display: "block",
                  fontSize: "0.7rem",
                }}
              >
                {currentLanguage === "es" 
                  ? `+${sources.length - 5} fuentes más`
                  : `+${sources.length - 5} more sources`
                }
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default BotReply