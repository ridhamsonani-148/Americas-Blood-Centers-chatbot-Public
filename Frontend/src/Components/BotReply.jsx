import { Grid, Avatar, Typography, Box, Link } from "@mui/material"
import { BOTMESSAGE_BACKGROUND } from "../utilities/constants"

function BotReply({ message, sources }) {
  const formatMessageText = (text) => {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #B71C1C; text-decoration: underline;">$1</a>');
  };

  return (
    <Grid container direction="row" justifyContent="flex-start" alignItems="flex-end" sx={{ marginTop: "1.5rem" }}>
      <Grid item>
        <Avatar 
          alt="Bot Avatar" 
          sx={{ 
            width: 40, 
            height: 40, 
            backgroundColor: "#B71C1C",
            color: "white",
            fontWeight: "bold"
          }}
        >
          ABC
        </Avatar>
      </Grid>
      <Grid
        item
        className="botMessage"
        sx={{
          backgroundColor: BOTMESSAGE_BACKGROUND,
          maxWidth: "75%", // Ensure maximum width
          wordBreak: "break-word", // Break words to prevent overflow
          overflowWrap: "break-word", // Ensure words wrap properly
          whiteSpace: "pre-wrap", // Preserve whitespace but allow wrapping
          marginLeft: "0.5rem",
          padding: "0.75rem 1rem",
          borderRadius: "1rem 1rem 1rem 0.25rem",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            wordBreak: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
          dangerouslySetInnerHTML={{ __html: formatMessageText(message) }}
        />
        
        {sources && sources.length > 0 && (
          <Box sx={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #E0E0E0" }}>
            <Typography variant="caption" sx={{ fontWeight: "bold", color: "#666" }}>
              Sources:
            </Typography>
            {sources.map((source, index) => (
              <Box key={index} sx={{ marginTop: "0.25rem" }}>
                <Link
                  href={source.uri || source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: "0.75rem",
                    color: "#B71C1C",
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  {source.title || source.uri || `Source ${index + 1}`}
                </Link>
              </Box>
            ))}
          </Box>
        )}
      </Grid>
    </Grid>
  )
}

export default BotReply