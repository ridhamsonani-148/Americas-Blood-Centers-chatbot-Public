import React from "react"
import { Box, Typography, Avatar } from "@mui/material"
import { Person as PersonIcon } from "@mui/icons-material"
import { PRIMARY_MAIN, WHITE } from "../utilities/constants"

function UserReply({ message }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", gap: 1, mb: 2 }}>
      {/* Message Content */}
      <Box
        sx={{
          maxWidth: "75%",
          padding: "0.75rem 1rem",
          backgroundColor: PRIMARY_MAIN,
          color: WHITE,
          borderRadius: "20px 20px 5px 20px",
          boxShadow: "0 2px 8px rgba(0, 97, 164, 0.2)",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: "0.95rem",
          }}
        >
          {message}
        </Typography>
      </Box>

      {/* User Avatar */}
      <Avatar
        sx={{
          width: 36,
          height: 36,
          backgroundColor: PRIMARY_MAIN,
          color: WHITE,
          flexShrink: 0,
        }}
      >
        <PersonIcon sx={{ fontSize: "1.2rem" }} />
      </Avatar>
    </Box>
  )
}

export default UserReply