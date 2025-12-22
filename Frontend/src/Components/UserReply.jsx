import { Grid, Avatar, Typography } from "@mui/material"
import { USERMESSAGE_BACKGROUND } from "../utilities/constants"

function UserReply({ message }) {
  return (
    <Grid container direction="row" justifyContent="flex-end" alignItems="flex-end" sx={{ marginTop: "1.5rem" }}>
      <Grid
        item
        className="userMessage"
        sx={{
          backgroundColor: USERMESSAGE_BACKGROUND,
          maxWidth: "75%", // Ensure maximum width
          wordBreak: "break-word", // Break words to prevent overflow
          overflowWrap: "break-word", // Ensure words wrap properly
          whiteSpace: "pre-wrap", // Preserve whitespace but allow wrapping
          marginRight: "0.5rem",
          padding: "0.75rem 1rem",
          borderRadius: "1rem 1rem 0.25rem 1rem",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            wordBreak: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {message}
        </Typography>
      </Grid>
      <Grid item>
        <Avatar 
          alt="User Avatar" 
          sx={{ 
            width: 40, 
            height: 40, 
            backgroundColor: "#1976D2",
            color: "white",
            fontWeight: "bold"
          }}
        >
          U
        </Avatar>
      </Grid>
    </Grid>
  )
}

export default UserReply