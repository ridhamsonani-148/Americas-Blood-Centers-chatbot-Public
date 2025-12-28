import { useState } from "react"
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
  const [showAllSources, setShowAllSources] = useState(false)
  
  // Function to get clean display name for sources
  const getDisplayName = (source) => {
    // Handle S3 presigned URLs and regular URLs
    let cleanUrl = source.url
    
    // For S3 presigned URLs, extract the original path before query parameters
    if (source.url.includes('amazonaws.com') && source.url.includes('?')) {
      cleanUrl = source.url.split('?')[0]
    }
    
    // For PDFs, show the filename without extension
    if (cleanUrl.includes('.pdf')) {
      const filename = cleanUrl.split('/').pop()
      return filename.replace('.pdf', '')
    }
    
    // For websites, use title if available and not generic, otherwise show clean URL
    if (source.title && source.title !== "Web Page") {
      return source.title
    }
    
    // Fallback: show clean hostname and path from URL
    try {
      const urlObj = new URL(cleanUrl)
      const hostname = urlObj.hostname.replace('www.', '')
      const pathname = urlObj.pathname
      
      // For S3 URLs, just show the filename
      if (hostname.includes('amazonaws.com')) {
        const filename = pathname.split('/').pop()
        return filename.replace('.pdf', '')
      }
      
      // For regular websites, show hostname + path
      return hostname + pathname
    } catch (e) {
      // If URL parsing fails, try to extract filename from the end
      const parts = cleanUrl.split('/')
      const lastPart = parts[parts.length - 1]
      return lastPart.replace('.pdf', '') || cleanUrl
    }
  }
  
  const displayedSources = showAllSources ? sources : sources.slice(0, 3)
  const remainingSources = sources.length - 3
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
            <Typography
              variant="body2"
              sx={{
                color: "#666",
                fontWeight: "medium",
                fontSize: "0.85rem",
                mb: 1,
              }}
            >
              📄 {currentLanguage === "es" ? "Fuentes" : "Sources"}
            </Typography>
            
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {displayedSources.map((source, index) => (
                <Box key={index} sx={{ 
                  padding: "0.5rem",
                  backgroundColor: "#F8F9FA",
                  borderRadius: "4px",
                  border: "1px solid #E0E0E0"
                }}>
                  <Link
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: PRIMARY_MAIN,
                      fontSize: "0.8rem",
                      fontWeight: "medium",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      "&:hover": {
                        color: SECONDARY_MAIN,
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {/* Show PDF or web icon */}
                    {source.url.includes('.pdf') ? '📄' : '🌐'}
                    
                    {/* Show meaningful display name */}
                    {getDisplayName(source)}
                    
                    <OpenInNewIcon sx={{ fontSize: "0.7rem", ml: 0.5 }} />
                  </Link>
                </Box>
              ))}
            </Box>
            
            {/* Show remaining sources count and expand button */}
            {remainingSources > 0 && (
              <Button
                variant="text"
                size="small"
                onClick={() => setShowAllSources(!showAllSources)}
                sx={{
                  color: PRIMARY_MAIN,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  mt: 0.5,
                  padding: "2px 4px",
                  "&:hover": {
                    backgroundColor: "rgba(0, 97, 164, 0.05)",
                  },
                }}
              >
                {showAllSources 
                  ? (currentLanguage === "es" ? "Mostrar menos" : "Show less")
                  : (currentLanguage === "es" 
                      ? `+${remainingSources} fuentes más` 
                      : `+${remainingSources} more sources`)
                }
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default BotReply