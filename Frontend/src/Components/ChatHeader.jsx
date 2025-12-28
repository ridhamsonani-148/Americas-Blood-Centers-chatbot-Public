import Typography from "@mui/material/Typography"
import { getCurrentText, HEADER_TEXT_GRADIENT } from "../utilities/constants"
import { Box, Container, useMediaQuery } from "@mui/material"

function ChatHeader({ currentLanguage }) {
  const isSmallScreen = useMediaQuery("(max-width:600px)")
  const TEXT = getCurrentText(currentLanguage)

  return (
    <Container
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "auto",
        padding: "0 !important",
        marginTop: "0.5rem",
        marginBottom: isSmallScreen ? "1rem" : "1.5rem",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: isSmallScreen ? 1 : 2,
        }}
      >
        <Typography
          variant={isSmallScreen ? "h5" : "h4"}
          className="chatHeaderText"
          sx={{
            color: HEADER_TEXT_GRADIENT,
            fontWeight: "bold",
            fontSize: isSmallScreen ? "1.25rem" : "2rem",
            textAlign: "center",
          }}
        >
          {TEXT.CHAT_HEADER_TITLE}
        </Typography>
      </Box>
    </Container>
  )
}

export default ChatHeader