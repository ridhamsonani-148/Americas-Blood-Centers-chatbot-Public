import React from "react"
import { 
  Box, 
  Typography, 
  Avatar, 
  Link,
  Button
} from "@mui/material"
import { OpenInNew as OpenInNewIcon } from "@mui/icons-material"
import { 
  PRIMARY_MAIN,
  SECONDARY_MAIN,
  WHITE,
  LIGHT_BACKGROUND
} from "../utilities/constants"

function BotReply({ message, sources = [], currentLanguage }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}>
      {/* Bot Avatar */}
      <Avatar
        sx={{
          width: 36,
          height: 36,
          backgroundColor: PRIMARY_MAIN,
          flexShrink: 0,
        }}
      >
        <img 
          src="/logo.png" 
          alt="America's Blood Centers Logo" 
          style={{ 
            width: "20px", 
            height: "20px",
            objectFit: "contain"
          }} 
        />
      </Avatar>

      {/* Message Content with Blue Left Border */}
      <Box 
        sx={{ 
          flex: 1, 
          maxWidth: "calc(100% - 50px)",
          borderLeft: `4px solid ${PRIMARY_MAIN}`,
          paddingLeft: "1rem",
          backgroundColor: LIGHT_BACKGROUND,
          borderRadius: "0 8px 8px 0",
          padding: "1rem",
          marginLeft: "0.5rem",
        }}
      >
        {/* Message Text */}
        <Typography
          variant="body1"
          sx={{
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: "#333",
            mb: sources.length > 0 ? 2 : 0,
          }}
        >
          {message}
        </Typography>

        {/* Learn More Button (if it's a structured response) */}
        {message.includes("eligibility") || message.includes("requirements") ? (
          <Button
            variant="contained"
            size="small"
            sx={{
              backgroundColor: "#DC3545",
              color: WHITE,
              borderRadius: "4px",
              textTransform: "none",
              fontSize: "0.8rem",
              mb: sources.length > 0 ? 2 : 0,
              "&:hover": {
                backgroundColor: "#C82333",
              },
            }}
          >
            Learn More →
          </Button>
        ) : null}

        {/* Sources */}
        {sources && sources.length > 0 && (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#666",
                  fontWeight: "medium",
                  fontSize: "0.85rem",
                }}
              >
                📄 {currentLanguage === "es" ? "Fuente" : "Source"}
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {sources.slice(0, 3).map((source, index) => (
                <Box key={index}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#666",
                      fontSize: "0.8rem",
                      mb: 0.5,
                    }}
                  >
                    {source.title || `Source ${index + 1}`}
                  </Typography>
                  <Button
                    component={Link}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                    endIcon={<OpenInNewIcon sx={{ fontSize: "0.8rem" }} />}
                    sx={{
                      borderColor: PRIMARY_MAIN,
                      color: PRIMARY_MAIN,
                      fontSize: "0.75rem",
                      textTransform: "none",
                      borderRadius: "4px",
                      "&:hover": {
                        borderColor: SECONDARY_MAIN,
                        color: SECONDARY_MAIN,
                        backgroundColor: "rgba(0, 97, 164, 0.05)",
                      },
                    }}
                  >
                    Open Source
                  </Button>
                </Box>
              ))}
            </Box>
            
            {sources.length > 3 && (
              <Typography
                variant="caption"
                sx={{
                  color: "#666",
                  mt: 1,
                  display: "block",
                  fontSize: "0.75rem",
                }}
              >
                {currentLanguage === "es" 
                  ? `+${sources.length - 3} fuentes más`
                  : `+${sources.length - 3} more sources`
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