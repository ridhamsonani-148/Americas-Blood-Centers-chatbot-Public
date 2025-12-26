import Typography from "@mui/material/Typography"
import { getCurrentText, HEADER_TEXT_GRADIENT } from "../utilities/constants"
import { Box, useMediaQuery } from "@mui/material"

function ChatHeader({ language = 'en' }) {
  const TEXT = getCurrentText(language)
  const isSmallScreen = useMediaQuery("(max-width:600px)")

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        marginBottom: isSmallScreen ? "1rem" : "1.5rem",
      }}
    >
      <Typography
        variant={isSmallScreen ? "h5" : "h4"}
        sx={{
          color: HEADER_TEXT_GRADIENT,
          fontWeight: "bold",
          fontSize: isSmallScreen ? "1.5rem" : "2.25rem",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {TEXT.CHAT_HEADER_TITLE}
      </Typography>
    </Box>
  )
}

export default ChatHeader