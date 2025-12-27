import React from "react"
import { Box, Typography, Avatar, Paper } from "@mui/material"
import { Person as PersonIcon } from "@mui/icons-material"
import { USERMESSAGE_BACKGROUND, SECONDARY_MAIN, WHITE } from "../utilities/constants"

function UserReply({ message }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", gap: 1, mb: 2 }}>
      {/* Message Content */}
      <Paper
        elevation={1}
        sx={{
          maxWidth: "75%",
          padding: "1rem",
          backgroundColor: USERMESSAGE_BACKGROUND,
          borderRadius: "1rem 1rem 0.25rem 1rem",
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

      {/* User Avatar */}
      <Avatar
        sx={{
          width: 40,
          height: 40,
          backgroundColor: SECONDARY_MAIN,
          color: WHITE,
          flexShrink: 0,
        }}
      >
        <PersonIcon />
      </Avatar>
    </Box>
  )
}

export default UserReply